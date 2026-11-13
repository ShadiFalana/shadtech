import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_TOKEN_TTL_MS } from './auth.constants';
import { toPublicUser, type PublicUser } from './auth.types';
import { getDummyPasswordHash, hashPassword, verifyPassword } from './password.util';
import { createRefreshToken, hashRefreshToken } from './refresh-token.util';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async getStatus(): Promise<{ initialized: boolean }> {
    const users = await this.prisma.user.count();
    return { initialized: users > 0 };
  }

  /**
   * Creates the very first platform administrator. Once an account exists,
   * registration stays closed until tenant/user management lands in step 6.
   */
  async register(
    input: { fullName: string; email: string; password: string },
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const users = await this.prisma.user.count();
    if (users > 0) {
      throw new ForbiddenException('Registration is closed; an administrator already exists');
    }

    const email = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: input.fullName.trim(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    this.logger.log(`Bootstrap administrator created: ${email}`);
    return this.startSession(user, meta);
  }

  async login(input: { email: string; password: string }, meta: RequestMeta): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always run scrypt so response timing does not reveal whether an email exists.
    const storedHash = user?.passwordHash ?? (await getDummyPasswordHash());
    const passwordMatches = await verifyPassword(input.password, storedHash);

    if (!user || !passwordMatches || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.startSession(updated, meta);
  }

  async refresh(refreshToken: string | undefined, meta: RequestMeta): Promise<AuthResult> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    // Rotation: a refresh token can only be used once.
    const revoked = await this.prisma.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count === 0) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    return this.startSession(session.user, meta);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }
    await this.prisma.refreshSession.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is not available');
    }
    return toPublicUser(user);
  }

  private async startSession(user: User, meta: RequestMeta): Promise<AuthResult> {
    const refreshToken = createRefreshToken();

    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        userAgent: meta.userAgent?.slice(0, 300),
        ipAddress: meta.ipAddress?.slice(0, 64),
      },
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      sid: session.id,
    });

    return {
      accessToken,
      refreshToken,
      user: toPublicUser(user),
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../tenancy/current-tenant.decorator';
import { RequirePermissions } from '../tenancy/permissions.decorator';
import { PermissionsGuard } from '../tenancy/permissions.guard';
import { TenantContextGuard } from '../tenancy/tenant-context.guard';
import type { TenantContext } from '../tenancy/tenancy.types';
import { ChatbotService } from './chatbot.service';
import { AskChatDto } from './dto/chat.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Post('ask')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('chatbot.read')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  ask(@Body() dto: AskChatDto, @CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    return this.chatbot.ask(tenant.id, user.id, dto.question);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('chatbot.read')
  history(@Query('limit') limit: string | undefined, @CurrentTenant() tenant: TenantContext) {
    return this.chatbot.history(tenant.id, limit ? Number(limit) : 20);
  }
}

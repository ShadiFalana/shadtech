import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { TicketPriority, TicketStatus, TicketType } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @Length(2, 200, { message: 'title must be between 2 and 200 characters' })
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'assigneeId must be a valid UUID',
  })
  assigneeId?: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @Length(2, 200, { message: 'title must be between 2 and 200 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'assigneeId must be a valid UUID',
  })
  assigneeId?: string | null;
}

export class CreateCommentDto {
  @IsString()
  @Length(1, 5000, { message: 'body must be between 1 and 5000 characters' })
  body!: string;

  @IsOptional()
  internal?: boolean;
}

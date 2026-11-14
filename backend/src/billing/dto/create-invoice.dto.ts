import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  customerId?: string;

  @IsString()
  @Length(1, 40)
  number!: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  customerId?: string | null;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string | null;
}

export class AddInvoiceItemDto {
  @IsString()
  @Length(1, 200)
  description!: string;

  @IsOptional()
  quantity?: number;

  @IsOptional()
  unitPrice?: number;
}

export class RecordPaymentDto {
  @IsOptional()
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  sku?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  category?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  sku?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  category?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  unit?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  isActive?: boolean;
}

export class RecordMovementDto {
  @IsString()
  type!: 'IN' | 'OUT' | 'ADJUST';

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

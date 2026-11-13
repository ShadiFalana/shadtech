import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @Length(2, 120, { message: 'name must be between 2 and 120 characters' })
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(3, 40, { message: 'phone must be between 3 and 40 characters' })
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120, { message: 'company must be between 2 and 120 characters' })
  company?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000, { message: 'notes must be at most 2000 characters' })
  notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(2, 120, { message: 'name must be between 2 and 120 characters' })
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @Length(3, 40, { message: 'phone must be between 3 and 40 characters' })
  phone?: string | null;

  @IsOptional()
  @IsString()
  @Length(2, 120, { message: 'company must be between 2 and 120 characters' })
  company?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 2000, { message: 'notes must be at most 2000 characters' })
  notes?: string | null;

  @IsOptional()
  isActive?: boolean;
}

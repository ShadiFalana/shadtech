import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @Length(2, 120, { message: 'name must be between 2 and 120 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 40, { message: 'code must be between 1 and 40 characters' })
  code?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @Length(2, 120, { message: 'name must be between 2 and 120 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40, { message: 'code must be between 1 and 40 characters' })
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

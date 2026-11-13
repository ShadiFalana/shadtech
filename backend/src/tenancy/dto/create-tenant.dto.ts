import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Length(2, 120, { message: 'name must be between 2 and 120 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @Length(3, 40, { message: 'slug must be between 3 and 40 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug may only contain lowercase letters, numbers and single dashes',
  })
  slug?: string;
}

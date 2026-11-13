import { IsString, Length } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @Length(2, 120, { message: 'name must be between 2 and 120 characters' })
  name!: string;
}

import { IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 120, { message: 'fullName must be between 2 and 120 characters' })
  fullName!: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(1, 128)
  currentPassword!: string;

  @IsString()
  @Length(8, 128, { message: 'newPassword must be between 8 and 128 characters' })
  newPassword!: string;
}

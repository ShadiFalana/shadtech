import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(8, 128, { message: 'newPassword must be between 8 and 128 characters' })
  newPassword!: string;
}

import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 120, { message: 'fullName must be between 2 and 120 characters' })
  fullName!: string;

  @IsString()
  @Length(8, 128, { message: 'password must be between 8 and 128 characters' })
  password!: string;

  @IsString()
  @Length(2, 40, { message: 'roleKey must be between 2 and 40 characters' })
  roleKey!: string;
}

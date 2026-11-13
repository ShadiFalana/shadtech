import { IsString, Length } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @Length(2, 40, { message: 'roleKey must be between 2 and 40 characters' })
  roleKey!: string;
}

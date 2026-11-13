import { IsDefined } from 'class-validator';

export class SetTenantSettingDto {
  @IsDefined()
  value!: unknown;
}

import { IsString, Length } from 'class-validator';

export class AskChatDto {
  @IsString()
  @Length(1, 2000)
  question!: string;
}

import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  title: string;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  title: string;
}

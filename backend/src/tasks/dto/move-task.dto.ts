import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @IsUUID()
  @IsNotEmpty()
  targetColumnId: string;

  @IsInt()
  @Min(0)
  targetOrder: number;
}

import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class AddMemberDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsEnum(Role, { message: 'Role must be EDITOR or VIEWER' })
  @IsOptional()
  role?: Role = Role.EDITOR;
}

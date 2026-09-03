import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(Role, { message: 'Role must be EDITOR or VIEWER' })
  @IsNotEmpty()
  role: Role;
}

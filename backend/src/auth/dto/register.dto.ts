import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
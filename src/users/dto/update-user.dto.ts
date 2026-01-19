import { IsEmail, IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  lastName?: string;

  @IsBoolean({ message: 'Active must be a boolean' })
  @IsOptional()
  active?: boolean;
}

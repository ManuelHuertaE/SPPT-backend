import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginClientDto {
  @ApiProperty({
    description: 'Teléfono o email del cliente',
    example: '+573121959638',
  })
  @IsString()
  @IsNotEmpty()
  phoneOrEmail: string;

  @ApiProperty({
    description: 'Contraseña del cliente',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
import { IsUUID, IsNotEmpty } from 'class-validator';

export class RegisterBusinessDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
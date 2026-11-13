import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateQrDto {
  @ApiProperty({
    description: 'Unique employee ID to generate fresh QR for',
    example: 'TMC-BD-0001',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;
}


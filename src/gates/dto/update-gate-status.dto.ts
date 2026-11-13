import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { GateStatus } from '../../entities/gate.entity';

export class UpdateGateStatusDto {
  @ApiProperty({ enum: GateStatus, example: GateStatus.ONLINE })
  @IsNotEmpty()
  @IsEnum(GateStatus)
  status: GateStatus;
}


import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QrCodesService } from './qr-codes.service';
import { ListQrCodesDto } from './dto/list-qr-codes.dto';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { UpdateQrStatusDto } from './dto/update-qr-status.dto';
import {
  PaginatedQrCodesResponseDto,
  QrCodeResponseDto,
} from './dto/qr-code-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('QR Codes Management (/qr-codes)')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
@Controller('qr-codes')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF, UserRole.SECURITY_GUARD)
  @ApiOperation({
    summary: 'List issued QR codes with filtering',
    description:
      'Filterable list of QR code credentials. Roles: Admin, HR, Security.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of QR codes',
    type: PaginatedQrCodesResponseDto,
  })
  async list(
    @Query() params: ListQrCodesDto,
  ): Promise<PaginatedQrCodesResponseDto> {
    return this.qrCodesService.list(params);
  }

  @Get('my-qr')
  @ApiOperation({
    summary: "Self-service endpoint for the logged-in employee's badge",
    description:
      'Returns the currently active QR credential for the authenticated employee persona.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Employee's active QR code badge",
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active QR code found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User not linked to an employee record',
  })
  async getMyQr(
    @CurrentUser('sub') userId: string,
    @CurrentUser('linkedEmployeeId') linkedEmployeeId?: string | null,
    @CurrentUser('email') email?: string,
  ): Promise<QrCodeResponseDto> {
    return this.qrCodesService.getMyQr(userId, linkedEmployeeId, email);
  }

  @Get('employee/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.HR_STAFF,
    UserRole.EMPLOYEE,
    UserRole.SECURITY_GUARD,
  )
  @ApiOperation({
    summary: 'Get currently active QR for an employee',
    description:
      'Fetches the valid active QR code for a specific employee ID. Roles: Admin, HR, Employee, Security.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active QR code details',
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active QR code found for employee',
  })
  async getByEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<QrCodeResponseDto> {
    return this.qrCodesService.getByEmployeeId(employeeId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @ApiOperation({
    summary: 'Get QR code details',
    description:
      'Retrieves metadata for a specific QR code ID. Roles: Admin, HR.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR code details',
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found',
  })
  async getById(@Param('id') id: string): Promise<QrCodeResponseDto> {
    return this.qrCodesService.getById(id);
  }

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Generate fresh QR for employee (auto-revokes previous active code)',
    description:
      'Issues a brand new active QR credential and automatically revokes previous active credentials. Roles: Admin, HR.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Fresh active QR code issued',
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
  })
  async generate(@Body() dto: GenerateQrDto): Promise<QrCodeResponseDto> {
    return this.qrCodesService.generate(dto);
  }

  @Post(':id/regenerate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate/re-issue QR payload',
    description:
      'Rotates the payload security token by re-issuing a new active code. Roles: Admin, HR, Employee.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Re-issued QR code',
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found',
  })
  async regenerate(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ): Promise<QrCodeResponseDto> {
    return this.qrCodesService.regenerate(id, userId, role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF, UserRole.SECURITY_GUARD)
  @ApiOperation({
    summary: 'Update QR status (ACTIVE, EXPIRED, REVOKED, SUSPENDED)',
    description: 'Explicitly overrides QR status. Roles: Admin, HR, Security.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR status updated',
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQrStatusDto,
  ): Promise<QrCodeResponseDto> {
    return this.qrCodesService.updateStatus(id, dto);
  }

  @Post(':id/revoke')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF, UserRole.SECURITY_GUARD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke a compromised or lost QR code',
    description:
      'Immediately revokes a compromised QR credential. Roles: Admin, HR, Security.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR code revoked',
    type: QrCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'QR code not found',
  })
  async revoke(@Param('id') id: string): Promise<QrCodeResponseDto> {
    return this.qrCodesService.revoke(id);
  }
}

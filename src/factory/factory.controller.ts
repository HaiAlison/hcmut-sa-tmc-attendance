import { Controller, Get, UseGuards } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';

@Controller('factory')
@ApiTags('Factory')
@ApiBearerAuth('Authorization')
export class FactoryController {
  constructor(private readonly factoryService: FactoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  async getFactories() {
    return await this.factoryService.getFactories();
  }
}

import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { FactoryController } from './factory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactoryEntity } from 'src/entities/factory.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FactoryEntity]), AuthModule],
  controllers: [FactoryController],
  providers: [FactoryService]
})
export class FactoryModule {}

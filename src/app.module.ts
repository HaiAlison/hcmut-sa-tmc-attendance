import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './utils/config/database/config.service';
import { join } from 'path';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { QrCodesModule } from './qr-codes/qr-codes.module';
import { GatesModule } from './gates/gates.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FactoryModule } from './factory/factory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.env'], isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    I18nModule.forRoot({
      fallbackLanguage: process.env.DEFAULT_LANGUAGE || 'en',
      loaderOptions: {
        path: join(__dirname, 'utils/i18n/'),
        watch: true,
      },
      resolvers: [new HeaderResolver(['x-language'])],
    }),
    UsersModule,
    AuthModule,
    EmployeesModule,
    QrCodesModule,
    GatesModule,
    AttendanceModule,
    FactoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

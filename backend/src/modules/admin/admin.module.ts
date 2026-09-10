import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment, Subscription, User, Workspace } from '@/database/entities';
import { SuperAdminGuard } from '@/common/guards/super-admin.guard';
import { PlatformStaffGuard } from '@/common/guards/platform-staff.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, User, Subscription, Payment]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.get('jwt.accessSecret') }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, SuperAdminGuard, PlatformStaffGuard, PermissionGuard],
})
export class AdminModule {}

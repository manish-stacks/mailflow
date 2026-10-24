import { Module } from '@nestjs/common';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { PlatformStaffGuard } from '@/common/guards/platform-staff.guard';
import { AdminDemoController, DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({
  controllers: [DemoController, AdminDemoController],
  providers: [DemoService, PlatformStaffGuard, PermissionGuard],
})
export class DemoModule {}

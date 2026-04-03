import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AdminController } from './admin.controller';
import { AdminUploadsController } from './admin-uploads.controller';
import { AdminUploadsService } from './admin-uploads.service';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminController, AdminUploadsController],
  providers: [AdminService, AdminBootstrapService, AdminUploadsService, RolesGuard],
})
export class AdminModule {}

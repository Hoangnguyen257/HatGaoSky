import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserDto, CreateAdminDto, UpdateSystemSettingDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin list and filter user accounts' })
  getUsers(@Query() query: { search?: string; role?: string; status?: string }) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin view user account detail' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update user profile' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Patch('users/:id/status')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin disable or re-enable user account' })
  toggleUserStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.toggleUserStatus(id, status);
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin soft-delete user account' })
  deleteUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.deleteUser(id, adminId);
  }

  @Get('admins')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin list all administrator accounts' })
  getAdmins() {
    return this.adminService.getAdmins();
  }

  @Post('admins')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin create a new administrator account' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Delete('admins/:id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete administrator account (safety check: cannot delete self or last admin)' })
  removeAdmin(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.removeAdmin(id, adminId);
  }

  @Get('logs')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin view system audit logs' })
  getAuditLogs(@Query() query: { action?: string; limit?: number }) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('emails')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin view dispatched sent emails log' })
  getSentEmails(@Query() query: { search?: string }) {
    return this.adminService.getSentEmails(query);
  }

  @Get('settings')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin view system settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update system setting' })
  updateSetting(@Body() dto: UpdateSystemSettingDto) {
    return this.adminService.updateSetting(dto);
  }

  @Delete('users/me/gdpr')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'GDPR user data anonymization request' })
  anonymizeMe(@CurrentUser('id') userId: string) {
    return this.adminService.anonymizeUser(userId);
  }
}

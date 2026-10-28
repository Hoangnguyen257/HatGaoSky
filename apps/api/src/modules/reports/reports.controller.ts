import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RevenueFilterDto, CreateExportJobDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reports & Dashboard')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff Manager view high-level KPI dashboard metrics and charts' })
  getDashboard(@Query('period') period?: string) {
    return this.reportsService.getDashboard(period);
  }

  @Get('revenue')
  @Roles('STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff Manager calculate revenue breakdown by time, cabin, and route' })
  calculateRevenue(@Query() query: RevenueFilterDto) {
    return this.reportsService.calculateRevenue(query);
  }

  @Get('staff')
  @Roles('STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff Manager view staff details and activity log history' })
  getStaffDetails() {
    return this.reportsService.getStaffDetails();
  }

  @Post('export')
  @Roles('STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export reports to Excel / PDF with ExportJob state machine' })
  createExportJob(@Body() dto: CreateExportJobDto, @CurrentUser('id') userId: string) {
    return this.reportsService.createExportJob(dto, userId);
  }
}

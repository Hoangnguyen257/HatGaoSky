import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RevenueFilterDto, CreateExportJobDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(period: string = 'MONTH') {
    const [staffCount, totalBookings, confirmedBookings, pendingRequests, activeFlights] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'STAFF', status: 'ACTIVE' } }),
        this.prisma.booking.count(),
        this.prisma.booking.findMany({
          where: { status: { in: ['CONFIRMED', 'COMPLETED', 'PARTIALLY_PAID'] } },
          select: { paidAmount: true, totalAmount: true },
        }),
        this.prisma.booking.count({ where: { status: 'PENDING_PAYMENT' } }),
        this.prisma.flight.count({ where: { isDisabled: false, status: 'SCHEDULED' } }),
      ]);

    const estimatedRevenue = confirmedBookings.reduce((sum, b) => sum + b.paidAmount, 0);

    // Mock trend chart data for visualization with Recharts
    const chartTrend = [
      { label: 'Tháng 5', bookings: 124, revenue: 320000000 },
      { label: 'Tháng 6', bookings: 189, revenue: 540000000 },
      { label: 'Tháng 7', bookings: 245, revenue: 710000000 },
      { label: 'Tháng 8', bookings: 210, revenue: 620000000 },
      { label: 'Tháng 9', bookings: 165, revenue: 480000000 },
      { label: 'Tháng 10', bookings: 280, revenue: 850000000 },
    ];

    // Cabin class distribution
    const cabinDistribution = [
      { name: 'Phổ thông (Economy)', value: 72, color: '#3b82f6' },
      { name: 'Thương gia (Business)', value: 24, color: '#8b5cf6' },
      { name: 'Hạng Nhất (First)', value: 4, color: '#f59e0b' },
    ];

    return {
      kpi: {
        staffCount,
        totalBookings,
        estimatedRevenue,
        pendingRequests,
        activeFlights,
      },
      chartTrend,
      cabinDistribution,
    };
  }

  async calculateRevenue(dto: RevenueFilterDto) {
    const where: any = {
      status: { in: ['CONFIRMED', 'COMPLETED', 'PARTIALLY_PAID'] },
    };

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        tickets: {
          include: {
            flight: { include: { originAirport: true, destinationAirport: true } },
          },
        },
        refunds: true,
      },
    });

    let grossRevenue = 0;
    let totalRefunds = 0;
    const routeBreakdown: { [key: string]: { bookings: number; revenue: number } } = {};
    const cabinBreakdown: { [key: string]: { tickets: number; revenue: number } } = {
      ECONOMY: { tickets: 0, revenue: 0 },
      BUSINESS: { tickets: 0, revenue: 0 },
      FIRST: { tickets: 0, revenue: 0 },
    };

    for (const b of bookings) {
      grossRevenue += b.paidAmount;
      for (const r of b.refunds) {
        totalRefunds += r.amount;
      }

      for (const t of b.tickets) {
        const routeKey = `${t.flight.originAirport.code} ➔ ${t.flight.destinationAirport.code}`;
        if (!routeBreakdown[routeKey]) {
          routeBreakdown[routeKey] = { bookings: 0, revenue: 0 };
        }
        routeBreakdown[routeKey].bookings += 1;
        routeBreakdown[routeKey].revenue += t.price;

        if (cabinBreakdown[t.cabinClass]) {
          cabinBreakdown[t.cabinClass].tickets += 1;
          cabinBreakdown[t.cabinClass].revenue += t.price;
        }
      }
    }

    return {
      totalBookings: bookings.length,
      grossRevenue,
      totalRefunds,
      netRevenue: Math.max(0, grossRevenue - totalRefunds),
      cabinBreakdown,
      routeBreakdown: Object.entries(routeBreakdown).map(([route, val]) => ({
        route,
        bookings: val.bookings,
        revenue: val.revenue,
      })),
    };
  }

  async getStaffDetails() {
    const staffMembers = await this.prisma.user.findMany({
      where: { role: 'STAFF' },
      include: {
        staffLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return staffMembers.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      status: s.status,
      actionsCount: s.staffLogs.length,
      recentLogs: s.staffLogs,
    }));
  }

  async createExportJob(dto: CreateExportJobDto, userId: string) {
    // State machine: SUBMITTED -> PROCESSING -> GENERATING -> READY
    const job = await this.prisma.exportJob.create({
      data: {
        requestedById: userId,
        reportType: dto.reportType,
        format: dto.format,
        status: 'READY', // Complete synchronously for seamless UX
        dateRangeStart: dto.startDate ? new Date(dto.startDate) : null,
        dateRangeEnd: dto.endDate ? new Date(dto.endDate) : null,
        fileUrl: `/api/reports/export/download/${Date.now()}.${dto.format === 'EXCEL' ? 'csv' : 'txt'}`,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      status: job.status,
      format: job.format,
      reportType: job.reportType,
      fileUrl: job.fileUrl,
      downloadContent: this.generateSampleCsv(dto.reportType),
      message: 'Báo cáo đã được tạo thành công!',
    };
  }

  private generateSampleCsv(type: string): string {
    if (type === 'REVENUE') {
      return (
        'Mã đặt chỗ,Tuyến bay,Hạng vé,Doanh thu (VND),Thời gian\n' +
        'VSK89A,SGN-HAN,ECONOMY,1850000,2026-10-27\n' +
        'VSK102,HAN-DAD,BUSINESS,4200000,2026-10-26\n' +
        'VSK304,SGN-SIN,ECONOMY,3100000,2026-10-25\n'
      );
    }
    return 'ID,Tên,Vai trò,Trạng thái\n1,Tran Van Nhan Vien,STAFF,ACTIVE\n';
  }
}

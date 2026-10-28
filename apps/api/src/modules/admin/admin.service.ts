import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, CreateAdminDto, UpdateSystemSettingDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Users Management
  async getUsers(query?: { search?: string; role?: string; status?: string }) {
    const where: any = {};
    if (query?.role) where.role = query.role;
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { fullName: { contains: query.search } },
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        status: true,
        createdAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        loyaltyAccount: true,
        bookings: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        email: dto.email ? dto.email.toLowerCase().trim() : undefined,
        phone: dto.phone,
        address: dto.address,
      },
    });
  }

  async toggleUserStatus(id: string, newStatus: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    return this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async deleteUser(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException('Không thể xóa tài khoản của chính mình');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }

  // 2. Admin Accounts Management
  async getAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN', status: { not: 'DELETED' } },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('Email này đã tồn tại trong hệ thống');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone,
        role: 'ADMIN',
        status: 'ACTIVE',
        mfaEnabled: true,
      },
    });
  }

  async removeAdmin(id: string, currentAdminId: string) {
    // Safety check 1: Cannot delete self
    if (id === currentAdminId) {
      throw new BadRequestException('Bảo mật: Quý khách không thể tự xóa tài khoản quản trị của chính mình.');
    }

    // Safety check 2: Cannot delete the last active admin
    const activeAdminCount = await this.prisma.user.count({
      where: { role: 'ADMIN', status: 'ACTIVE' },
    });

    if (activeAdminCount <= 1) {
      throw new BadRequestException(
        'Bảo mật: Không thể xóa Quản trị viên cuối cùng của hệ thống.',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }

  // 3. System Logs
  async getAuditLogs(query?: { action?: string; limit?: number }) {
    return this.prisma.auditLog.findMany({
      where: query?.action ? { action: query.action } : {},
      include: { actor: { select: { fullName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: query?.limit || 50,
    });
  }

  // 4. Sent Emails Log
  async getSentEmails(query?: { search?: string }) {
    return this.prisma.sentEmail.findMany({
      where: query?.search
        ? {
            OR: [
              { recipientEmail: { contains: query.search } },
              { subject: { contains: query.search } },
            ],
          }
        : {},
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  // 5. System Settings
  async getSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateSetting(dto: UpdateSystemSettingDto) {
    return this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: dto.value,
      },
      update: {
        value: dto.value,
      },
    });
  }

  // 6. GDPR Anonymization
  async anonymizeUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const anonymizedCode = `ANON-${Date.now().toString().slice(-6)}`;
    await this.prisma.user.update({
      where: { id },
      data: {
        fullName: `Khách hàng ẩn danh ${anonymizedCode}`,
        email: `anonymized_${anonymizedCode}@vietsky.local`,
        phone: '0000000000',
        address: null,
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    return { success: true, message: 'Dữ liệu cá nhân đã được ẩn danh theo tiêu chuẩn GDPR.' };
  }
}

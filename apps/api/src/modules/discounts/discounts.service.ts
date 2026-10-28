import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidateDiscountDto, CreateDiscountDto } from './dto/discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateDiscount(dto: ValidateDiscountDto) {
    const discount = await this.prisma.discount.findUnique({
      where: { code: dto.code.toUpperCase().trim() },
    });

    if (!discount || !discount.isActive) {
      throw new NotFoundException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu');
    }

    const now = new Date();
    if (now < discount.startDate) {
      throw new BadRequestException('Mã giảm giá chưa đến ngày áp dụng');
    }
    if (now > discount.endDate) {
      throw new BadRequestException('Mã giảm giá đã hết hạn sử dụng');
    }
    if (discount.usedCount >= discount.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã vượt quá số lượt sử dụng tối đa');
    }

    if (discount.minBookingAmount && dto.bookingAmount < discount.minBookingAmount) {
      throw new BadRequestException(
        `Đơn hàng cần đạt tối thiểu ${discount.minBookingAmount.toLocaleString('vi-VN')} VND để áp dụng mã này`,
      );
    }

    if (discount.routeCondition && dto.route && discount.routeCondition !== dto.route) {
      throw new BadRequestException(`Mã giảm giá chỉ áp dụng cho chặng bay ${discount.routeCondition}`);
    }

    if (discount.cabinCondition && dto.cabinClass && discount.cabinCondition !== dto.cabinClass) {
      throw new BadRequestException(`Mã giảm giá chỉ áp dụng cho hạng ghế ${discount.cabinCondition}`);
    }

    if (discount.tierCondition && dto.memberTier) {
      const tierRank: any = { STANDARD: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 };
      if ((tierRank[dto.memberTier] || 0) < (tierRank[discount.tierCondition] || 0)) {
        throw new BadRequestException(
          `Mã giảm giá dành riêng cho hội viên từ hạng ${discount.tierCondition} trở lên`,
        );
      }
    }

    let calculatedDiscount = 0;
    if (discount.discountType === 'PERCENTAGE') {
      calculatedDiscount = (dto.bookingAmount * discount.value) / 100;
      if (discount.maxDiscountAmount && calculatedDiscount > discount.maxDiscountAmount) {
        calculatedDiscount = discount.maxDiscountAmount;
      }
    } else {
      calculatedDiscount = discount.value;
    }

    return {
      isValid: true,
      code: discount.code,
      description: discount.description,
      discountAmount: calculatedDiscount,
      finalAmount: Math.max(0, dto.bookingAmount - calculatedDiscount),
      message: `Áp dụng thành công mã giảm ${calculatedDiscount.toLocaleString('vi-VN')} VND`,
    };
  }

  async getAllDiscounts() {
    return this.prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDiscount(dto: CreateDiscountDto) {
    const existing = await this.prisma.discount.findUnique({
      where: { code: dto.code.toUpperCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Mã khuyến mãi này đã tồn tại');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) {
      throw new BadRequestException('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    }

    return this.prisma.discount.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        description: dto.description,
        discountType: dto.discountType,
        value: dto.value,
        minBookingAmount: dto.minBookingAmount || 0,
        maxDiscountAmount: dto.maxDiscountAmount || null,
        startDate: start,
        endDate: end,
        routeCondition: dto.routeCondition || null,
        cabinCondition: dto.cabinCondition || null,
        tierCondition: dto.tierCondition || null,
        usageLimit: dto.usageLimit || 100,
        isActive: true,
      },
    });
  }

  async updateDiscount(id: string, dto: Partial<CreateDiscountDto>) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) {
      throw new NotFoundException('Mã khuyến mãi không tồn tại');
    }

    return this.prisma.discount.update({
      where: { id },
      data: {
        description: dto.description,
        value: dto.value,
        minBookingAmount: dto.minBookingAmount,
        maxDiscountAmount: dto.maxDiscountAmount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        usageLimit: dto.usageLimit,
      },
    });
  }

  async removeDiscount(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) {
      throw new NotFoundException('Mã khuyến mãi không tồn tại');
    }

    // Rule: Cannot remove an active discount in use (usedCount > 0)
    if (discount.usedCount > 0) {
      throw new BadRequestException(
        `Không thể xóa mã khuyến mãi đã được sử dụng (${discount.usedCount} lượt). Quý khách có thể tắt trạng thái kích hoạt thay thế.`,
      );
    }

    return this.prisma.discount.delete({ where: { id } });
  }
}

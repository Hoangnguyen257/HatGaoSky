import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailAdapter } from '../../common/adapters/email.adapter';
import { PaymentGatewayAdapter } from '../../common/adapters/payment-gateway.adapter';
import { BuyMilesDto } from './dto/loyalty.dto';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailAdapter: EmailAdapter,
    private readonly paymentGateway: PaymentGatewayAdapter,
  ) {}

  async getAccount(userId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        user: {
          include: { customerProfile: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản hội viên');
    }

    // Tier criteria:
    // STANDARD: 0 - 4,999
    // SILVER: 5,000 - 14,999
    // GOLD: 15,000 - 29,999
    // PLATINUM: 30,000+
    let nextTier = 'SILVER';
    let milesToNextTier = 5000 - account.totalMilesEarned;

    if (account.totalMilesEarned >= 30000) {
      nextTier = 'MAX_TIER';
      milesToNextTier = 0;
    } else if (account.totalMilesEarned >= 15000) {
      nextTier = 'PLATINUM';
      milesToNextTier = 30000 - account.totalMilesEarned;
    } else if (account.totalMilesEarned >= 5000) {
      nextTier = 'GOLD';
      milesToNextTier = 15000 - account.totalMilesEarned;
    }

    return {
      tier: account.tier,
      availableMiles: account.availableMiles,
      totalMilesEarned: account.totalMilesEarned,
      tierExpiryDate: account.tierExpiryDate,
      nextTier,
      milesToNextTier: Math.max(0, milesToNextTier),
      memberCode: account.user.customerProfile?.memberCode,
      transactions: account.transactions,
    };
  }

  async getRewards() {
    return this.prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { milesRequired: 'asc' },
    });
  }

  async exchangeReward(userId: string, rewardId: string) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!account) {
        throw new NotFoundException('Tài khoản hội viên không tồn tại');
      }

      const reward = await tx.reward.findUnique({
        where: { id: rewardId },
      });

      if (!reward || !reward.isActive) {
        throw new NotFoundException('Phần thưởng không tồn tại hoặc đã ngừng áp dụng');
      }

      if (reward.stock <= 0) {
        throw new BadRequestException('Phần thưởng này đã tạm thời hết lượt đổi');
      }

      if (account.availableMiles < reward.milesRequired) {
        throw new BadRequestException(
          `Quý khách chưa đủ dặm thưởng. Cần ${reward.milesRequired.toLocaleString()} dặm (hiện có ${account.availableMiles.toLocaleString()} dặm).`,
        );
      }

      // Deduct miles and reward stock
      const newAvailable = account.availableMiles - reward.milesRequired;

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { availableMiles: newAvailable },
      });

      await tx.reward.update({
        where: { id: reward.id },
        data: { stock: reward.stock - 1 },
      });

      const voucherCode = `RW-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

      await tx.mileTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: 'REDEEM',
          amount: -reward.milesRequired,
          balanceAfter: newAvailable,
          description: `Đổi quà: ${reward.title} (Mã voucher: ${voucherCode})`,
          referenceId: reward.id,
        },
      });

      await this.emailAdapter.sendEmail({
        to: account.user.email,
        subject: `Xác nhận đổi quà thành công - VietSky Lotus Club`,
        template: 'REWARD_REDEEMED',
        htmlContent: `
          <h2>Chúc mừng Quý khách ${account.user.fullName}!</h2>
          <p>Quý khách vừa đổi thành công phần thưởng: <strong>${reward.title}</strong></p>
          <p>Số dặm đã trừ: <strong>${reward.milesRequired.toLocaleString()} dặm</strong></p>
          <p>Số dặm còn lại: <strong>${newAvailable.toLocaleString()} dặm</strong></p>
          <p>Mã voucher kích hoạt: <strong style="font-size: 18px; color: #f59e0b;">${voucherCode}</strong></p>
        `,
      });

      return {
        success: true,
        voucherCode,
        rewardTitle: reward.title,
        milesDeducted: reward.milesRequired,
        remainingMiles: newAvailable,
        message: 'Đổi quà thành công! Mã voucher đã được gửi vào email của quý khách.',
      };
    });
  }

  async buyMiles(userId: string, dto: BuyMilesDto) {
    const ratePerMileVnd = 500;
    const totalAmount = dto.milesAmount * ratePerMileVnd;

    // Process mock payment
    const paymentResult = await this.paymentGateway.processPayment({
      bookingId: 'BUY_MILES',
      amount: totalAmount,
      method: dto.paymentMethod as any,
    });

    if (!paymentResult.success) {
      throw new BadRequestException('Thanh toán mua dặm thất bại');
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!account) {
        throw new NotFoundException('Tài khoản hội viên không tồn tại');
      }

      const updatedAvailable = account.availableMiles + dto.milesAmount;
      const updatedTotal = account.totalMilesEarned + dto.milesAmount;

      // Tier evaluation
      let newTier = account.tier;
      if (updatedTotal >= 30000) newTier = 'PLATINUM';
      else if (updatedTotal >= 15000) newTier = 'GOLD';
      else if (updatedTotal >= 5000) newTier = 'SILVER';

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          availableMiles: updatedAvailable,
          totalMilesEarned: updatedTotal,
          tier: newTier,
        },
      });

      await tx.mileTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: 'PURCHASE',
          amount: dto.milesAmount,
          balanceAfter: updatedAvailable,
          description: `Mua thêm ${dto.milesAmount.toLocaleString()} dặm thưởng (Giao dịch ${paymentResult.transactionCode})`,
          referenceId: paymentResult.transactionCode,
        },
      });

      await this.emailAdapter.sendEmail({
        to: account.user.email,
        subject: `Xác nhận mua dặm thưởng thành công - VietSky Lotus Club`,
        template: 'BUY_MILES_SUCCESS',
        htmlContent: `
          <h2>Cảm ơn Quý khách ${account.user.fullName}!</h2>
          <p>Quý khách đã mua thành công <strong>${dto.milesAmount.toLocaleString()} dặm thưởng</strong>.</p>
          <p>Tổng tiền thanh toán: <strong>${totalAmount.toLocaleString('vi-VN')} VND</strong></p>
          <p>Số dặm khả dụng hiện tại: <strong>${updatedAvailable.toLocaleString()} dặm</strong></p>
          <p>Hạng hội viên hiện tại: <strong>${newTier}</strong></p>
        `,
      });

      return {
        success: true,
        purchasedMiles: dto.milesAmount,
        totalPaid: totalAmount,
        availableMiles: updatedAvailable,
        currentTier: newTier,
        transactionCode: paymentResult.transactionCode,
        message: 'Mua dặm thưởng thành công!',
      };
    });
  }
}

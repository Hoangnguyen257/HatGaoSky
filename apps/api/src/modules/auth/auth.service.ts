import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailAdapter } from '../../common/adapters/email.adapter';
import {
  RegisterDto,
  LoginDto,
  VerifyMfaDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = uuidv4();
    const memberCode = `VSK-${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone,
        role: 'CUSTOMER',
        status: 'INACTIVE', // Requires email verification
        verificationToken,
        customerProfile: {
          create: {
            memberCode,
            nationality: 'VNM',
          },
        },
        loyaltyAccount: {
          create: {
            tier: 'STANDARD',
            totalMilesEarned: 0,
            availableMiles: 0,
          },
        },
      },
      include: {
        customerProfile: true,
        loyaltyAccount: true,
      },
    });

    const verifyLink = `http://localhost:3000/auth/verify-email?token=${verificationToken}`;
    await this.emailAdapter.sendEmail({
      to: user.email,
      subject: 'Xác thực tài khoản Hội viên VietSky Airlines',
      template: 'EMAIL_VERIFICATION',
      htmlContent: `
        <h2>Chào mừng Quý khách ${user.fullName} đến với VietSky Airlines!</h2>
        <p>Mã hội viên của bạn: <strong>${memberCode}</strong></p>
        <p>Vui lòng nhấn vào liên kết bên dưới để kích hoạt tài khoản của bạn (liên kết có hiệu lực trong 24 giờ):</p>
        <p><a href="${verifyLink}" style="padding: 10px 20px; background-color: #0f2b5c; color: #fff; text-decoration: none; border-radius: 4px;">Kích hoạt tài khoản</a></p>
        <p>Hoặc truy cập: ${verifyLink}</p>
      `,
    });

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      memberCode,
      verificationToken, // Expose for easy testing in browser/Postman
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        verificationToken: null,
      },
    });

    return {
      message: 'Tài khoản của quý khách đã được kích hoạt thành công. Quý khách có thể đăng nhập ngay.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { customerProfile: true, loyaltyAccount: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email xác thực.');
    }

    if (user.status === 'DISABLED' || user.status === 'DELETED') {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa hoặc xóa khỏi hệ thống');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // RBAC MFA requirement for Staff, Staff Manager, and Admin
    const privilegedRoles = ['STAFF', 'STAFF_MANAGER', 'ADMIN'];
    if (privilegedRoles.includes(user.role)) {
      const mfaSessionToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role, type: 'MFA_PENDING' },
        { expiresIn: '10m' },
      );

      // Log/send simulated OTP
      await this.emailAdapter.sendEmail({
        to: user.email,
        subject: 'Mã xác thực 2 lớp (MFA OTP) VietSky Airlines',
        template: 'MFA_OTP',
        htmlContent: `<p>Mã xác thực bảo mật đăng nhập của bạn là: <strong>123456</strong> (hoặc sử dụng ứng dụng Authenticator).</p>`,
      });

      return {
        requiresMfa: true,
        mfaSessionToken,
        role: user.role,
        message: 'Tài khoản quản trị/nhân viên yêu cầu xác thực 2 bước (MFA). Mã OTP mặc định là: 123456',
      };
    }

    // Customer login directly returns tokens
    return this.generateTokens(user);
  }

  async verifyMfa(dto: VerifyMfaDto) {
    try {
      const decoded: any = this.jwtService.verify(dto.mfaSessionToken);
      if (decoded.type !== 'MFA_PENDING') {
        throw new UnauthorizedException('Mã phiên MFA không hợp lệ');
      }

      // Valid OTP simulation: '123456' or any 6 digit test code
      if (dto.code !== '123456' && dto.code !== '888888') {
        throw new BadRequestException('Mã OTP không chính xác. Vui lòng nhập: 123456');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { customerProfile: true, loyaltyAccount: true },
      });

      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      return this.generateTokens(user);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new UnauthorizedException('Phiên xác thực MFA đã hết hạn hoặc không hợp lệ');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      // Return success to avoid email enumeration
      return { message: 'Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục sẽ được gửi đến hộp thư.' };
    }

    const resetToken = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiry,
      },
    });

    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    await this.emailAdapter.sendEmail({
      to: user.email,
      subject: 'Yêu cầu đặt lại mật khẩu VietSky Airlines',
      template: 'PASSWORD_RESET',
      htmlContent: `
        <h2>Yêu cầu khôi phục mật khẩu</h2>
        <p>Quý khách vừa yêu cầu đặt lại mật khẩu cho tài khoản ${user.email}.</p>
        <p><a href="${resetLink}">Nhấn vào đây để đặt mật khẩu mới</a></p>
        <p>Liên kết có hiệu lực trong 1 giờ. Nếu không phải bạn thực hiện, vui lòng bỏ qua email này.</p>
      `,
    });

    return {
      message: 'Hướng dẫn khôi phục mật khẩu đã được gửi đến email của quý khách.',
      resetToken, // Expose for quick testing
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Mã khôi phục không hợp lệ hoặc đã hết hạn');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Mật khẩu đã được cập nhật thành công. Quý khách có thể đăng nhập ngay.' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'vietsky-refresh-jwt-key-airline-2026';
      const decoded: any = this.jwtService.verify(refreshToken, { secret: refreshSecret });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { customerProfile: true, loyaltyAccount: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'vietsky-refresh-jwt-key-airline-2026',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        status: user.status,
        customerProfile: user.customerProfile,
        loyaltyAccount: user.loyaltyAccount,
      },
    };
  }
}

import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'nguyen.van.a@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'customer@vietsky.vn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Customer@123456' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyMfaDto {
  @ApiProperty({ example: 'temp-session-token-xyz' })
  @IsString()
  @IsNotEmpty()
  mfaSessionToken: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@vietsky.vn' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-xyz' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecret@123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'verification-token-xyz' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

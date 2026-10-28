import { IsNotEmpty, IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'admin2@vietsky.vn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@654321' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Pho Quan Tri Vien' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0909998888', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateSystemSettingDto {
  @ApiProperty({ example: 'seat_hold_ttl_minutes' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: '20' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

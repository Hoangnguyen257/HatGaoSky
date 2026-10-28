import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { EmailAdapter, ConsoleAndDbEmailAdapter } from '../../common/adapters/email.adapter';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'vietsky-super-secret-jwt-key-airline-2026',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: EmailAdapter,
      useClass: ConsoleAndDbEmailAdapter,
    },
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}

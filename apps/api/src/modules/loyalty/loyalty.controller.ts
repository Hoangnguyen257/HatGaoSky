import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { BuyMilesDto } from './dto/loyalty.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer view miles accumulation, tier progress, and transaction history' })
  getMyAccount(@CurrentUser('id') userId: string) {
    return this.loyaltyService.getAccount(userId);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'List rewards available in the loyalty reward catalog' })
  getRewards() {
    return this.loyaltyService.getRewards();
  }

  @Post('rewards/:id/exchange')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer redeem miles for catalog reward (transactional deduction)' })
  exchangeReward(@CurrentUser('id') userId: string, @Param('id') rewardId: string) {
    return this.loyaltyService.exchangeReward(userId, rewardId);
  }

  @Post('buy-miles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer purchase bonus miles via mock payment' })
  buyMiles(@CurrentUser('id') userId: string, @Body() dto: BuyMilesDto) {
    return this.loyaltyService.buyMiles(userId, dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { ValidateDiscountDto, CreateDiscountDto } from './dto/discount.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate promo code conditions and calculate discount amount' })
  validate(@Body() dto: ValidateDiscountDto) {
    return this.discountsService.validateDiscount(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff list all discount codes' })
  getAll() {
    return this.discountsService.getAllDiscounts();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff create a new promo discount' })
  create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.createDiscount(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff update promo discount' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateDiscountDto>) {
    return this.discountsService.updateDiscount(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff delete discount (guarded against active usage)' })
  remove(@Param('id') id: string) {
    return this.discountsService.removeDiscount(id);
  }
}

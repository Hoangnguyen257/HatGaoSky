import { IsNotEmpty, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HoldSeatsDto {
  @ApiProperty({ example: 'flight-uuid' })
  @IsString()
  @IsNotEmpty()
  flightId: string;

  @ApiProperty({ example: ['12A', '12B'] })
  @IsArray()
  seatNumbers: string[];

  @ApiProperty({ example: 'session-client-token-xyz' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class ReleaseSeatsDto {
  @ApiProperty({ example: 'flight-uuid' })
  @IsString()
  @IsNotEmpty()
  flightId: string;

  @ApiProperty({ example: ['12A'] })
  @IsArray()
  seatNumbers: string[];

  @ApiProperty({ example: 'session-client-token-xyz' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

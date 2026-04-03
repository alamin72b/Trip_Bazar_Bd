import { ApiProperty } from '@nestjs/swagger';
import { OfferResponseDto } from './offer-response.dto';

export class AdminOfferListResponseDto {
  @ApiProperty({
    type: [OfferResponseDto],
  })
  items!: OfferResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

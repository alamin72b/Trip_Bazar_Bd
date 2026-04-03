import { ApiProperty } from '@nestjs/swagger';
import { OfferStatus } from '../enums/offer-status.enum';

export class OfferResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  destination!: string;

  @ApiProperty()
  durationNights!: number;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({
    enum: OfferStatus,
  })
  status!: OfferStatus;

  @ApiProperty({
    type: [String],
  })
  imageUrls!: string[];

  @ApiProperty()
  contactWhatsApp!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

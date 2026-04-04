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
    nullable: true,
    example: '2026-04-30T17:59:59.999Z',
  })
  expiresAt!: string | null;

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

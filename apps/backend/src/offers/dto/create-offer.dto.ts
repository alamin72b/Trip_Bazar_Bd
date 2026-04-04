import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { OfferStatus } from '../enums/offer-status.enum';
import { DATE_ONLY_PATTERN } from '../utils/expiry-date.util';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  slug?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  summary!: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  description!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  destination!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  durationNights!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  price!: number;

  @ApiProperty({
    example: 'BDT',
  })
  @IsString()
  @MinLength(3)
  currency!: string;

  @ApiPropertyOptional({
    enum: OfferStatus,
    default: OfferStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @ApiPropertyOptional({
    example: '2026-04-30',
    description:
      'Optional date-only expiry in YYYY-MM-DD format. The backend stores it as end-of-day server time.',
    nullable: true,
  })
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'expiryDate must use YYYY-MM-DD format.',
  })
  expiryDate?: string | null;

  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUrl({}, { each: true })
  imageUrls!: string[];

  @ApiProperty({
    example: '+8801700000000',
  })
  @IsString()
  @MinLength(8)
  contactWhatsApp!: string;
}

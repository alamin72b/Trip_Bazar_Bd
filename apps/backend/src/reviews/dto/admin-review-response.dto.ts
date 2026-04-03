import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '../enums/review-status.enum';

export class AdminReviewResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  offerId!: string;

  @ApiProperty()
  offerTitle!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  comment!: string;

  @ApiProperty({
    enum: ReviewStatus,
  })
  status!: ReviewStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

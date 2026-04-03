import { ApiProperty } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  comment!: string;

  @ApiProperty()
  reviewerDisplayName!: string;

  @ApiProperty()
  createdAt!: string;
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('offers/:offerId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: ReviewResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the access token is missing or invalid.',
  })
  createReview(
    @Param('offerId') offerId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(
      offerId,
      currentUser,
      createReviewDto,
    );
  }

  @Get()
  @ApiOkResponse({
    type: ReviewResponseDto,
    isArray: true,
  })
  getOfferReviews(
    @Param('offerId') offerId: string,
  ): Promise<ReviewResponseDto[]> {
    return this.reviewsService.getOfferReviews(offerId);
  }
}

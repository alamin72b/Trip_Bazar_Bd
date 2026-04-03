import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { OffersService } from '../offers/offers.service';
import { UsersService } from '../users/users.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { Review } from './entities/review.entity';
import { ReviewStatus } from './enums/review-status.enum';
import { createReviewerDisplayName } from './utils/reviewer-display.util';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly offersService: OffersService,
    private readonly usersService: UsersService,
  ) {}

  async createReview(
    offerId: string,
    currentUser: AuthenticatedUser,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const offer = await this.offersService.findOfferById(offerId);

    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }

    const user = await this.usersService.findById(currentUser.sub);

    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists.');
    }

    const review = this.reviewsRepository.create({
      offerId: offer.id,
      userId: user.id,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      status: ReviewStatus.PUBLISHED,
    });

    const savedReview = await this.reviewsRepository.save(review);

    return this.toResponseDto(savedReview, user.email);
  }

  async getOfferReviews(offerId: string): Promise<ReviewResponseDto[]> {
    const offer = await this.offersService.findOfferById(offerId);

    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }

    const reviews = await this.reviewsRepository.find({
      where: {
        offerId,
        status: ReviewStatus.PUBLISHED,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return reviews.map((review) =>
      this.toResponseDto(review, review.user.email),
    );
  }

  private toResponseDto(
    review: Review,
    reviewerEmail: string,
  ): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reviewerDisplayName: createReviewerDisplayName(reviewerEmail),
      createdAt: review.createdAt.toISOString(),
    };
  }
}

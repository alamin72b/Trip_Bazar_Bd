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
import { AdminReviewResponseDto } from './dto/admin-review-response.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
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

  async getAdminReviews(): Promise<AdminReviewResponseDto[]> {
    const reviews = await this.reviewsRepository.find({
      relations: {
        offer: true,
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return reviews.map((review) => this.toAdminResponseDto(review));
  }

  async getAdminReviewById(id: string): Promise<AdminReviewResponseDto> {
    const review = await this.findAdminReviewById(id);

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    return this.toAdminResponseDto(review);
  }

  async updateReviewStatus(
    id: string,
    updateReviewStatusDto: UpdateReviewStatusDto,
  ): Promise<AdminReviewResponseDto> {
    const review = await this.findAdminReviewById(id);

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    review.status = updateReviewStatusDto.status;

    const updatedReview = await this.reviewsRepository.save(review);

    return this.toAdminResponseDto(updatedReview);
  }

  async deleteReview(id: string): Promise<void> {
    const review = await this.reviewsRepository.findOne({
      where: {
        id,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    await this.reviewsRepository.remove(review);
  }

  private findAdminReviewById(id: string): Promise<Review | null> {
    return this.reviewsRepository.findOne({
      where: {
        id,
      },
      relations: {
        offer: true,
        user: true,
      },
    });
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

  private toAdminResponseDto(review: Review): AdminReviewResponseDto {
    return {
      id: review.id,
      offerId: review.offerId,
      offerTitle: review.offer.title,
      userId: review.userId,
      userEmail: review.user.email,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }
}

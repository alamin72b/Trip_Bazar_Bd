import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { OffersService } from '../offers/offers.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { Review } from './entities/review.entity';
import { ReviewStatus } from './enums/review-status.enum';
import { ReviewsService } from './reviews.service';
import { createReviewerDisplayName } from './utils/reviewer-display.util';

describe('ReviewsService', () => {
  let reviewsService: ReviewsService;
  let reviewsRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let offersService: jest.Mocked<OffersService>;
  let usersService: jest.Mocked<UsersService>;

  const currentUser: AuthenticatedUser = {
    sub: 'user-1',
    email: 'traveler@example.com',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: {
            find: jest.fn(),
            create: jest.fn((value) => value),
            save: jest.fn(),
          } satisfies Partial<Repository<Review>>,
        },
        {
          provide: OffersService,
          useValue: {
            findOfferById: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    reviewsService = module.get(ReviewsService);
    reviewsRepository = module.get(getRepositoryToken(Review));
    offersService = module.get(OffersService);
    usersService = module.get(UsersService);
  });

  it('creates a review for an existing offer and existing user', async () => {
    offersService.findOfferById.mockResolvedValue({
      id: 'offer-1',
    } as never);
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'traveler@example.com',
    } as never);
    reviewsRepository.save.mockResolvedValue({
      id: 'review-1',
      rating: 5,
      comment: 'The trip was well organized and worth the price.',
      status: ReviewStatus.PUBLISHED,
      createdAt: new Date('2026-04-03T07:00:00.000Z'),
    });

    const response = await reviewsService.createReview('offer-1', currentUser, {
      rating: 5,
      comment: 'The trip was well organized and worth the price.',
    });

    expect(response.reviewerDisplayName).toBe('tra***');
    expect(reviewsRepository.save.mock.calls).toHaveLength(1);
  });

  it('rejects review creation when the offer does not exist', async () => {
    offersService.findOfferById.mockResolvedValue(null);

    await expect(
      reviewsService.createReview('missing-offer', currentUser, {
        rating: 5,
        comment: 'The trip was well organized and worth the price.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects review creation when the user no longer exists', async () => {
    offersService.findOfferById.mockResolvedValue({
      id: 'offer-1',
    } as never);
    usersService.findById.mockResolvedValue(null);

    await expect(
      reviewsService.createReview('offer-1', currentUser, {
        rating: 5,
        comment: 'The trip was well organized and worth the price.',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lists reviews only for the requested offer', async () => {
    offersService.findOfferById.mockResolvedValue({
      id: 'offer-1',
    } as never);
    reviewsRepository.find.mockResolvedValue([
      {
        id: 'review-1',
        rating: 5,
        comment: 'The trip was well organized and worth the price.',
        status: ReviewStatus.PUBLISHED,
        createdAt: new Date('2026-04-03T07:00:00.000Z'),
        user: {
          email: 'traveler@example.com',
        },
      },
      {
        id: 'review-2',
        rating: 4,
        comment: 'Everything was smooth and enjoyable throughout.',
        status: ReviewStatus.PUBLISHED,
        createdAt: new Date('2026-04-03T08:00:00.000Z'),
        user: {
          email: 'tourist@example.com',
        },
      },
    ]);

    const response = await reviewsService.getOfferReviews('offer-1');
    const findCall = reviewsRepository.find.mock.calls[0] as [unknown];

    expect(findCall[0]).toEqual({
      where: {
        offerId: 'offer-1',
        status: ReviewStatus.PUBLISHED,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
    expect(response).toHaveLength(2);
  });

  it('creates a masked reviewer display name', () => {
    expect(createReviewerDisplayName('traveler@example.com')).toBe('tra***');
    expect(createReviewerDisplayName('ab@example.com')).toBe('ab***');
  });
});

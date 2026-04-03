import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AdminReviewsController } from '../src/reviews/admin-reviews.controller';
import { AdminOffersController } from '../src/offers/admin-offers.controller';
import { AuthController } from '../src/auth/auth.controller';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TokenService } from '../src/auth/token.service';
import { OfferStatus } from '../src/offers/enums/offer-status.enum';
import { ReviewStatus } from '../src/reviews/enums/review-status.enum';
import { ReviewsController } from '../src/reviews/reviews.controller';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('ReviewsController (integration)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let adminOffersController: AdminOffersController;
  let adminReviewsController: AdminReviewsController;
  let reviewsController: ReviewsController;
  let tokenService: TokenService;
  let rolesGuard: RolesGuard;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin-password-123';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authController = app.get(AuthController);
    adminOffersController = app.get(AdminOffersController);
    adminReviewsController = app.get(AdminReviewsController);
    reviewsController = app.get(ReviewsController);
    tokenService = app.get(TokenService);
    rolesGuard = app.get(RolesGuard);
  });

  afterEach(async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await app.close();
  });

  async function createPublishedOffer() {
    return adminOffersController.createOffer({
      title: "Cox's Bazar Weekend Escape",
      summary: 'A short beach getaway package for the weekend.',
      description:
        "Three days and two nights in Cox's Bazar with hotel stay included.",
      destination: "Cox's Bazar",
      durationNights: 2,
      price: 12500,
      currency: 'BDT',
      imageUrls: ['https://example.com/coxs-bazar-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.PUBLISHED,
    });
  }

  function createAdminExecutionContext(role: UserRole): ExecutionContext {
    const handler = Object.getOwnPropertyDescriptor(
      AdminReviewsController.prototype,
      'getAdminReviews',
    )?.value as () => unknown;

    return {
      getClass: () => AdminReviewsController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'user-id',
            email:
              role === UserRole.ADMIN
                ? 'admin@example.com'
                : 'traveler@example.com',
            role,
          },
        }),
      }),
    } as ExecutionContext;
  }

  it('authenticated user can create a review for an existing offer', async () => {
    const offer = await createPublishedOffer();
    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });
    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );

    const review = await reviewsController.createReview(offer.id, currentUser, {
      rating: 5,
      comment: 'The trip was well organized and worth the price.',
    });

    expect(review.rating).toBe(5);
    expect(review.reviewerDisplayName).toBe('tra***');
  });

  it('guest cannot create a review', async () => {
    await expect(tokenService.verifyAccessToken('')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('public can list reviews for an offer', async () => {
    const offer = await createPublishedOffer();
    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });
    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );

    await reviewsController.createReview(offer.id, currentUser, {
      rating: 5,
      comment: 'The trip was well organized and worth the price.',
    });

    const reviews = await reviewsController.getOfferReviews(offer.id);

    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.reviewerDisplayName).toBe('tra***');
  });

  it('review listing is scoped to the selected offer', async () => {
    const firstOffer = await createPublishedOffer();
    const secondOffer = await adminOffersController.createOffer({
      title: 'Bandarban Adventure Tour',
      summary: 'A guided hill and nature package.',
      description:
        'Four days and three nights in Bandarban with local sightseeing included.',
      destination: 'Bandarban',
      durationNights: 3,
      price: 18000,
      currency: 'BDT',
      imageUrls: ['https://example.com/bandarban-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.PUBLISHED,
    });
    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });
    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );

    await reviewsController.createReview(firstOffer.id, currentUser, {
      rating: 5,
      comment: 'The trip was well organized and worth the price.',
    });
    await reviewsController.createReview(secondOffer.id, currentUser, {
      rating: 4,
      comment: 'The scenery was excellent and the logistics were smooth.',
    });

    const firstOfferReviews = await reviewsController.getOfferReviews(
      firstOffer.id,
    );

    expect(firstOfferReviews).toHaveLength(1);
    expect(firstOfferReviews[0]?.comment).toBe(
      'The trip was well organized and worth the price.',
    );
  });

  it('multiple reviews from the same user for the same offer are accepted', async () => {
    const offer = await createPublishedOffer();
    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });
    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );

    await reviewsController.createReview(offer.id, currentUser, {
      rating: 5,
      comment: 'The trip was well organized and worth the price.',
    });
    await reviewsController.createReview(offer.id, currentUser, {
      rating: 4,
      comment: 'I also liked the hotel and transport support.',
    });

    const reviews = await reviewsController.getOfferReviews(offer.id);

    expect(reviews).toHaveLength(2);
  });

  it('admin can list, moderate, and delete reviews', async () => {
    const offer = await createPublishedOffer();
    const authResponse = await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });
    const adminAuthResponse = await authController.authenticateWithEmail({
      email: 'admin@example.com',
      password: 'admin-password-123',
    });
    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );
    const adminUser = await tokenService.verifyAccessToken(
      adminAuthResponse.accessToken,
    );

    expect(rolesGuard.canActivate(createAdminExecutionContext(adminUser.role))).toBe(
      true,
    );

    const review = await reviewsController.createReview(offer.id, currentUser, {
      rating: 5,
      comment: 'The trip was well organized and worth the price.',
    });

    const adminReviews = await adminReviewsController.getAdminReviews();
    const moderatedReview = await adminReviewsController.updateReviewStatus(
      review.id,
      {
        status: ReviewStatus.HIDDEN,
      },
    );

    expect(adminReviews).toHaveLength(1);
    expect(moderatedReview.status).toBe(ReviewStatus.HIDDEN);

    await adminReviewsController.deleteReview(review.id);

    const publicReviews = await reviewsController.getOfferReviews(offer.id);

    expect(publicReviews).toHaveLength(0);
  });

  it('normal users cannot access admin review routes', async () => {
    expect(() =>
      rolesGuard.canActivate(createAdminExecutionContext(UserRole.USER)),
    ).toThrow(ForbiddenException);
  });
});

import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AdminOffersController } from '../src/offers/admin-offers.controller';
import { PublicOffersController } from '../src/offers/public-offers.controller';
import { AuthController } from '../src/auth/auth.controller';
import { TokenService } from '../src/auth/token.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole } from '../src/users/enums/user-role.enum';
import { OfferStatus } from '../src/offers/enums/offer-status.enum';

describe('OffersController (integration)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let adminOffersController: AdminOffersController;
  let publicOffersController: PublicOffersController;
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
    publicOffersController = app.get(PublicOffersController);
    tokenService = app.get(TokenService);
    rolesGuard = app.get(RolesGuard);
  });

  afterEach(async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await app.close();
  });

  function formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function getRelativeDateOnly(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);

    return formatDateOnly(date);
  }

  function createAdminExecutionContext(role: UserRole): ExecutionContext {
    const handler = Object.getOwnPropertyDescriptor(
      AdminOffersController.prototype,
      'getAdminOffers',
    )?.value as () => unknown;

    return {
      getClass: () => AdminOffersController,
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

  it('admin can create and update an offer', async () => {
    const createdExpiryDate = getRelativeDateOnly(2);
    const updatedExpiryDate = getRelativeDateOnly(5);
    const authResponse = await authController.authenticateWithEmail({
      email: 'admin@example.com',
      password: 'admin-password-123',
    });
    const currentUser = await tokenService.verifyAccessToken(
      authResponse.accessToken,
    );

    expect(
      rolesGuard.canActivate(createAdminExecutionContext(currentUser.role)),
    ).toBe(true);

    const createdOffer = await adminOffersController.createOffer({
      title: "Cox's Bazar Weekend Escape",
      summary: 'A short beach getaway package for the weekend.',
      description:
        "Three days and two nights in Cox's Bazar with hotel stay included.",
      destination: "Cox's Bazar",
      durationNights: 2,
      price: 12500,
      currency: 'BDT',
      expiryDate: createdExpiryDate,
      imageUrls: ['https://example.com/coxs-bazar-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.DRAFT,
    });

    const updatedOffer = await adminOffersController.updateOffer(
      createdOffer.id,
      {
        status: OfferStatus.PUBLISHED,
        expiryDate: updatedExpiryDate,
      },
    );

    expect(createdOffer.status).toBe(OfferStatus.DRAFT);
    expect(createdOffer.expiresAt).not.toBeNull();
    expect(updatedOffer.status).toBe(OfferStatus.PUBLISHED);
    expect(updatedOffer.expiresAt).not.toBeNull();
    expect(new Date(updatedOffer.expiresAt ?? 0).getTime()).toBeGreaterThan(
      new Date(createdOffer.expiresAt ?? 0).getTime(),
    );
  });

  it('admin can delete an offer', async () => {
    const createdOffer = await adminOffersController.createOffer({
      title: 'Saint Martin Weekend',
      summary: 'A short island trip package.',
      description:
        'Three days and two nights in Saint Martin with hotel and transport included.',
      destination: 'Saint Martin',
      durationNights: 2,
      price: 15500,
      currency: 'BDT',
      imageUrls: ['https://example.com/saint-martin-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.DRAFT,
    });

    await adminOffersController.deleteOffer(createdOffer.id);

    await expect(
      adminOffersController.getAdminOfferById(createdOffer.id),
    ).rejects.toThrow('Offer not found.');
  });

  it('normal user cannot access admin offer routes', async () => {
    await authController.authenticateWithEmail({
      email: 'traveler@example.com',
      password: 'strong-password-123',
    });

    expect(() =>
      rolesGuard.canActivate(createAdminExecutionContext(UserRole.USER)),
    ).toThrow(ForbiddenException);
  });

  it('guest can list published offers and cannot see drafts', async () => {
    const expiredDate = getRelativeDateOnly(-1);
    const futureDate = getRelativeDateOnly(2);
    const createdDraftOffer = await adminOffersController.createOffer({
      title: 'Sajek Valley Escape',
      summary: 'A short hill trip package.',
      description:
        'Two days and one night in Sajek with transport and hotel included.',
      destination: 'Sajek',
      durationNights: 1,
      price: 8500,
      currency: 'BDT',
      expiryDate: futureDate,
      imageUrls: ['https://example.com/sajek-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.DRAFT,
    });

    const expiredOffer = await adminOffersController.createOffer({
      title: 'Kuakata Sunset Break',
      summary: 'A published offer that should already be expired.',
      description:
        'Two days and one night in Kuakata with sunset beach time and hotel included.',
      destination: 'Kuakata',
      durationNights: 1,
      price: 9800,
      currency: 'BDT',
      expiryDate: expiredDate,
      imageUrls: ['https://example.com/kuakata-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.PUBLISHED,
    });

    await adminOffersController.createOffer({
      title: "Cox's Bazar Weekend Escape",
      summary: 'A short beach getaway package for the weekend.',
      description:
        "Three days and two nights in Cox's Bazar with hotel stay included.",
      destination: "Cox's Bazar",
      durationNights: 2,
      price: 12500,
      currency: 'BDT',
      expiryDate: futureDate,
      imageUrls: ['https://example.com/coxs-bazar-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.PUBLISHED,
    });

    const publicOffers = await publicOffersController.getPublishedOffers();

    expect(publicOffers).toHaveLength(1);
    expect(publicOffers[0]?.status).toBe(OfferStatus.PUBLISHED);
    expect(
      publicOffers.some((offer) => offer.id === createdDraftOffer.id),
    ).toBe(false);
    expect(publicOffers.some((offer) => offer.id === expiredOffer.id)).toBe(
      false,
    );
  });

  it('public detail resolves by slug', async () => {
    const futureDate = getRelativeDateOnly(3);
    const createdOffer = await adminOffersController.createOffer({
      title: 'Bandarban Adventure Tour',
      summary: 'A guided hill and nature package.',
      description:
        'Four days and three nights in Bandarban with local sightseeing included.',
      destination: 'Bandarban',
      durationNights: 3,
      price: 18000,
      currency: 'BDT',
      expiryDate: futureDate,
      imageUrls: ['https://example.com/bandarban-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.PUBLISHED,
    });

    const publicOffer = await publicOffersController.getPublishedOfferBySlug(
      createdOffer.slug,
    );

    expect(publicOffer.id).toBe(createdOffer.id);
    expect(publicOffer.slug).toBe(createdOffer.slug);
  });

  it('public detail returns 404 for an expired published offer', async () => {
    const expiredOffer = await adminOffersController.createOffer({
      title: 'Rangamati Lake Escape',
      summary: 'A once-live lake trip that is now expired.',
      description:
        'Three days and two nights in Rangamati with boat rides and accommodation included.',
      destination: 'Rangamati',
      durationNights: 2,
      price: 14000,
      currency: 'BDT',
      expiryDate: getRelativeDateOnly(-1),
      imageUrls: ['https://example.com/rangamati-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.PUBLISHED,
    });

    await expect(
      publicOffersController.getPublishedOfferBySlug(expiredOffer.slug),
    ).rejects.toThrow('Offer not found.');
  });
});

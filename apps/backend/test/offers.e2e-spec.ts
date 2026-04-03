import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  NotFoundException,
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
      imageUrls: ['https://example.com/coxs-bazar-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.DRAFT,
    });

    const updatedOffer = await adminOffersController.updateOffer(
      createdOffer.id,
      {
        status: OfferStatus.PUBLISHED,
      },
    );

    expect(createdOffer.status).toBe(OfferStatus.DRAFT);
    expect(updatedOffer.status).toBe(OfferStatus.PUBLISHED);
  });

  it('admin list supports combined filters and pagination', async () => {
    await adminOffersController.createOffer({
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

    await adminOffersController.createOffer({
      title: "Cox's Bazar Family Escape",
      summary: 'A family beach package for a longer holiday.',
      description:
        "Four days and three nights in Cox's Bazar with hotel and breakfast included.",
      destination: "Cox's Bazar",
      durationNights: 3,
      price: 22500,
      currency: 'BDT',
      imageUrls: ['https://example.com/coxs-bazar-2.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.PUBLISHED,
    });

    await adminOffersController.createOffer({
      title: 'Sajek Valley Escape',
      summary: 'A short hill trip package.',
      description:
        'Two days and one night in Sajek with transport and hotel included.',
      destination: 'Sajek',
      durationNights: 1,
      price: 8500,
      currency: 'BDT',
      imageUrls: ['https://example.com/sajek-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.DRAFT,
    });

    const adminOffers = await adminOffersController.getAdminOffers({
      status: OfferStatus.PUBLISHED,
      search: 'coxs',
      page: 1,
      limit: 1,
    });

    expect(adminOffers.items).toHaveLength(1);
    expect(adminOffers.total).toBe(2);
    expect(adminOffers.page).toBe(1);
    expect(adminOffers.limit).toBe(1);
    expect(adminOffers.items[0]?.title).toContain("Cox's Bazar");
    expect(adminOffers.items[0]?.status).toBe(OfferStatus.PUBLISHED);
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
    const createdDraftOffer = await adminOffersController.createOffer({
      title: 'Sajek Valley Escape',
      summary: 'A short hill trip package.',
      description:
        'Two days and one night in Sajek with transport and hotel included.',
      destination: 'Sajek',
      durationNights: 1,
      price: 8500,
      currency: 'BDT',
      imageUrls: ['https://example.com/sajek-1.jpg'],
      contactWhatsApp: '+8801700000000',
      status: OfferStatus.DRAFT,
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
  });

  it('public detail resolves by slug', async () => {
    const createdOffer = await adminOffersController.createOffer({
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

    const publicOffer = await publicOffersController.getPublishedOfferBySlug(
      createdOffer.slug,
    );

    expect(publicOffer.id).toBe(createdOffer.id);
    expect(publicOffer.slug).toBe(createdOffer.slug);
  });

  it('admin can delete an offer and it disappears from admin and public reads', async () => {
    const createdOffer = await adminOffersController.createOffer({
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

    await adminOffersController.deleteOffer(createdOffer.id);

    const adminOffers = await adminOffersController.getAdminOffers({
      page: 1,
      limit: 10,
    });

    expect(
      adminOffers.items.some((offer) => offer.id === createdOffer.id),
    ).toBe(false);
    await expect(
      adminOffersController.getAdminOfferById(createdOffer.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      publicOffersController.getPublishedOfferBySlug(createdOffer.slug),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

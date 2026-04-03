import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { OffersService } from './offers.service';
import { OfferStatus } from './enums/offer-status.enum';

describe('OffersService', () => {
  let offersService: OffersService;
  let offersRepository: {
    find: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  const baseOffer = {
    id: 'offer-1',
    title: "Cox's Bazar Weekend Escape",
    slug: 'coxs-bazar-weekend-escape',
    summary: 'A short beach getaway package for the weekend.',
    description:
      "Three days and two nights in Cox's Bazar with hotel stay included.",
    destination: "Cox's Bazar",
    durationNights: 2,
    price: 12500,
    currency: 'BDT',
    status: OfferStatus.PUBLISHED,
    imageUrls: ['https://example.com/coxs-bazar-1.jpg'],
    contactWhatsApp: '+8801700000000',
    createdAt: new Date('2026-04-03T07:00:00.000Z'),
    updatedAt: new Date('2026-04-03T07:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        {
          provide: getRepositoryToken(Offer),
          useValue: {
            find: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((value) => value),
            save: jest.fn(),
            delete: jest.fn(),
          } satisfies Partial<Repository<Offer>>,
        },
      ],
    }).compile();

    offersService = module.get(OffersService);
    offersRepository = module.get(getRepositoryToken(Offer));
  });

  it('generates a unique slug when the base slug already exists', async () => {
    offersRepository.findOne
      .mockResolvedValueOnce(baseOffer)
      .mockResolvedValueOnce(null);
    offersRepository.save.mockImplementation((value: Partial<Offer>) =>
      Promise.resolve({
        ...baseOffer,
        ...value,
        id: 'offer-2',
        createdAt: baseOffer.createdAt,
        updatedAt: baseOffer.updatedAt,
      } as Offer),
    );

    const response = await offersService.createOffer({
      title: "Cox's Bazar Weekend Escape",
      summary: 'A short beach getaway package for the weekend.',
      description:
        "Three days and two nights in Cox's Bazar with hotel stay included.",
      destination: "Cox's Bazar",
      durationNights: 2,
      price: 12500,
      currency: 'bdt',
      imageUrls: ['https://example.com/coxs-bazar-1.jpg'],
      contactWhatsApp: '+8801700000000',
    });

    expect(response.slug).toBe('coxs-bazar-weekend-escape-2');
    expect(response.currency).toBe('BDT');
  });

  it('returns paginated admin offers with metadata and filters', async () => {
    offersRepository.findAndCount.mockResolvedValue([[baseOffer], 3]);

    const response = await offersService.getAdminOffers({
      status: OfferStatus.PUBLISHED,
      page: 2,
      limit: 1,
    });

    expect(response).toEqual({
      items: [
        {
          ...baseOffer,
          createdAt: baseOffer.createdAt.toISOString(),
          updatedAt: baseOffer.updatedAt.toISOString(),
        },
      ],
      total: 3,
      page: 2,
      limit: 1,
    });
    expect(offersRepository.findAndCount).toHaveBeenCalledWith({
      where: {
        status: OfferStatus.PUBLISHED,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: 1,
      take: 1,
    });
  });

  it('adds text search filters for the admin list', async () => {
    offersRepository.findAndCount.mockResolvedValue([[], 0]);

    await offersService.getAdminOffers({
      status: OfferStatus.PUBLISHED,
      search: " Cox's ",
      page: 1,
      limit: 10,
    });

    const findCall = offersRepository.findAndCount.mock.calls[0] as [unknown];
    const options = findCall[0] as { where: Array<Record<string, unknown>> };

    expect(options.where).toHaveLength(4);
    expect(options.where[0]).toMatchObject({
      status: OfferStatus.PUBLISHED,
    });
    expect(options.where[0]).toHaveProperty('title');
    expect(options.where[1]).toHaveProperty('destination');
    expect(options.where[2]).toHaveProperty('summary');
    expect(options.where[3]).toHaveProperty('slug');
  });

  it('ignores blank search input for the admin list', async () => {
    offersRepository.findAndCount.mockResolvedValue([[], 0]);

    await offersService.getAdminOffers({
      search: '   ',
    });

    expect(offersRepository.findAndCount).toHaveBeenCalledWith({
      where: undefined,
      order: {
        createdAt: 'DESC',
      },
      skip: 0,
      take: 10,
    });
  });

  it('returns only published offers for the public list', async () => {
    offersRepository.find.mockResolvedValue([
      baseOffer,
      {
        ...baseOffer,
        id: 'offer-2',
        slug: 'sylhet-green-retreat',
        title: 'Sylhet Green Retreat',
      },
    ]);

    const response = await offersService.getPublishedOffers();
    const findCall = offersRepository.find.mock.calls[0] as [unknown];

    expect(findCall[0]).toEqual({
      where: {
        status: OfferStatus.PUBLISHED,
      },
      order: {
        createdAt: 'DESC',
      },
    });
    expect(response).toHaveLength(2);
    expect(
      response.every((offer) => offer.status === OfferStatus.PUBLISHED),
    ).toBe(true);
  });

  it('throws 404 when a published slug is not found', async () => {
    offersRepository.findOne.mockResolvedValue(null);

    await expect(
      offersService.getPublishedOfferBySlug('missing-offer'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an offer when it exists', async () => {
    offersRepository.delete.mockResolvedValue({
      affected: 1,
    });

    await expect(offersService.deleteOffer(baseOffer.id)).resolves.toBeUndefined();
    expect(offersRepository.delete).toHaveBeenCalledWith({
      id: baseOffer.id,
    });
  });

  it('throws 404 when deleting a missing offer', async () => {
    offersRepository.delete.mockResolvedValue({
      affected: 0,
    });

    await expect(offersService.deleteOffer('missing-offer')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

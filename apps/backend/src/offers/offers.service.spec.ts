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
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
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
    expiresAt: null,
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
            findOne: jest.fn(),
            create: jest.fn((value) => value),
            save: jest.fn(),
            remove: jest.fn(),
          } satisfies Partial<Repository<Offer>>,
        },
      ],
    }).compile();

    offersService = module.get(OffersService);
    offersRepository = module.get(getRepositoryToken(Offer));
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('returns only published offers for the public list', async () => {
    const now = new Date('2026-04-04T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now.getTime());

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
    const findCall = offersRepository.find.mock.calls[0] as [
      {
        where: Array<{
          status: OfferStatus;
          expiresAt: {
            _type: string;
            _value?: Date;
          };
        }>;
        order: {
          createdAt: 'DESC';
        };
      },
    ];

    expect(findCall[0].order).toEqual({
      createdAt: 'DESC',
    });
    expect(findCall[0].where).toEqual([
      expect.objectContaining({
        status: OfferStatus.PUBLISHED,
        expiresAt: expect.objectContaining({
          _type: 'isNull',
        }),
      }),
      expect.objectContaining({
        status: OfferStatus.PUBLISHED,
        expiresAt: expect.objectContaining({
          _type: 'moreThanOrEqual',
          _value: now,
        }),
      }),
    ]);
    expect(response).toHaveLength(2);
    expect(
      response.every((offer) => offer.status === OfferStatus.PUBLISHED),
    ).toBe(true);
  });

  it('stores expiresAt as end-of-day when creating an offer with expiryDate', async () => {
    offersRepository.findOne.mockResolvedValue(null);
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
      currency: 'BDT',
      expiryDate: '2026-04-30',
      imageUrls: ['https://example.com/coxs-bazar-1.jpg'],
      contactWhatsApp: '+8801700000000',
    });

    const saveCall = offersRepository.save.mock.calls[0] as [Offer];

    expect(saveCall[0].expiresAt).toBeInstanceOf(Date);
    expect(saveCall[0].expiresAt?.getFullYear()).toBe(2026);
    expect(saveCall[0].expiresAt?.getMonth()).toBe(3);
    expect(saveCall[0].expiresAt?.getDate()).toBe(30);
    expect(saveCall[0].expiresAt?.getHours()).toBe(23);
    expect(saveCall[0].expiresAt?.getMinutes()).toBe(59);
    expect(saveCall[0].expiresAt?.getSeconds()).toBe(59);
    expect(saveCall[0].expiresAt?.getMilliseconds()).toBe(999);
    expect(response.expiresAt).toBe(saveCall[0].expiresAt?.toISOString());
  });

  it('throws 404 when a published slug is not found', async () => {
    const now = new Date('2026-04-04T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now.getTime());
    offersRepository.findOne.mockResolvedValue(null);

    await expect(
      offersService.getPublishedOfferBySlug('missing-offer'),
    ).rejects.toBeInstanceOf(NotFoundException);

    const findCall = offersRepository.findOne.mock.calls[0] as [
      {
        where: Array<{
          slug: string;
          status: OfferStatus;
          expiresAt: {
            _type: string;
            _value?: Date;
          };
        }>;
      },
    ];

    expect(findCall[0].where).toEqual([
      expect.objectContaining({
        slug: 'missing-offer',
        status: OfferStatus.PUBLISHED,
        expiresAt: expect.objectContaining({
          _type: 'isNull',
        }),
      }),
      expect.objectContaining({
        slug: 'missing-offer',
        status: OfferStatus.PUBLISHED,
        expiresAt: expect.objectContaining({
          _type: 'moreThanOrEqual',
          _value: now,
        }),
      }),
    ]);
  });

  it('stores expiresAt as end-of-day when updating an offer with expiryDate', async () => {
    offersRepository.findOne.mockResolvedValue(baseOffer);
    offersRepository.save.mockImplementation((value: Partial<Offer>) =>
      Promise.resolve({
        ...baseOffer,
        ...value,
      } as Offer),
    );

    const response = await offersService.updateOffer(baseOffer.id, {
      expiryDate: '2026-05-05',
    });

    const saveCall = offersRepository.save.mock.calls[0] as [Offer];

    expect(saveCall[0].expiresAt).toBeInstanceOf(Date);
    expect(saveCall[0].expiresAt?.getFullYear()).toBe(2026);
    expect(saveCall[0].expiresAt?.getMonth()).toBe(4);
    expect(saveCall[0].expiresAt?.getDate()).toBe(5);
    expect(saveCall[0].expiresAt?.getHours()).toBe(23);
    expect(saveCall[0].expiresAt?.getMinutes()).toBe(59);
    expect(saveCall[0].expiresAt?.getSeconds()).toBe(59);
    expect(saveCall[0].expiresAt?.getMilliseconds()).toBe(999);
    expect(response.expiresAt).toBe(saveCall[0].expiresAt?.toISOString());
  });

  it('deletes an offer when it exists', async () => {
    offersRepository.findOne.mockResolvedValue(baseOffer);

    await offersService.deleteOffer(baseOffer.id);

    expect(offersRepository.remove).toHaveBeenCalledWith(baseOffer);
  });

  it('throws 404 when deleting a missing offer', async () => {
    offersRepository.findOne.mockResolvedValue(null);

    await expect(offersService.deleteOffer('missing-offer')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

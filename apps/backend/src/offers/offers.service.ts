import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { OfferStatus } from './enums/offer-status.enum';
import { parseDateOnlyToEndOfDay } from './utils/expiry-date.util';
import { slugify } from './utils/slug.util';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
  ) {}

  async createOffer(createOfferDto: CreateOfferDto): Promise<OfferResponseDto> {
    const { expiryDate, ...offerInput } = createOfferDto;
    const slug = await this.generateUniqueSlug(
      offerInput.slug ?? offerInput.title,
    );

    const offer = this.offersRepository.create({
      ...offerInput,
      slug,
      currency: offerInput.currency.toUpperCase(),
      status: offerInput.status ?? OfferStatus.DRAFT,
      expiresAt: this.resolveExpiresAt(expiryDate) ?? null,
    });

    const savedOffer = await this.offersRepository.save(offer);

    return this.toResponseDto(savedOffer);
  }

  async getAdminOffers(): Promise<OfferResponseDto[]> {
    const offers = await this.offersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return offers.map((offer) => this.toResponseDto(offer));
  }

  async getAdminOfferById(id: string): Promise<OfferResponseDto> {
    const offer = await this.findOfferById(id);

    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }

    return this.toResponseDto(offer);
  }

  async findOfferById(id: string): Promise<Offer | null> {
    return this.offersRepository.findOne({
      where: {
        id,
      },
    });
  }

  async updateOffer(
    id: string,
    updateOfferDto: UpdateOfferDto,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersRepository.findOne({
      where: {
        id,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }

    if (updateOfferDto.slug || updateOfferDto.title) {
      offer.slug = await this.generateUniqueSlug(
        updateOfferDto.slug ?? updateOfferDto.title ?? offer.title,
        offer.id,
      );
    }

    const { expiryDate, ...offerInput } = updateOfferDto;
    const expiresAt = this.resolveExpiresAt(expiryDate);

    Object.assign(offer, {
      ...offerInput,
      currency: offerInput.currency?.toUpperCase() ?? offer.currency,
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    });

    const updatedOffer = await this.offersRepository.save(offer);

    return this.toResponseDto(updatedOffer);
  }

  async deleteOffer(id: string): Promise<void> {
    const offer = await this.findOfferById(id);

    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }

    await this.offersRepository.remove(offer);
  }

  async getPublishedOffers(): Promise<OfferResponseDto[]> {
    const now = new Date();
    const offers = await this.offersRepository.find({
      where: [
        {
          status: OfferStatus.PUBLISHED,
          expiresAt: IsNull(),
        },
        {
          status: OfferStatus.PUBLISHED,
          expiresAt: MoreThanOrEqual(now),
        },
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return offers.map((offer) => this.toResponseDto(offer));
  }

  async getPublishedOfferBySlug(slug: string): Promise<OfferResponseDto> {
    const now = new Date();
    const offer = await this.offersRepository.findOne({
      where: [
        {
          slug,
          status: OfferStatus.PUBLISHED,
          expiresAt: IsNull(),
        },
        {
          slug,
          status: OfferStatus.PUBLISHED,
          expiresAt: MoreThanOrEqual(now),
        },
      ],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }

    return this.toResponseDto(offer);
  }

  private async generateUniqueSlug(
    slugSource: string,
    currentOfferId?: string,
  ): Promise<string> {
    const baseSlug = slugify(slugSource);
    let candidateSlug = baseSlug || 'offer';
    let suffix = 2;

    while (await this.slugExists(candidateSlug, currentOfferId)) {
      candidateSlug = `${baseSlug || 'offer'}-${suffix}`;
      suffix += 1;
    }

    return candidateSlug;
  }

  private async slugExists(
    slug: string,
    currentOfferId?: string,
  ): Promise<boolean> {
    const existingOffer = await this.offersRepository.findOne({
      where: {
        slug,
      },
    });

    if (!existingOffer) {
      return false;
    }

    if (currentOfferId && existingOffer.id === currentOfferId) {
      return false;
    }

    return true;
  }

  private toResponseDto(offer: Offer): OfferResponseDto {
    return {
      id: offer.id,
      title: offer.title,
      slug: offer.slug,
      summary: offer.summary,
      description: offer.description,
      destination: offer.destination,
      durationNights: offer.durationNights,
      price: offer.price,
      currency: offer.currency,
      status: offer.status,
      expiresAt: offer.expiresAt?.toISOString() ?? null,
      imageUrls: offer.imageUrls,
      contactWhatsApp: offer.contactWhatsApp,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  }

  private resolveExpiresAt(
    expiryDate?: string | null,
  ): Date | null | undefined {
    if (expiryDate === undefined) {
      return undefined;
    }

    if (expiryDate === null) {
      return null;
    }

    try {
      return parseDateOnlyToEndOfDay(expiryDate);
    } catch {
      throw new BadRequestException(
        'expiryDate must be a valid date in YYYY-MM-DD format.',
      );
    }
  }
}

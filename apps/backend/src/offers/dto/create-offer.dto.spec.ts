import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOfferDto } from './create-offer.dto';

function buildCreateOfferDtoInput(overrides: Partial<CreateOfferDto> = {}) {
  return {
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
    ...overrides,
  };
}

describe('CreateOfferDto', () => {
  it('accepts localhost upload URLs', async () => {
    const dto = plainToInstance(
      CreateOfferDto,
      buildCreateOfferDtoInput({
        imageUrls: ['http://localhost:3000/uploads/offers/offer-image.jpg'],
      }),
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('normalizes a JSON-encoded imageUrls array before validation', async () => {
    const dto = plainToInstance(
      CreateOfferDto,
      buildCreateOfferDtoInput({
        imageUrls: JSON.stringify([
          'http://localhost:3000/uploads/offers/offer-image.jpg',
        ]) as unknown as string[],
      }),
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.imageUrls).toEqual([
      'http://localhost:3000/uploads/offers/offer-image.jpg',
    ]);
  });
});

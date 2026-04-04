import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateOfferDto } from './create-offer.dto';

function makeDto(overrides: Partial<CreateOfferDto> = {}): CreateOfferDto {
  return plainToInstance(CreateOfferDto, {
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
  });
}

describe('CreateOfferDto', () => {
  it('accepts localhost image urls', () => {
    const dto = makeDto({
      imageUrls: ['http://localhost:3000/uploads/offers/example.jpg'],
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects non-url image values', () => {
    const dto = makeDto({
      imageUrls: ['example.jpg'],
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('imageUrls');
  });
});

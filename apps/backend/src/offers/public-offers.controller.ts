import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OfferResponseDto } from './dto/offer-response.dto';
import { OffersService } from './offers.service';

@ApiTags('Offers')
@Controller('offers')
export class PublicOffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  @ApiOkResponse({
    type: OfferResponseDto,
    isArray: true,
  })
  getPublishedOffers(): Promise<OfferResponseDto[]> {
    return this.offersService.getPublishedOffers();
  }

  @Get(':slug')
  @ApiOkResponse({
    type: OfferResponseDto,
  })
  getPublishedOfferBySlug(
    @Param('slug') slug: string,
  ): Promise<OfferResponseDto> {
    return this.offersService.getPublishedOfferBySlug(slug);
  }
}

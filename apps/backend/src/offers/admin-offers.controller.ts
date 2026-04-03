import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OffersService } from './offers.service';

@ApiTags('Admin Offers')
@ApiBearerAuth()
@Controller('admin/offers')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @ApiOkResponse({
    type: OfferResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'Returned when the authenticated user is not an admin.',
  })
  createOffer(
    @Body() createOfferDto: CreateOfferDto,
  ): Promise<OfferResponseDto> {
    return this.offersService.createOffer(createOfferDto);
  }

  @Get()
  @ApiOkResponse({
    type: OfferResponseDto,
    isArray: true,
  })
  getAdminOffers(): Promise<OfferResponseDto[]> {
    return this.offersService.getAdminOffers();
  }

  @Get(':id')
  @ApiOkResponse({
    type: OfferResponseDto,
  })
  getAdminOfferById(@Param('id') id: string): Promise<OfferResponseDto> {
    return this.offersService.getAdminOfferById(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: OfferResponseDto,
  })
  updateOffer(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ): Promise<OfferResponseDto> {
    return this.offersService.updateOffer(id, updateOfferDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Returned when the offer is deleted successfully.',
  })
  deleteOffer(@Param('id') id: string): Promise<void> {
    return this.offersService.deleteOffer(id);
  }
}

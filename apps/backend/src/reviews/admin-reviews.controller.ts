import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
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
import { AdminReviewResponseDto } from './dto/admin-review-response.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Admin Reviews')
@ApiBearerAuth()
@Controller('admin/reviews')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOkResponse({
    type: AdminReviewResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'Returned when the authenticated user is not an admin.',
  })
  getAdminReviews(): Promise<AdminReviewResponseDto[]> {
    return this.reviewsService.getAdminReviews();
  }

  @Get(':id')
  @ApiOkResponse({
    type: AdminReviewResponseDto,
  })
  getAdminReviewById(@Param('id') id: string): Promise<AdminReviewResponseDto> {
    return this.reviewsService.getAdminReviewById(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: AdminReviewResponseDto,
  })
  updateReviewStatus(
    @Param('id') id: string,
    @Body() updateReviewStatusDto: UpdateReviewStatusDto,
  ): Promise<AdminReviewResponseDto> {
    return this.reviewsService.updateReviewStatus(id, updateReviewStatusDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Returned when the review is deleted successfully.',
  })
  deleteReview(@Param('id') id: string): Promise<void> {
    return this.reviewsService.deleteReview(id);
  }
}

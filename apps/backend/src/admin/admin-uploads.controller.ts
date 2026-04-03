import {
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { AdminUploadedImageDto } from './dto/admin-uploaded-image.dto';
import { UploadedImageFile } from './interfaces/uploaded-image-file.interface';
import { AdminUploadsService } from './admin-uploads.service';

const MAX_OFFER_IMAGE_COUNT = 6;
const MAX_OFFER_IMAGE_SIZE = 5 * 1024 * 1024;

@ApiTags('Admin Uploads')
@ApiBearerAuth()
@Controller('admin/uploads')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUploadsController {
  constructor(private readonly adminUploadsService: AdminUploadsService) {}

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('images', MAX_OFFER_IMAGE_COUNT, {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_OFFER_IMAGE_SIZE,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['images'],
    },
  })
  @ApiOkResponse({
    type: AdminUploadedImageDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Returned when the access token is missing or invalid.',
  })
  @ApiForbiddenResponse({
    description: 'Returned when the authenticated user is not an admin.',
  })
  uploadOfferImages(
    @UploadedFiles() files: UploadedImageFile[],
    @Req() request: Request,
  ): Promise<AdminUploadedImageDto[]> {
    return this.adminUploadsService.storeOfferImages(files ?? [], request);
  }
}

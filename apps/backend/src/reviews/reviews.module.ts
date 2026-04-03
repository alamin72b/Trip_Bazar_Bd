import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { OffersModule } from '../offers/offers.module';
import { UsersModule } from '../users/users.module';
import { AdminReviewsController } from './admin-reviews.controller';
import { Review } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    AuthModule,
    OffersModule,
    UsersModule,
  ],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService, RolesGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}

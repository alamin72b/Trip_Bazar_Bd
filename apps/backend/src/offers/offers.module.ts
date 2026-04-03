import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Offer } from './entities/offer.entity';
import { AdminOffersController } from './admin-offers.controller';
import { OffersService } from './offers.service';
import { PublicOffersController } from './public-offers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Offer]), AuthModule],
  controllers: [AdminOffersController, PublicOffersController],
  providers: [OffersService, RolesGuard],
  exports: [OffersService],
})
export class OffersModule {}

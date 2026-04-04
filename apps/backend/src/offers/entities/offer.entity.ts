import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { OfferStatus } from '../enums/offer-status.enum';

@Entity({ name: 'offers' })
@Unique(['slug'])
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  slug!: string;

  @Column()
  summary!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  destination!: string;

  @Column()
  durationNights!: number;

  @Column({ type: 'float' })
  price!: number;

  @Column()
  currency!: string;

  @Column({
    type: 'simple-enum',
    enum: OfferStatus,
    default: OfferStatus.DRAFT,
  })
  status!: OfferStatus;

  @Column({ type: 'datetime', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'simple-json' })
  imageUrls!: string[];

  @Column()
  contactWhatsApp!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}

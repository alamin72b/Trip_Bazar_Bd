import Link from 'next/link';
import { buildWhatsAppUrl, formatCurrency } from '@/lib/api';
import type { Offer } from '@/lib/types';

export function OfferCard({ offer }: { offer: Offer }) {
  const primaryImage =
    offer.imageUrls[0] ??
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80';

  return (
    <article className="offer-card">
      <div
        className="offer-card__media"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(9, 16, 29, 0.05), rgba(9, 16, 29, 0.72)), url(${primaryImage})`,
        }}
      />
      <div className="offer-card__content">
        <p className="offer-card__meta">
          {offer.destination} · {offer.durationNights} nights
        </p>
        <h3>{offer.title}</h3>
        <p>{offer.summary}</p>
        <div className="offer-card__footer">
          <div>
            <span className="offer-card__price">
              {formatCurrency(offer.price, offer.currency)}
            </span>
            <span className="offer-card__status">Published</span>
          </div>
          <div className="offer-card__actions">
            <Link className="button button-secondary" href={`/offers/${offer.slug}`}>
              View offer
            </Link>
            <a
              className="button button-primary"
              href={buildWhatsAppUrl(offer.contactWhatsApp, offer.title)}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

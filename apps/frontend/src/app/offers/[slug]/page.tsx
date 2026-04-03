import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReviewSection } from '@/components/review-section';
import {
  ApiError,
  buildWhatsAppUrl,
  formatCurrency,
  getOfferReviews,
  getPublicOfferBySlug,
} from '@/lib/api';

interface OfferDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OfferDetailPage({
  params,
}: OfferDetailPageProps) {
  const { slug } = await params;

  try {
    const offer = await getPublicOfferBySlug(slug);
    const reviews = await getOfferReviews(offer.id);
    const heroImage =
      offer.imageUrls[0] ??
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';

    return (
      <div className="shell page-section offer-detail-page">
        <Link className="back-link" href="/offers">
          Back to offers
        </Link>

        <section className="offer-detail-hero">
          <div
            className="offer-detail-hero__image"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(9, 16, 29, 0.08), rgba(9, 16, 29, 0.78)), url(${heroImage})`,
            }}
          />

          <div className="offer-detail-hero__content panel">
            <p className="eyebrow">
              {offer.destination} · {offer.durationNights} nights
            </p>
            <h1 className="section-heading">{offer.title}</h1>
            <p className="offer-detail-hero__summary">{offer.summary}</p>

            <div className="offer-detail-stats">
              <div>
                <span>Price</span>
                <strong>{formatCurrency(offer.price, offer.currency)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{offer.status}</strong>
              </div>
            </div>

            <div className="hero-actions">
              <a
                className="button button-primary"
                href={buildWhatsAppUrl(offer.contactWhatsApp, offer.title)}
                rel="noreferrer"
                target="_blank"
              >
                Contact on WhatsApp
              </a>
              <Link
                className="button button-secondary"
                href={`/auth?redirect=${encodeURIComponent(`/offers/${offer.slug}`)}`}
              >
                Sign in to review
              </Link>
            </div>
          </div>
        </section>

        <section className="offer-detail-copy">
          <div className="panel">
            <p className="eyebrow">Trip overview</p>
            <h2 className="section-heading section-heading-sm">Why travelers open this offer</h2>
            <p className="muted-copy">{offer.description}</p>
          </div>

          <div className="panel">
            <p className="eyebrow">Contact path</p>
            <h2 className="section-heading section-heading-sm">Direct chat with the admin team</h2>
            <p className="muted-copy">
              This frontend keeps the current TripBazarBD conversion model: users
              browse online, then continue the conversation on WhatsApp.
            </p>
            <a
              className="button button-primary"
              href={buildWhatsAppUrl(offer.contactWhatsApp, offer.title)}
              rel="noreferrer"
              target="_blank"
            >
              Open WhatsApp chat
            </a>
          </div>
        </section>

        <ReviewSection offerId={offer.id} offerSlug={offer.slug} reviews={reviews} />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <div className="shell page-section">
        <div className="panel error-panel">
          <p className="eyebrow">Offer unavailable</p>
          <h1 className="section-heading">This offer could not be loaded right now.</h1>
          <p className="muted-copy">
            The backend may be offline, or the API response may have failed.
          </p>
        </div>
      </div>
    );
  }
}

import Link from 'next/link';
import { getPublicOffers } from '@/lib/api';
import { OfferCard } from '@/components/offer-card';
import type { Offer } from '@/lib/types';

export default async function HomePage() {
  let offers: Offer[] = [];
  let errorMessage: string | null = null;

  try {
    offers = (await getPublicOffers()).slice(0, 3);
  } catch {
    errorMessage =
      'The offer feed is not available right now. Start the backend and try again.';
  }

  return (
    <>
      <section className="hero-section">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Public travel storefront</p>
            <h1>Travel inspiration first, WhatsApp conversion second, booking friction never.</h1>
            <p className="hero-copy__body">
              TripBazarBD turns published offers into a modern public storefront.
              Guests browse freely, travelers sign in only when they want to review,
              and every offer keeps WhatsApp as the direct conversion path.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/offers">
                Explore offers
              </Link>
              <Link className="button button-secondary" href="/auth">
                Sign in for reviews
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-stat-card">
              <span className="hero-stat-card__label">Conversion path</span>
              <strong>WhatsApp-first</strong>
              <p>Every offer detail page keeps the admin’s WhatsApp number visible and actionable.</p>
            </div>
            <div className="hero-stat-card hero-stat-card--accent">
              <span className="hero-stat-card__label">Trust signal</span>
              <strong>User reviews</strong>
              <p>Signed-in travelers can leave feedback while guests read reviews without friction.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="shell page-section">
        <div className="section-intro">
          <div>
            <p className="eyebrow">Featured offers</p>
            <h2 className="section-heading">Start with a few published trips that already have strong public detail pages.</h2>
          </div>
          <Link className="section-link" href="/offers">
            See all offers
          </Link>
        </div>

        {errorMessage ? (
          <div className="panel error-panel">
            <p>{errorMessage}</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="panel empty-state-panel">
            <p className="eyebrow">No published offers yet</p>
            <p className="muted-copy">
              Publish a few offers from the backend admin routes and they will appear
              here automatically.
            </p>
          </div>
        ) : (
          <div className="offer-grid">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

import { OfferCard } from '@/components/offer-card';
import { getPublicOffers } from '@/lib/api';

export default async function OffersPage() {
  try {
    const offers = await getPublicOffers();

    return (
      <div className="shell page-section">
        <div className="section-intro section-intro--stacked">
          <p className="eyebrow">Published offers</p>
          <h1 className="section-heading">Browse every live TripBazarBD travel package.</h1>
          <p className="muted-copy">
            These offers are public, guest-accessible, and ready for WhatsApp
            inquiry.
          </p>
        </div>

        {offers.length === 0 ? (
          <div className="panel empty-state-panel">
            <p className="eyebrow">No offers yet</p>
            <p className="muted-copy">
              The backend is running, but there are no published offers to show yet.
            </p>
          </div>
        ) : (
          <div className="offer-grid">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <div className="shell page-section">
        <div className="panel error-panel">
          <p className="eyebrow">Offer feed unavailable</p>
          <h1 className="section-heading">The public offers API could not be reached.</h1>
          <p className="muted-copy">
            Start the backend at `http://localhost:3000` or update the frontend API
            base URL.
          </p>
        </div>
      </div>
    );
  }
}

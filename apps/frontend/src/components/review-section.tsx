import { formatReviewDate } from '@/lib/api';
import type { Review } from '@/lib/types';
import { ReviewComposer } from './review-composer';

interface ReviewSectionProps {
  offerId: string;
  offerSlug: string;
  reviews: Review[];
}

export function ReviewSection({
  offerId,
  offerSlug,
  reviews,
}: ReviewSectionProps) {
  return (
    <section className="review-layout">
      <ReviewComposer offerId={offerId} offerSlug={offerSlug} />

      <div className="panel review-list">
        <div>
          <p className="eyebrow">Public reviews</p>
          <h2 className="section-heading section-heading-sm">
            What travelers are already saying
          </h2>
        </div>

        {reviews.length === 0 ? (
          <p className="empty-state">
            No reviews yet. Be the first traveler to leave one after signing in.
          </p>
        ) : (
          <div className="review-list__items">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card__header">
                  <div>
                    <p className="review-card__name">{review.reviewerDisplayName}</p>
                    <p className="review-card__date">
                      {formatReviewDate(review.createdAt)}
                    </p>
                  </div>
                  <p className="review-card__rating">{review.rating}/5</p>
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

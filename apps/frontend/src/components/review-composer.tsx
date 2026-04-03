'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ApiError, createReview } from '@/lib/api';
import { useAuth } from './auth-provider';

interface ReviewComposerProps {
  offerId: string;
  offerSlug: string;
}

export function ReviewComposer({ offerId, offerSlug }: ReviewComposerProps) {
  const router = useRouter();
  const { accessToken, refreshSession, status } = useAuth();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReview(currentAccessToken: string) {
    return createReview(offerId, currentAccessToken, {
      rating: Number(rating),
      comment,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      let token = accessToken;

      if (!token) {
        token = await refreshSession();
      }

      if (!token) {
        throw new Error('Please sign in before submitting a review.');
      }

      try {
        await submitReview(token);
      } catch (submitError) {
        if (submitError instanceof ApiError && submitError.status === 401) {
          const refreshedToken = await refreshSession();

          if (!refreshedToken) {
            throw new Error('Your session expired. Please sign in again.');
          }

          await submitReview(refreshedToken);
        } else {
          throw submitError;
        }
      }

      setComment('');
      setRating('5');
      setSuccessMessage('Review submitted. Thanks for sharing your experience.');
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not submit the review.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === 'loading') {
    return <div className="panel muted-copy">Checking your account status...</div>;
  }

  if (status === 'guest') {
    return (
      <div className="panel review-gate">
        <p className="eyebrow">Reviews need login</p>
        <h3>Sign in to share your trip experience</h3>
        <p className="muted-copy">
          Guests can browse reviews freely, but only authenticated users can add
          one.
        </p>
        <Link
          className="button button-primary"
          href={`/auth?redirect=/offers/${offerSlug}`}
        >
          Go to auth
        </Link>
      </div>
    );
  }

  return (
    <form className="panel form-stack" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Leave a review</p>
        <h3 className="section-heading section-heading-sm">Tell future travelers what stood out</h3>
      </div>

      <label className="field">
        <span>Rating</span>
        <select onChange={(event) => setRating(event.target.value)} value={rating}>
          <option value="5">5 · Excellent</option>
          <option value="4">4 · Very good</option>
          <option value="3">3 · Good</option>
          <option value="2">2 · Fair</option>
          <option value="1">1 · Poor</option>
        </select>
      </label>

      <label className="field">
        <span>Comment</span>
        <textarea
          maxLength={600}
          minLength={10}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What was the trip like, and would you recommend it?"
          required
          rows={5}
          value={comment}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {successMessage ? <p className="form-success">{successMessage}</p> : null}

      <button className="button button-primary button-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ApiError,
  createAdminOffer,
  deleteAdminOffer,
  deleteAdminReview,
  formatCurrency,
  formatDate,
  formatDateTime,
  getAdminOffers,
  getAdminReviews,
  getAdminUsers,
  updateAdminOffer,
  updateAdminReview,
  updateAdminUser,
  uploadAdminOfferImages,
} from '@/lib/api';
import type {
  AdminOfferInput,
  AdminReview,
  AdminUploadedImage,
  AdminUser,
  Offer,
  OfferStatus,
  UserRole,
} from '@/lib/types';
import { useAuth } from './auth-provider';

type AdminSection = 'offers' | 'reviews' | 'users';

interface OfferImageState {
  filename: string;
  url: string;
}

interface OfferFormState {
  title: string;
  summary: string;
  description: string;
  destination: string;
  durationNights: string;
  price: string;
  currency: string;
  status: OfferStatus;
  expiryDate: string;
  images: OfferImageState[];
  contactWhatsApp: string;
}

const defaultOfferFormState: OfferFormState = {
  title: '',
  summary: '',
  description: '',
  destination: '',
  durationNights: '1',
  price: '0',
  currency: 'BDT',
  status: 'draft',
  expiryDate: '',
  images: [],
  contactWhatsApp: '+8801700000000',
};

function deriveFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);

    return decodeURIComponent(segments.at(-1) ?? 'offer-image');
  } catch {
    return 'offer-image';
  }
}

function mapUploadedImageToState(image: AdminUploadedImage): OfferImageState {
  return {
    filename: image.filename,
    url: image.url,
  };
}

function toDateInputValue(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isOfferExpired(offer: Offer): boolean {
  return offer.expiresAt ? new Date(offer.expiresAt) < new Date() : false;
}

function mapOfferToFormState(offer: Offer): OfferFormState {
  return {
    title: offer.title,
    summary: offer.summary,
    description: offer.description,
    destination: offer.destination,
    durationNights: String(offer.durationNights),
    price: String(offer.price),
    currency: offer.currency,
    status: offer.status,
    expiryDate: toDateInputValue(offer.expiresAt),
    images: offer.imageUrls.map((url) => ({
      url,
      filename: deriveFilenameFromUrl(url),
    })),
    contactWhatsApp: offer.contactWhatsApp,
  };
}

function toOfferPayload(values: OfferFormState): AdminOfferInput {
  if (values.images.length === 0) {
    throw new Error('Upload at least one image before saving the offer.');
  }

  return {
    title: values.title.trim(),
    summary: values.summary.trim(),
    description: values.description.trim(),
    destination: values.destination.trim(),
    durationNights: Number(values.durationNights),
    price: Number(values.price),
    currency: values.currency.trim().toUpperCase(),
    status: values.status,
    expiryDate: values.expiryDate.trim() || null,
    imageUrls: values.images.map((image) => image.url),
    contactWhatsApp: values.contactWhatsApp.trim(),
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed.';
}

export function AdminDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { accessToken, refreshSession, status, user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('offers');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<OfferFormState>(defaultOfferFormState);
  const [offerFormError, setOfferFormError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isOfferSubmitting, setIsOfferSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  const runAdminTask = useCallback(
    async <T,>(task: (token: string) => Promise<T>): Promise<T> => {
      let token = accessToken;

      if (!token) {
        token = await refreshSession();
      }

      if (!token) {
        router.replace('/auth?redirect=%2Fadmin');
        throw new Error('Your session expired. Please sign in again.');
      }

      try {
        return await task(token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          const refreshedToken = await refreshSession();

          if (!refreshedToken) {
            router.replace('/auth?redirect=%2Fadmin');
            throw new Error('Your session expired. Please sign in again.');
          }

          return task(refreshedToken);
        }

        if (error instanceof ApiError && error.status === 403) {
          router.replace('/offers');
          throw new Error('Admin access is required.');
        }

        throw error;
      }
    },
    [accessToken, refreshSession, router],
  );

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [adminOffers, adminReviews, adminUsers] = await runAdminTask(
        (token) =>
          Promise.all([
            getAdminOffers(token),
            getAdminReviews(token),
            getAdminUsers(token),
          ]),
      );

      setOffers(adminOffers);
      setReviews(adminReviews);
      setUsers(adminUsers);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [runAdminTask]);

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/auth?redirect=%2Fadmin');
      return;
    }

    if (status === 'authenticated' && user?.role !== 'admin') {
      router.replace('/offers');
      return;
    }

    if (status === 'authenticated' && user?.role === 'admin') {
      void loadDashboardData();
    }
  }, [loadDashboardData, router, status, user]);

  function updateOfferForm<K extends keyof OfferFormState>(
    key: K,
    value: OfferFormState[K],
  ) {
    setOfferForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetOfferForm() {
    setSelectedOfferId(null);
    setOfferForm(defaultOfferFormState);
    setOfferFormError(null);
    setUploadError(null);
    setIsDragActive(false);
  }

  function removeOfferImage(url: string) {
    setOfferForm((current) => ({
      ...current,
      images: current.images.filter((image) => image.url !== url),
    }));
  }

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      setUploadError(null);
      setOfferFormError(null);
      setIsUploadingImages(true);

      try {
        const uploadedImages = await runAdminTask((token) =>
          uploadAdminOfferImages(token, files),
        );

        setOfferForm((current) => ({
          ...current,
          images: [
            ...current.images,
            ...uploadedImages.map(mapUploadedImageToState),
          ],
        }));
      } catch (error) {
        setUploadError(getErrorMessage(error));
      } finally {
        setIsUploadingImages(false);
      }
    },
    [runAdminTask],
  );

  async function handleOfferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOfferFormError(null);
    setActionError(null);
    setActionNotice(null);
    setIsOfferSubmitting(true);

    try {
      const payload = toOfferPayload(offerForm);

      await runAdminTask((token) =>
        selectedOfferId
          ? updateAdminOffer(selectedOfferId, token, payload)
          : createAdminOffer(token, payload),
      );

      await loadDashboardData();
      setActionNotice(
        selectedOfferId
          ? 'Offer updated in the admin dashboard.'
          : 'Offer created successfully.',
      );
      resetOfferForm();
    } catch (error) {
      setOfferFormError(getErrorMessage(error));
    } finally {
      setIsOfferSubmitting(false);
    }
  }

  async function handleDeleteOffer(offer: Offer) {
    if (!window.confirm(`Delete "${offer.title}" permanently?`)) {
      return;
    }

    setPendingActionKey(`offer:${offer.id}`);
    setActionError(null);
    setActionNotice(null);

    try {
      await runAdminTask((token) => deleteAdminOffer(offer.id, token));
      await loadDashboardData();

      if (selectedOfferId === offer.id) {
        resetOfferForm();
      }

      setActionNotice('Offer deleted successfully.');
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingActionKey(null);
    }
  }

  async function handleReviewStatus(review: AdminReview) {
    const nextStatus = review.status === 'published' ? 'hidden' : 'published';

    setPendingActionKey(`review:${review.id}`);
    setActionError(null);
    setActionNotice(null);

    try {
      await runAdminTask((token) =>
        updateAdminReview(review.id, token, {
          status: nextStatus,
        }),
      );
      await loadDashboardData();
      setActionNotice(
        nextStatus === 'hidden'
          ? 'Review hidden from the public offer page.'
          : 'Review published again.',
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingActionKey(null);
    }
  }

  async function handleDeleteReview(review: AdminReview) {
    if (!window.confirm(`Delete this review from ${review.userEmail}?`)) {
      return;
    }

    setPendingActionKey(`review-delete:${review.id}`);
    setActionError(null);
    setActionNotice(null);

    try {
      await runAdminTask((token) => deleteAdminReview(review.id, token));
      await loadDashboardData();
      setActionNotice('Review deleted successfully.');
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingActionKey(null);
    }
  }

  async function handleUserUpdate(
    adminUser: AdminUser,
    input: {
      isActive?: boolean;
      role?: UserRole;
    },
  ) {
    setPendingActionKey(`user:${adminUser.id}`);
    setActionError(null);
    setActionNotice(null);

    try {
      await runAdminTask((token) => updateAdminUser(adminUser.id, token, input));
      await loadDashboardData();
      setActionNotice('User updated successfully.');
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingActionKey(null);
    }
  }

  function handleDragState(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    handleDragState(event);
    setIsDragActive(false);

    const files = Array.from(event.dataTransfer.files);

    await uploadFiles(files);
  }

  function openImagePicker() {
    if (isUploadingImages) {
      return;
    }

    fileInputRef.current?.click();
  }

  const publishedOfferCount = offers.filter(
    (offer) => offer.status === 'published' && !isOfferExpired(offer),
  ).length;
  const hiddenReviewCount = reviews.filter(
    (review) => review.status === 'hidden',
  ).length;
  const activeAdminCount = users.filter(
    (adminUser) => adminUser.role === 'admin' && adminUser.isActive,
  ).length;

  if (
    status === 'loading' ||
    (status === 'authenticated' && user?.role === 'admin' && isLoading)
  ) {
    return (
      <div className="shell page-section">
        <div className="panel admin-status-panel">
          <p className="eyebrow">Admin dashboard</p>
          <h1 className="section-heading section-heading-sm">
            Preparing the management workspace...
          </h1>
        </div>
      </div>
    );
  }

  if (status === 'guest') {
    return (
      <div className="shell page-section">
        <div className="panel admin-status-panel">
          <p className="eyebrow">Admin access</p>
          <h1 className="section-heading section-heading-sm">
            Redirecting to sign in...
          </h1>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="shell page-section">
        <div className="panel admin-status-panel">
          <p className="eyebrow">Admin access</p>
          <h1 className="section-heading section-heading-sm">
            Redirecting to the public storefront...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="shell page-section admin-page">
      <section className="admin-hero">
        <div className="admin-hero__copy panel">
          <p className="eyebrow">Admin operations</p>
          <h1 className="section-heading">
            Manage offers, reviews, and users from one dashboard.
          </h1>
          <p className="muted-copy">
            This internal workspace reuses the shared auth flow and the existing
            backend contracts. Public browsing stays open while admin actions stay
            role-protected.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/offers">
              View public offers
            </Link>
            <Link className="button button-secondary" href="/auth">
              Open auth page
            </Link>
          </div>
        </div>

        <div className="admin-hero__stats">
          <article className="admin-stat-card">
            <p className="eyebrow">Offers</p>
            <strong>{offers.length}</strong>
            <span>{publishedOfferCount} publicly live right now</span>
          </article>
          <article className="admin-stat-card">
            <p className="eyebrow">Reviews</p>
            <strong>{reviews.length}</strong>
            <span>{hiddenReviewCount} hidden from public view</span>
          </article>
          <article className="admin-stat-card">
            <p className="eyebrow">Admins</p>
            <strong>{activeAdminCount}</strong>
            <span>active admin accounts</span>
          </article>
        </div>
      </section>

      {loadError ? <p className="form-error">{loadError}</p> : null}
      {actionError ? <p className="form-error">{actionError}</p> : null}
      {actionNotice ? <p className="form-success">{actionNotice}</p> : null}

      <section className="admin-section-switcher">
        {(['offers', 'reviews', 'users'] as const).map((section) => (
          <button
            key={section}
            className={`admin-tab ${activeSection === section ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveSection(section)}
            type="button"
          >
            {section}
          </button>
        ))}
      </section>

      {activeSection === 'offers' ? (
        <section className="admin-grid admin-grid--offers">
          <div className="panel admin-list-panel">
            <div className="admin-panel-header">
              <div>
                <p className="eyebrow">Offer inventory</p>
                <h2 className="section-heading section-heading-sm">
                  Every draft and published package
                </h2>
              </div>
              <button
                className="button button-secondary"
                onClick={resetOfferForm}
                type="button"
              >
                New offer form
              </button>
            </div>

            {offers.length === 0 ? (
              <p className="empty-state">
                No offers yet. Create the first package from the form.
              </p>
            ) : (
              <div className="admin-list">
                {offers.map((offer) => (
                  <article className="admin-record-card" key={offer.id}>
                    <div className="admin-record-card__header">
                      <div>
                        <h3>{offer.title}</h3>
                        <p className="muted-copy">
                          {offer.destination} · {offer.durationNights} nights
                        </p>
                      </div>
                      <span className={`status-pill status-pill--${offer.status}`}>
                        {offer.status}
                      </span>
                    </div>
                    <p>{offer.summary}</p>
                    <div className="admin-record-card__meta">
                      <span>{formatCurrency(offer.price, offer.currency)}</span>
                      {offer.expiresAt ? (
                        <span>
                          {isOfferExpired(offer) ? 'Expired' : 'Expires'}{' '}
                          {formatDate(offer.expiresAt)}
                        </span>
                      ) : (
                        <span>No expiry date</span>
                      )}
                      <span>Updated {formatDateTime(offer.updatedAt)}</span>
                    </div>
                    <div className="admin-record-card__actions">
                      <button
                        className="button button-secondary"
                        onClick={() => {
                          setSelectedOfferId(offer.id);
                          setOfferForm(mapOfferToFormState(offer));
                          setOfferFormError(null);
                          setUploadError(null);
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="button button-secondary"
                        disabled={pendingActionKey === `offer:${offer.id}`}
                        onClick={() => void handleDeleteOffer(offer)}
                        type="button"
                      >
                        Delete
                      </button>
                      {offer.status === 'published' && !isOfferExpired(offer) ? (
                        <Link
                          className="button button-secondary"
                          href={`/offers/${offer.slug}`}
                        >
                          View
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form
            className="panel form-stack admin-form-panel"
            onSubmit={handleOfferSubmit}
          >
            <div className="admin-panel-header">
              <div>
                <p className="eyebrow">
                  {selectedOfferId ? 'Edit offer' : 'Create offer'}
                </p>
                <h2 className="section-heading section-heading-sm">
                  {selectedOfferId
                    ? 'Update the selected offer'
                    : 'Add a new travel package'}
                </h2>
              </div>
              {selectedOfferId ? (
                <button
                  className="button button-secondary"
                  onClick={resetOfferForm}
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="admin-form-grid">
              <label className="field">
                <span>Title</span>
                <input
                  onChange={(event) =>
                    updateOfferForm('title', event.target.value)
                  }
                  required
                  value={offerForm.title}
                />
              </label>
              <div className="field admin-field-note">
                <span>Slug</span>
                <div className="admin-note-box">
                  The backend creates the public slug automatically from the
                  title.
                </div>
              </div>
              <label className="field">
                <span>Destination</span>
                <input
                  onChange={(event) =>
                    updateOfferForm('destination', event.target.value)
                  }
                  required
                  value={offerForm.destination}
                />
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  onChange={(event) =>
                    updateOfferForm('status', event.target.value as OfferStatus)
                  }
                  value={offerForm.status}
                >
                  <option value="draft">Draft (deactivated)</option>
                  <option value="published">Published (active)</option>
                </select>
              </label>
              <label className="field">
                <span>Expiry date</span>
                <input
                  onChange={(event) =>
                    updateOfferForm('expiryDate', event.target.value)
                  }
                  type="date"
                  value={offerForm.expiryDate}
                />
              </label>
              <label className="field">
                <span>Duration nights</span>
                <input
                  min="1"
                  onChange={(event) =>
                    updateOfferForm('durationNights', event.target.value)
                  }
                  required
                  type="number"
                  value={offerForm.durationNights}
                />
              </label>
              <label className="field">
                <span>Price</span>
                <input
                  min="0.01"
                  onChange={(event) => updateOfferForm('price', event.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={offerForm.price}
                />
              </label>
              <label className="field">
                <span>Currency</span>
                <input
                  maxLength={3}
                  onChange={(event) =>
                    updateOfferForm('currency', event.target.value)
                  }
                  required
                  value={offerForm.currency}
                />
              </label>
              <label className="field">
                <span>WhatsApp</span>
                <input
                  onChange={(event) =>
                    updateOfferForm('contactWhatsApp', event.target.value)
                  }
                  required
                  value={offerForm.contactWhatsApp}
                />
              </label>
            </div>

            <label className="field">
              <span>Summary</span>
              <textarea
                minLength={10}
                onChange={(event) => updateOfferForm('summary', event.target.value)}
                required
                rows={3}
                value={offerForm.summary}
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                minLength={20}
                onChange={(event) =>
                  updateOfferForm('description', event.target.value)
                }
                required
                rows={5}
                value={offerForm.description}
              />
            </label>

            <div className="field">
              <span>Offer images</span>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="admin-image-input"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = '';
                  void uploadFiles(files);
                }}
                ref={fileInputRef}
                type="file"
              />
              <div
                className={`admin-upload-dropzone ${
                  isDragActive ? 'admin-upload-dropzone--active' : ''
                }`}
                onClick={openImagePicker}
                onDragEnter={(event) => {
                  handleDragState(event);
                  setIsDragActive(true);
                }}
                onDragLeave={(event) => {
                  handleDragState(event);
                  setIsDragActive(false);
                }}
                onDragOver={handleDragState}
                onDrop={(event) => {
                  void handleDrop(event);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openImagePicker();
                  }
                }}
              >
                <p className="admin-upload-dropzone__title">
                  Drag and drop JPG, PNG, or WebP images here
                </p>
                <p className="muted-copy">
                  Or click to choose files. You can upload up to 6 images, each
                  up to 5 MB.
                </p>
                <button
                  className="button button-secondary"
                  disabled={isUploadingImages}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openImagePicker();
                  }}
                  type="button"
                >
                  {isUploadingImages ? 'Uploading images...' : 'Choose images'}
                </button>
              </div>
            </div>

            {offerForm.images.length > 0 ? (
              <div className="admin-image-grid">
                {offerForm.images.map((image) => (
                  <article className="admin-image-card" key={image.url}>
                    <Image
                      alt={image.filename}
                      className="admin-image-card__preview"
                      height={240}
                      src={image.url}
                      unoptimized
                      width={320}
                    />
                    <div className="admin-image-card__footer">
                      <p>{image.filename}</p>
                      <button
                        className="button button-secondary"
                        onClick={() => removeOfferImage(image.url)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                No images added yet. Upload at least one image before saving.
              </p>
            )}

            {uploadError ? <p className="form-error">{uploadError}</p> : null}
            {offerFormError ? <p className="form-error">{offerFormError}</p> : null}

            <button
              className="button button-primary button-full"
              disabled={isOfferSubmitting || isUploadingImages}
              type="submit"
            >
              {isOfferSubmitting
                ? 'Saving offer...'
                : selectedOfferId
                  ? 'Update offer'
                  : 'Create offer'}
            </button>
          </form>
        </section>
      ) : null}

      {activeSection === 'reviews' ? (
        <section className="panel admin-list-panel">
          <div className="admin-panel-header">
            <div>
              <p className="eyebrow">Review moderation</p>
              <h2 className="section-heading section-heading-sm">
                Control public review visibility
              </h2>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="empty-state">No reviews have been submitted yet.</p>
          ) : (
            <div className="admin-list">
              {reviews.map((review) => (
                <article className="admin-record-card" key={review.id}>
                  <div className="admin-record-card__header">
                    <div>
                      <h3>{review.offerTitle}</h3>
                      <p className="muted-copy">
                        {review.userEmail} · {review.rating}/5
                      </p>
                    </div>
                    <span className={`status-pill status-pill--${review.status}`}>
                      {review.status}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                  <div className="admin-record-card__meta">
                    <span>Created {formatDateTime(review.createdAt)}</span>
                    <span>Updated {formatDateTime(review.updatedAt)}</span>
                  </div>
                  <div className="admin-record-card__actions">
                    <button
                      className="button button-secondary"
                      disabled={pendingActionKey === `review:${review.id}`}
                      onClick={() => void handleReviewStatus(review)}
                      type="button"
                    >
                      {review.status === 'published' ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      className="button button-secondary"
                      disabled={pendingActionKey === `review-delete:${review.id}`}
                      onClick={() => void handleDeleteReview(review)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeSection === 'users' ? (
        <section className="panel admin-list-panel">
          <div className="admin-panel-header">
            <div>
              <p className="eyebrow">User management</p>
              <h2 className="section-heading section-heading-sm">
                Manage access and roles
              </h2>
            </div>
          </div>

          {users.length === 0 ? (
            <p className="empty-state">No users are available yet.</p>
          ) : (
            <div className="admin-list">
              {users.map((adminUser) => {
                const isCurrentUser = adminUser.id === user.id;

                return (
                  <article className="admin-record-card" key={adminUser.id}>
                    <div className="admin-record-card__header">
                      <div>
                        <h3>{adminUser.email}</h3>
                        <p className="muted-copy">
                          {adminUser.role} ·{' '}
                          {adminUser.isActive ? 'active' : 'inactive'}
                          {isCurrentUser ? ' · current session' : ''}
                        </p>
                      </div>
                      <span
                        className={`status-pill ${
                          adminUser.isActive
                            ? 'status-pill--published'
                            : 'status-pill--hidden'
                        }`}
                      >
                        {adminUser.isActive ? 'active' : 'inactive'}
                      </span>
                    </div>
                    <div className="admin-record-card__meta">
                      <span>Joined {formatDateTime(adminUser.createdAt)}</span>
                      <span>Updated {formatDateTime(adminUser.updatedAt)}</span>
                    </div>
                    <div className="admin-record-card__actions">
                      <button
                        className="button button-secondary"
                        disabled={isCurrentUser || pendingActionKey === `user:${adminUser.id}`}
                        onClick={() =>
                          void handleUserUpdate(adminUser, {
                            isActive: !adminUser.isActive,
                          })
                        }
                        type="button"
                      >
                        {adminUser.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="button button-secondary"
                        disabled={isCurrentUser || pendingActionKey === `user:${adminUser.id}`}
                        onClick={() =>
                          void handleUserUpdate(adminUser, {
                            role: adminUser.role === 'admin' ? 'user' : 'admin',
                          })
                        }
                        type="button"
                      >
                        {adminUser.role === 'admin' ? 'Make user' : 'Make admin'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

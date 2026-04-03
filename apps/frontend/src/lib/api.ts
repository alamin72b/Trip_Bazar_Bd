import type {
  AdminOfferInput,
  AdminReview,
  AdminReviewUpdateInput,
  AdminUploadedImage,
  AdminUser,
  AdminUserUpdateInput,
  AuthTokensResponse,
  Offer,
  Review,
  UserProfile,
} from './types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getApiBaseUrl(): string {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.API_BASE_URL ??
      'http://localhost:3000/api/v1',
  );
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }

    return data.message ?? data.error ?? 'Request failed.';
  } catch {
    return 'Request failed.';
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { noStore?: boolean },
): Promise<T> {
  const { noStore, ...requestInit } = init ?? {};

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestInit,
    headers: {
      ...(requestInit.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(requestInit.headers ?? {}),
    },
    cache: noStore ? 'no-store' : requestInit.cache,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorResponse(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function withAccessToken(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export function getPublicOffers(): Promise<Offer[]> {
  return request<Offer[]>('/offers', {
    next: {
      revalidate: 60,
    },
  });
}

export function getPublicOfferBySlug(slug: string): Promise<Offer> {
  return request<Offer>(`/offers/${slug}`, {
    noStore: true,
  });
}

export function getOfferReviews(offerId: string): Promise<Review[]> {
  return request<Review[]>(`/offers/${offerId}/reviews`, {
    noStore: true,
  });
}

export function authenticateWithEmail(
  email: string,
  password: string,
): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/auth/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refreshAuthTokens(
  refreshToken: string,
): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function getCurrentUserProfile(accessToken: string): Promise<UserProfile> {
  return request<UserProfile>('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    noStore: true,
  });
}

export function createReview(
  offerId: string,
  accessToken: string,
  input: {
    rating: number;
    comment: string;
  },
): Promise<Review> {
  return request<Review>(`/offers/${offerId}/reviews`, {
    method: 'POST',
    headers: {
      ...withAccessToken(accessToken),
    },
    body: JSON.stringify(input),
  });
}

export function getAdminOffers(accessToken: string): Promise<Offer[]> {
  return request<Offer[]>('/admin/offers', {
    headers: withAccessToken(accessToken),
    noStore: true,
  });
}

export function getAdminOfferById(
  offerId: string,
  accessToken: string,
): Promise<Offer> {
  return request<Offer>(`/admin/offers/${offerId}`, {
    headers: withAccessToken(accessToken),
    noStore: true,
  });
}

export function createAdminOffer(
  accessToken: string,
  input: AdminOfferInput,
): Promise<Offer> {
  return request<Offer>('/admin/offers', {
    method: 'POST',
    headers: withAccessToken(accessToken),
    body: JSON.stringify(input),
  });
}

export function updateAdminOffer(
  offerId: string,
  accessToken: string,
  input: Partial<AdminOfferInput>,
): Promise<Offer> {
  return request<Offer>(`/admin/offers/${offerId}`, {
    method: 'PATCH',
    headers: withAccessToken(accessToken),
    body: JSON.stringify(input),
  });
}

export function uploadAdminOfferImages(
  accessToken: string,
  files: File[],
): Promise<AdminUploadedImage[]> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('images', file);
  }

  return request<AdminUploadedImage[]>('/admin/uploads/images', {
    method: 'POST',
    headers: withAccessToken(accessToken),
    body: formData,
  });
}

export function deleteAdminOffer(
  offerId: string,
  accessToken: string,
): Promise<void> {
  return request<void>(`/admin/offers/${offerId}`, {
    method: 'DELETE',
    headers: withAccessToken(accessToken),
  });
}

export function getAdminReviews(accessToken: string): Promise<AdminReview[]> {
  return request<AdminReview[]>('/admin/reviews', {
    headers: withAccessToken(accessToken),
    noStore: true,
  });
}

export function getAdminReviewById(
  reviewId: string,
  accessToken: string,
): Promise<AdminReview> {
  return request<AdminReview>(`/admin/reviews/${reviewId}`, {
    headers: withAccessToken(accessToken),
    noStore: true,
  });
}

export function updateAdminReview(
  reviewId: string,
  accessToken: string,
  input: AdminReviewUpdateInput,
): Promise<AdminReview> {
  return request<AdminReview>(`/admin/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: withAccessToken(accessToken),
    body: JSON.stringify(input),
  });
}

export function deleteAdminReview(
  reviewId: string,
  accessToken: string,
): Promise<void> {
  return request<void>(`/admin/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: withAccessToken(accessToken),
  });
}

export function getAdminUsers(accessToken: string): Promise<AdminUser[]> {
  return request<AdminUser[]>('/admin/users', {
    headers: withAccessToken(accessToken),
    noStore: true,
  });
}

export function getAdminUserById(
  userId: string,
  accessToken: string,
): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${userId}`, {
    headers: withAccessToken(accessToken),
    noStore: true,
  });
}

export function updateAdminUser(
  userId: string,
  accessToken: string,
  input: AdminUserUpdateInput,
): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${userId}`, {
    method: 'PATCH',
    headers: withAccessToken(accessToken),
    body: JSON.stringify(input),
  });
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function buildWhatsAppUrl(phone: string, offerTitle: string): string {
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  const message = encodeURIComponent(
    `Hello TripBazarBD, I want details about "${offerTitle}".`,
  );

  return `https://wa.me/${cleanedPhone.replace(/^\+/, '')}?text=${message}`;
}

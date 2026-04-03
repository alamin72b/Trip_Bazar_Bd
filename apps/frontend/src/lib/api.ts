import type {
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
      'Content-Type': 'application/json',
      ...(requestInit.headers ?? {}),
    },
    cache: noStore ? 'no-store' : requestInit.cache,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorResponse(response), response.status);
  }

  return (await response.json()) as T;
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
      Authorization: `Bearer ${accessToken}`,
    },
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

export function buildWhatsAppUrl(phone: string, offerTitle: string): string {
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  const message = encodeURIComponent(
    `Hello TripBazarBD, I want details about "${offerTitle}".`,
  );

  return `https://wa.me/${cleanedPhone.replace(/^\+/, '')}?text=${message}`;
}

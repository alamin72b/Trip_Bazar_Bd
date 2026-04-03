export type OfferStatus = 'draft' | 'published';

export interface Offer {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  destination: string;
  durationNights: number;
  price: number;
  currency: string;
  status: OfferStatus;
  imageUrls: string[];
  contactWhatsApp: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerDisplayName: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
}

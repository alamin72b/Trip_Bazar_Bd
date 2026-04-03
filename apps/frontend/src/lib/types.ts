export type OfferStatus = 'draft' | 'published';
export type ReviewStatus = 'published' | 'hidden';
export type UserRole = 'admin' | 'user';

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
  role: UserRole;
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

export interface AdminReview {
  id: string;
  offerId: string;
  offerTitle: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOfferInput {
  title: string;
  slug?: string;
  summary: string;
  description: string;
  destination: string;
  durationNights: number;
  price: number;
  currency: string;
  status: OfferStatus;
  imageUrls: string[];
  contactWhatsApp: string;
}

export interface AdminReviewUpdateInput {
  status: ReviewStatus;
}

export interface AdminUserUpdateInput {
  role?: UserRole;
  isActive?: boolean;
}

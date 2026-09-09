export interface HomeFeature {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeFeaturePayload {
  name: string;
  slug: string;
  iconUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  iconFile?: File;
  existingIconUrl?: string | null;
}

export interface UpdateHomeFeaturePayload {
  name?: string;
  slug?: string;
  iconUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  iconFile?: File;
  existingIconUrl?: string | null;
}

export interface HomeFeaturePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HomeFeaturesResponse {
  success: boolean;
  data: HomeFeature[];
  pagination: HomeFeaturePagination;
}

export interface HomeFeatureResponse {
  success: boolean;
  data: HomeFeature;
}
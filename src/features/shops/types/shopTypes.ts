export interface Shop {
  id: string;
  name: string;
  domain: string | null;
  status: string;
}

export interface ShopSearchPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ShopsState {
  searchResults: Shop[];
  searchStatus: "idle" | "loading" | "succeeded" | "failed";
  searchError: string | null;
  searchPagination: ShopSearchPagination | null;
}


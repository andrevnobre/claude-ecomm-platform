export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  category_id?: string;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  sku: string;
  category_id?: string;
  stock_quantity?: number;
  image_url?: string;
  is_active?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  category_id?: string;
  stock_quantity?: number;
  image_url?: string;
  is_active?: boolean;
}

export interface ProductFilter {
  category_id?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
}

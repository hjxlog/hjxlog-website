// ==================== 基础类型 ====================

export interface Work {
  id: number;
  title: string;
  description: string;
  content?: string;
  category: string;
  status: string;
  tags: string[];
  technologies: string[];
  project_url: string;
  github_url: string;
  cover_image: string;
  screenshots?: string[];
  features?: string[];
  challenges?: string[];
  featured: boolean;
  views?: number;
  created_at?: string;
  updated_at?: string;
  date?: string;
}

export interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  cover_image?: string;
  views: number;
  created_at?: string;
  updated_at?: string;
}

export interface Moment {
  id: number;
  content: string;
  images?: string[];
  author_id?: number;
  visibility: 'public' | 'private';
  views?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MomentImage {
  image_url: string;
  alt_text?: string;
  width?: number;
  height?: number;
}

export interface Photo {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  location?: string;
  taken_at?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  created_at?: string;
}

// ==================== 表单数据类型 ====================

export interface WorkFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  status: string;
  tags: string;
  technologies: string;
  project_url: string;
  github_url: string;
  cover_image: string;
  screenshots: string;
  features: string;
  challenges: string;
  featured: boolean;
}

export interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  published: boolean;
  featured: boolean;
  cover_image: string;
}

export interface MomentFormData {
  content: string;
  visibility: 'public' | 'private';
}

export interface PhotoFormData {
  title: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  category: string;
  location: string;
  taken_at: string;
  published: boolean;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedData<T> {
  total: number;
  page: number;
  limit: number;
  [key: string]: T[] | number;
}

export interface BlogsResponse {
  success: boolean;
  data: {
    blogs: Blog[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface WorksResponse {
  success: boolean;
  data: {
    works: Work[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface MomentsResponse {
  success: boolean;
  data: {
    moments: Moment[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface PhotosResponse {
  success: boolean;
  data: {
    photos: Photo[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
  message?: string;
}

// ==================== 通用工具类型 ====================

export type Visibility = 'public' | 'private';
export type WorkStatus = 'active' | 'completed' | 'archived';
export type BlogStatus = 'draft' | 'published';

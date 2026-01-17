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

export interface MomentImage {
  image_url: string;
  alt_text?: string;
  width?: number;
  height?: number;
}

export interface Moment {
  id: number;
  content: string;
  visibility: 'public' | 'private';
  images: MomentImage[];
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

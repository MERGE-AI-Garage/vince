// ABOUTME: TypeScript types for media library system including files, folders, tags, and collections
// ABOUTME: Defines interfaces for media management, metadata, and activity tracking

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  description: string | null;
  color: string;
  icon: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  title: string | null;
  description: string | null;
  url: string;
  storage_path: string;
  thumbnail_url: string | null;
  mime_type: string;
  file_type: FileType;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  color_palette: string[];
  exif_data: Record<string, any>;
  custom_metadata: Record<string, any>;
  folder_id: string | null;
  auto_tags: string[];
  detected_objects: string[];
  dominant_colors: string[];
  original_image_data: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  view_count: number;
  download_count: number;
  ai_analysis_cost: number | null;
  ai_analysis_model: string | null;
  synthid_detected: boolean | null;
  synthid_confidence: number | null;
  synthid_generated_by: string | null;
  synthid_details: string | null;
  creator_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface MediaTag {
  id: string;
  name: string;
  slug: string;
  category: string;
  color: string;
  icon: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaTagAssignment {
  media_id: string;
  tag_id: string;
  created_at: string;
}

export interface MediaCollection {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  filters: MediaFilters;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MediaActivity {
  id: string;
  media_id: string;
  user_id: string | null;
  action: 'upload' | 'edit' | 'move' | 'delete' | 'restore' | 'tag' | 'untag' | 'share' | 'download' | 'view';
  details: Record<string, any>;
  created_at: string;
}

export interface MediaShare {
  id: string;
  media_id: string;
  share_token: string;
  password_hash: string | null;
  expires_at: string | null;
  permissions: {
    view: boolean;
    download: boolean;
  };
  created_by: string | null;
  created_at: string;
  access_count: number;
  last_accessed_at: string | null;
}

export interface MediaFilters {
  search?: string;
  fileTypes?: FileType[];
  tags?: string[];
  folder_id?: string | null;
  dateFrom?: string;
  dateTo?: string;
  sizeMin?: number;
  sizeMax?: number;
  sortBy?: 'created_at' | 'updated_at' | 'filename' | 'size_bytes';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<FileType, number>;
  sizeByType: Record<FileType, number>;
  recentUploads: number;
  largestFiles: MediaFile[];
}

export type ViewMode = 'grid' | 'list' | 'timeline';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  mediaId?: string;
}

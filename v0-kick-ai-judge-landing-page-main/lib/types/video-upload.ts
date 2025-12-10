// TypeScript interfaces for video upload functionality

export type UploadState = 'idle' | 'uploading' | 'completed' | 'error';

export interface VideoUploadData {
  file: File | null;
  videoUrl: string | null;
  uploadState: UploadState;
  progress: number;
  error: UploadError | null;
}

export interface UploadError {
  code: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'NETWORK_ERROR' | 'FILE_CORRUPTED';
  message: string;
  details?: string;
}

export interface ValidationError {
  type: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'FILE_CORRUPTED';
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  fileName: string;
}

export interface KickboxingCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface VideoUploadZoneProps {
  onVideoUploaded: (file: File, videoUrl: string) => void;
  onError: (error: UploadError) => void;
  maxFileSize: number; // в байтах
  acceptedFormats: string[];
}

export interface DragDropHandlerProps {
  onFileDrop: (file: File) => void;
  onDragOver: (isDragging: boolean) => void;
  disabled?: boolean;
}

export interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  controls?: boolean;
}

export interface UploadProgressProps {
  progress: number; // 0-100
  isUploading: boolean;
  fileName?: string;
}
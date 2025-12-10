import { FileValidationResult, ValidationError } from '../types/video-upload';

export class FileValidator {
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes
  private static readonly ACCEPTED_FORMATS = ['video/mp4'];

  static validateFile(file: File): FileValidationResult {
    // Check file format
    if (!this.ACCEPTED_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        error: {
          type: 'INVALID_FORMAT',
          message: 'Підтримуються тільки MP4 файли'
        }
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: {
          type: 'FILE_TOO_LARGE',
          message: 'Розмір файлу не повинен перевищувати 2GB'
        }
      };
    }

    return { isValid: true };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }
}
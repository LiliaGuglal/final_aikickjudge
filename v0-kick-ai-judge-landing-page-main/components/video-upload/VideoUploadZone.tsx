"use client"

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileVideo, Check, AlertCircle } from 'lucide-react';
import { VideoUploadZoneProps, UploadState, UploadError } from '@/lib/types/video-upload';
import { FileValidator } from '@/lib/utils/file-validator';

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  onVideoUploaded,
  onError,
  maxFileSize = 2 * 1024 * 1024 * 1024, // 2GB
  acceptedFormats = ['video/mp4']
}) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = useCallback((file: File) => {
    const validation = FileValidator.validateFile(file);
    
    if (!validation.isValid && validation.error) {
      const uploadError: UploadError = {
        code: validation.error.type,
        message: validation.error.message
      };
      setError(uploadError);
      setUploadState('error');
      onError(uploadError);
      return false;
    }
    
    setError(null);
    return true;
  }, [onError]);

  const processFile = useCallback((file: File) => {
    if (!handleFileValidation(file)) {
      return;
    }

    setUploadedFile(file);
    setUploadState('uploading');
    setProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setUploadState('completed');
          
          // Create object URL for video preview
          const videoUrl = URL.createObjectURL(file);
          onVideoUploaded(file, videoUrl);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, [handleFileValidation, onVideoUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleReset = useCallback(() => {
    setUploadState('idle');
    setProgress(0);
    setError(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const renderUploadArea = () => {
    if (uploadState === 'completed' && uploadedFile) {
      return (
        <div className="text-center">
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 mb-4">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-400 font-semibold mb-2">Відео успішно завантажено</p>
            <p className="text-sm text-zinc-400">{uploadedFile.name}</p>
            <p className="text-xs text-zinc-500">{FileValidator.formatFileSize(uploadedFile.size)}</p>
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-900 bg-transparent"
          >
            Завантажити інше відео
          </Button>
        </div>
      );
    }

    if (uploadState === 'uploading') {
      return (
        <div className="text-center">
          <FileVideo className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-zinc-400 mb-4">Завантаження відео...</p>
          <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-zinc-500">{progress}%</p>
          {uploadedFile && (
            <p className="text-xs text-zinc-600 mt-2">{uploadedFile.name}</p>
          )}
        </div>
      );
    }

    if (uploadState === 'error' && error) {
      return (
        <div className="text-center">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 font-semibold mb-2">Помилка завантаження</p>
            <p className="text-sm text-zinc-400">{error.message}</p>
          </div>
          <Button
            onClick={handleReset}
            className="bg-white text-black hover:bg-zinc-200"
          >
            Спробувати ще раз
          </Button>
        </div>
      );
    }

    return (
      <div>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <Upload className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-lg text-zinc-400 mb-2">
            Перетягніть відео сюди або натисніть для вибору
          </p>
          <div className="space-y-1 text-sm text-zinc-500">
            <p className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Підтримувані формати: MP4
            </p>
            <p className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Максимальний розмір: 2GB
            </p>
            <p className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Рекомендована якість: HD 1080p
            </p>
          </div>
        </div>

        <Button
          onClick={handleFileSelect}
          size="lg"
          className="w-full mt-6 bg-white text-black hover:bg-zinc-200"
        >
          <FileVideo className="w-5 h-5 mr-2" />
          Вибрати файл
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <Card className="bg-zinc-950 border-zinc-900 p-8">
      <h2 className="text-2xl font-bold mb-6">Завантажте відео поєдинку</h2>
      {renderUploadArea()}
    </Card>
  );
};
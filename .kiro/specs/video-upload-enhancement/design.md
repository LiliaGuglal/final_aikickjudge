# Design Document

## Overview

Система покращення завантаження відео для KickAI Judge розширює існуючу функціональність демо-сторінки, додаючи повноцінну підтримку завантаження MP4 файлів через drag-and-drop інтерфейс та файловий браузер. Система включає валідацію файлів, індикатор прогресу, відео плеєр з контролами та обробку помилок.

## Architecture

Система побудована на основі React компонентів з використанням TypeScript та сучасних веб-API:

```
┌─────────────────────────────────────┐
│           Demo Page                 │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │     VideoUploadZone             ││
│  │  ┌─────────────────────────────┐││
│  │  │    DragDropHandler          │││
│  │  └─────────────────────────────┘││
│  │  ┌─────────────────────────────┐││
│  │  │    FileValidator            │││
│  │  └─────────────────────────────┘││
│  │  ┌─────────────────────────────┐││
│  │  │    UploadProgress           │││
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │     VideoPlayer                 ││
│  │  ┌─────────────────────────────┐││
│  │  │    VideoControls            │││
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │     ErrorHandler                ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Components and Interfaces

### VideoUploadZone Component
Головний компонент для завантаження відео:
```typescript
interface VideoUploadZoneProps {
  onVideoUploaded: (file: File, videoUrl: string) => void;
  onError: (error: UploadError) => void;
  maxFileSize: number; // в байтах
  acceptedFormats: string[];
}
```

### DragDropHandler
Обробляє drag-and-drop функціональність:
```typescript
interface DragDropHandlerProps {
  onFileDrop: (file: File) => void;
  onDragOver: (isDragging: boolean) => void;
  disabled?: boolean;
}
```

### FileValidator
Валідує завантажені файли:
```typescript
interface FileValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

interface ValidationError {
  type: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'FILE_CORRUPTED';
  message: string;
}
```

### VideoPlayer Component
Відтворює завантажене відео:
```typescript
interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  controls?: boolean;
}
```

### UploadProgress Component
Показує прогрес завантаження:
```typescript
interface UploadProgressProps {
  progress: number; // 0-100
  isUploading: boolean;
  fileName?: string;
}
```

## Data Models

### UploadState
```typescript
type UploadState = 'idle' | 'uploading' | 'completed' | 'error';

interface VideoUploadData {
  file: File | null;
  videoUrl: string | null;
  uploadState: UploadState;
  progress: number;
  error: UploadError | null;
}
```

### UploadError
```typescript
interface UploadError {
  code: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'NETWORK_ERROR' | 'FILE_CORRUPTED';
  message: string;
  details?: string;
}
```

### VideoMetadata
```typescript
interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  fileName: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Valid file acceptance**
*For any* valid MP4 file under 2GB, when uploaded via drag-and-drop or file dialog, the system should accept the file and begin the upload process
**Validates: Requirements 1.1, 2.2**

**Property 2: Invalid file rejection**
*For any* file that is not MP4 format or exceeds 2GB, when uploaded via any method, the system should reject the file and display an appropriate error message
**Validates: Requirements 1.2, 1.4, 2.3**

**Property 3: Upload progress indication**
*For any* file being uploaded, the system should display a progress indicator that updates in real-time and shows percentage completion
**Validates: Requirements 1.5, 4.1, 4.2**

**Property 4: Upload completion workflow**
*For any* successfully uploaded video file, the system should hide the progress indicator and display a video player with preview frame
**Validates: Requirements 1.3, 3.1, 4.3**

**Property 5: Video player controls**
*For any* loaded video, the play/pause controls should correctly start and stop video playback
**Validates: Requirements 3.2, 3.3**

**Property 6: Video time display**
*For any* playing video, the system should continuously display current time and total duration
**Validates: Requirements 3.4**

**Property 7: Video seeking**
*For any* position on the time slider, moving the slider should seek the video to that exact position
**Validates: Requirements 3.5**

**Property 8: Error handling**
*For any* upload error, the system should display an error message and allow retry functionality
**Validates: Requirements 4.4**

**Property 9: Video replacement workflow**
*For any* uploaded video, the system should show a replacement button, and clicking it should clear the current video and return to upload state
**Validates: Requirements 6.1, 6.2**

**Property 10: Video substitution**
*For any* new video uploaded when one already exists, the system should replace the previous video with the new one
**Validates: Requirements 6.3**

## Error Handling

### File Validation Errors
- **Invalid Format**: Відображення повідомлення "Підтримуються тільки MP4 файли"
- **File Too Large**: Відображення повідомлення "Розмір файлу не повинен перевищувати 2GB"
- **Corrupted File**: Відображення повідомлення "Файл пошкоджений або не може бути відтворений"

### Network Errors
- **Upload Failure**: Відображення повідомлення "Помилка завантаження. Спробуйте ще раз"
- **Connection Lost**: Автоматична спроба повторного завантаження
- **Server Error**: Відображення повідомлення про серверну помилку

### User Experience Errors
- **Browser Compatibility**: Перевірка підтримки File API та відео елементів
- **Memory Limitations**: Обробка великих файлів без блокування UI

## Testing Strategy

### Unit Testing
Використання Jest та React Testing Library для тестування:
- Компонентів завантаження файлів
- Валідації файлів
- Обробки помилок
- UI взаємодій

### Property-Based Testing
Використання fast-check для TypeScript/JavaScript:
- Генерація різних типів файлів для тестування валідації
- Тестування різних розмірів файлів
- Перевірка поведінки з різними форматами відео
- Тестування edge cases для відео плеєра

**Property-based testing requirements:**
- Мінімум 100 ітерацій для кожного property-based тесту
- Кожен тест повинен бути позначений коментарем з посиланням на відповідну властивість
- Формат тегу: '**Feature: video-upload-enhancement, Property {number}: {property_text}**'
- Кожна correctness property повинна бути реалізована окремим property-based тестом

### Integration Testing
- Тестування повного циклу завантаження та відтворення відео
- Перевірка взаємодії між компонентами
- Тестування різних браузерів та пристроїв

### Performance Testing
- Тестування завантаження великих файлів
- Перевірка використання пам'яті
- Тестування швидкості обробки файлів
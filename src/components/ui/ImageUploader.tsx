'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon, AlertCircle, GripVertical } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  disabled?: boolean;
}

interface AuthParams {
  signature: string;
  expire: number;
  token: string;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  folder = 'products',
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

  // Get authentication parameters from server
  const getAuthParams = useCallback(async (): Promise<AuthParams> => {
    const res = await fetch('/api/imagekit/auth');
    if (!res.ok) throw new Error('Failed to get auth');
    return res.json();
  }, []);

  // Upload a single file
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const authParams = await getAuthParams();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('publicKey', publicKey!);
      formData.append('signature', authParams.signature);
      formData.append('expire', authParams.expire.toString());
      formData.append('token', authParams.token);
      formData.append('fileName', file.name);
      formData.append('folder', `/${folder}`);

      const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await res.json();
      return data.url;
    },
    [folder, publicKey, getAuthParams]
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      setError(null);
      const remainingSlots = maxImages - images.length;

      if (remainingSlots <= 0) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      // Validate files
      const validFiles: File[] = [];
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Images must be under 5MB');
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      setUploading(true);
      setUploadProgress(0);

      try {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < validFiles.length; i++) {
          const url = await uploadFile(validFiles[i]);
          uploadedUrls.push(url);
          setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
        }

        onChange([...images, ...uploadedUrls]);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [images, onChange, maxImages, disabled, uploadFile]
  );

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  // Reorder images (drag to reorder)
  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get optimized thumbnail URL
  const getThumbnailUrl = (url: string) => {
    if (url.includes('imagekit.io')) {
      return `${url}?tr=w-200,h-200,fo-auto`;
    }
    return url;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />

        <div className="text-center">
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <div className="w-full max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Drag & drop images here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WebP up to 5MB each • Max {maxImages} images
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {images.length}/{maxImages} images uploaded
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((url, index) => (
            <div
              key={url}
              className={`relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all ${
                draggedIndex === index ? 'border-blue-500 opacity-50' : 'border-transparent'
              }`}
              draggable
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
            >
              {/* Image */}
              <img
                src={getThumbnailUrl(url)}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = url;
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 p-1 bg-white/90 rounded cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-gray-600" />
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Image Badge */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-4 text-gray-500">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No images uploaded yet</p>
          <p className="text-xs">The first image will be used as the main product image</p>
        </div>
      )}
    </div>
  );
}

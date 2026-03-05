// ABOUTME: Reusable image upload component with drag-drop support.
// ABOUTME: Uploads to the media bucket and auto-registers in the media library.

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { registerMediaLibraryImage } from '@/utils/registerMediaLibraryImage';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  currentImageUrl?: string;
  bucketName?: string;
  folder?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  mediaFolderPath?: string;
  mediaTitle?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onImageRemoved,
  currentImageUrl,
  bucketName = 'media',
  folder = 'uploads',
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  mediaFolderPath,
  mediaTitle,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not supported`);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setUploadProgress(100);
      onImageUploaded(urlData.publicUrl);

      registerMediaLibraryImage({
        url: urlData.publicUrl,
        storagePath: filePath,
        filename: fileName,
        mimeType: file.type || 'image/png',
        fileSize: file.size,
        folderPath: mediaFolderPath,
        title: mediaTitle || file.name,
      });
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    try {
      await uploadImage(files[0]);
    } catch (error) {
      console.error('Error uploading dropped file:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  if (currentImageUrl) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="relative group">
          <img
            src={currentImageUrl}
            alt="Uploaded"
            className="max-w-full max-h-32 object-contain rounded-lg mx-auto"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={onImageRemoved}
              className="mr-2"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace
            </Button>
          </div>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleUploadClick}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin mx-auto h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop an image here, or click to select
            </p>
            <Badge variant="secondary" className="mb-2">
              Max {maxSizeMB}MB
            </Badge>
            <p className="text-xs text-muted-foreground">
              Supports: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
            </p>
          </>
        )}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </Card>
  );
};

export default ImageUpload;

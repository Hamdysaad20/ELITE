"use client";

import { useState, useRef } from "react";
import { Camera, X, Upload, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface AvatarUploadProps {
  onClose: () => void;
  currentImage?: string | null;
}

export default function AvatarUpload({ onClose, currentImage }: AvatarUploadProps) {
  const { update } = useSession();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload JPEG, PNG, or WebP.");
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      // Update session with new image
      await update({ image: data.imageUrl });

      // Close modal and refresh
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove avatar");
      }

      // Update session
      await update({ image: null });

      // Close modal and refresh
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy px-6 py-4 flex items-center justify-between">
          <h2 className="font-calistoga text-xl text-elite-cream">Change Profile Picture</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-elite-cream" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-elite-burgundy/10 flex items-center justify-center ring-4 ring-elite-burgundy/20">
              {preview ? (
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : currentImage ? (
                <Image
                  src={currentImage}
                  alt="Current avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <Camera className="w-12 h-12 text-elite-burgundy/40" />
              )}
            </div>
            {currentImage && !preview && (
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="mt-3 text-red-600 font-cabin text-sm font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove Photo
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="font-cabin text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 transition-all ${
              dragActive
                ? "border-elite-burgundy bg-elite-burgundy/5"
                : "border-elite-burgundy/30 hover:border-elite-burgundy/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleChange}
              className="hidden"
            />

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-elite-burgundy/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-elite-burgundy" />
              </div>
              <p className="font-cabin font-semibold text-elite-black mb-2">
                {selectedFile ? selectedFile.name : "Drop your photo here"}
              </p>
              <p className="font-cabin text-sm text-elite-black/60 mb-4">
                or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-elite-cream hover:bg-elite-burgundy/10 text-elite-burgundy px-6 py-2.5 rounded-xl font-cabin font-semibold transition-colors"
              >
                Choose File
              </button>
              <p className="font-cabin text-xs text-elite-black/40 mt-4">
                JPEG, PNG, or WebP • Max 5MB
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-cabin font-semibold text-elite-black/60 hover:bg-elite-cream/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 bg-gradient-to-r from-elite-burgundy to-elite-dark-burgundy text-elite-cream px-6 py-3 rounded-xl font-cabin font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Photo"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

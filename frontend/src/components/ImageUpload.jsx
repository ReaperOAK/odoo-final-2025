import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import toast from "react-hot-toast";

const ImageUpload = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  className = "",
  disabled = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      rejectedFiles.forEach((file) => {
        file.errors.forEach((err) => {
          if (err.code === "file-too-large") {
            toast.error(
              `File ${file.file.name} is too large. Max size is ${
                maxFileSize / 1024 / 1024
              }MB`
            );
          } else if (err.code === "file-invalid-type") {
            toast.error(
              `File ${file.file.name} has invalid format. Only JPG, PNG, and WebP are allowed`
            );
          }
        });
      });

      // Process accepted files
      if (acceptedFiles.length > 0) {
        const currentImageCount = images.length;
        const availableSlots = maxImages - currentImageCount;

        if (acceptedFiles.length > availableSlots) {
          toast.error(
            `You can only upload ${availableSlots} more image(s). Maximum ${maxImages} images allowed.`
          );
          acceptedFiles = acceptedFiles.slice(0, availableSlots);
        }

        // Create preview URLs for new images
        const newImages = acceptedFiles.map((file) => ({
          id: Date.now() + Math.random(),
          file,
          preview: URL.createObjectURL(file),
          isNew: true,
        }));

        const updatedImages = [...images, ...newImages];
        onImagesChange(updatedImages);

        toast.success(`${newImages.length} image(s) added successfully`);
      }
    },
    [images, maxImages, maxFileSize, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = [];
      return acc;
    }, {}),
    maxSize: maxFileSize,
    disabled,
    multiple: true,
  });

  const removeImage = (index) => {
    const imageToRemove = images[index];

    // Revoke URL for new images to prevent memory leaks
    if (imageToRemove.isNew && imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
    toast.success("Image removed");
  };

  const moveImage = (fromIndex, toIndex) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== toIndex) {
      moveImage(draggedIndex, toIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getImageSrc = (image) => {
    if (image.isNew && image.preview) {
      return image.preview;
    }
    return image.url || image.src || image.preview;
  };

  const openPreview = (image) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200",
          isDragActive
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed",
          images.length >= maxImages && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} ref={fileInputRef} />

        <div className="space-y-2">
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p className="text-primary-600 font-medium">
                Drop images here...
              </p>
            ) : images.length >= maxImages ? (
              <p className="text-gray-500">
                Maximum {maxImages} images reached
              </p>
            ) : (
              <>
                <p>
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Click to upload
                  </button>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP up to {maxFileSize / 1024 / 1024}MB each
                </p>
                <p className="text-xs text-gray-500">
                  {images.length} of {maxImages} images uploaded
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={clsx(
                "relative group bg-white rounded-lg border-2 transition-all duration-200 cursor-move",
                dragOverIndex === index
                  ? "border-primary-500 scale-105"
                  : "border-gray-200",
                draggedIndex === index && "opacity-50",
                disabled && "cursor-default"
              )}
            >
              <div className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={getImageSrc(image)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                />
              </div>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Primary
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => openPreview(image)}
                    className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    title="Preview"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200"
                      title="Remove"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Loading indicator for new uploads */}
              {image.isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-sm">Uploading...</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={getImageSrc(previewImage)}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <button
              onClick={closePreview}
              className="absolute top-4 left-4 p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowsPointingOutIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {images.length > 0 && (
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Drag and drop to reorder images</p>
          <p>• The first image will be used as the primary image</p>
          <p>• Click the eye icon to preview in full size</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

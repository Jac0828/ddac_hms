import React, { useState, useRef } from 'react';
import { uploadApi } from '../../services/api';
import { FaCloudUploadAlt, FaTrash, FaImage, FaSpinner } from 'react-icons/fa';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onDelete?: (url: string) => void;
  existingImages?: string[];
  maxImages?: number;
  title?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onDelete,
  existingImages = [],
  maxImages = 5,
  title = "Upload Images"
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure existingImages is always an array
  const validImages = Array.isArray(existingImages) ? existingImages : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadApi.uploadImage(file);
      onUploadComplete(response.url);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (onDelete) {
        // If parent handles delete (e.g. just removing from list), let it do it
        // But we might also want to delete from server? 
        // Usually better to keep server file until explicitly cleaned up or rely on separate cleanup process
        // For now, we'll just call parent callback
        onDelete(url);
    }
  };

  return (
    <div className="image-upload-container">
      <label className="form-label fw-bold text-uppercase small text-muted">{title}</label>
      
      {/* Existing Images Grid */}
      {validImages.length > 0 && (
        <div className="d-flex flex-wrap gap-3 mb-3">
          {validImages.map((url, index) => (
            <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
              <img 
                src={url} 
                alt={`Uploaded ${index}`} 
                className="w-100 h-100 object-fit-cover rounded border"
                style={{ cursor: 'pointer' }}
                onClick={() => window.open(url, '_blank')}
              />
              {onDelete && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center"
                  style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '10px' }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(url); }}
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {validImages.length < maxImages ? (
        <div 
          className={`p-4 text-center position-relative d-flex flex-column align-items-center justify-content-center`}
          style={{ 
            border: '2px dashed #C9A961', 
            borderRadius: '12px', 
            cursor: uploading ? 'not-allowed' : 'pointer', 
            minHeight: '180px', 
            backgroundColor: '#fffcf5', // Warm tint to ensure visibility
            transition: 'all 0.2s' 
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f4e9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fffcf5'}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          <div className="d-flex flex-column align-items-center text-muted">
            {uploading ? (
              <>
                <FaSpinner className="fa-spin mb-2 fs-4 text-warning" />
                <small>Uploading...</small>
              </>
            ) : (
              <>
                <FaCloudUploadAlt className="mb-3" style={{ color: '#C9A961', fontSize: '2.5rem' }} />
                <button type="button" className="btn btn-primary btn-sm mb-2 px-4" style={{ background: '#C9A961', borderColor: '#C9A961', borderRadius: '20px', fontWeight: 500 }}>
                  Browse Files
                </button>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Max 5MB (JPG, PNG)</small>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning text-center p-3 small border-warning" style={{ backgroundColor: '#fff3cd', color: '#856404' }}>
          <FaImage className="me-2" />
          Maximum of {maxImages} images reached. Please delete an existing image to upload a new one.
        </div>
      )}
      
      {error && <div className="text-danger small mt-2">{error}</div>}
    </div>
  );
};

export default ImageUpload;


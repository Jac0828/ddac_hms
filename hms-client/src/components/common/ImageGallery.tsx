import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaExpand } from 'react-icons/fa';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
  height?: string;
  showThumbnails?: boolean;
  className?: string;
  allowFullscreen?: boolean;
  autoPlay?: boolean;
  interval?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  height = '300px',
  showThumbnails = true,
  className = '',
  allowFullscreen = true,
  autoPlay = false,
  interval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter out empty or invalid images
  const validImages = images.filter(img => img && img.trim() !== '');
  const hasImages = validImages.length > 0;

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || !hasImages || validImages.length <= 1 || isFullscreen) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, hasImages, validImages.length, interval, isFullscreen]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allowFullscreen && hasImages) {
      setIsFullscreen(!isFullscreen);
    }
  };

  if (!hasImages) {
    return (
      <div className={`image-gallery-placeholder ${className}`} style={{ height }}>
        <div className="placeholder-content">
          <span className="placeholder-icon">🏨</span>
          <span className="placeholder-text">No images available</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery Container */}
      <div className={`image-gallery-container ${className}`} style={{ height }}>
        <div className="image-gallery-wrapper">
          <AnimatePresence initial={false} mode='wait'>
            <motion.img
              key={currentIndex}
              src={validImages[currentIndex]}
              alt={`Room view ${currentIndex + 1}`}
              className="image-gallery-img"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <button className="gallery-nav-btn prev" onClick={handlePrev}>
                <FaChevronLeft />
              </button>
              <button className="gallery-nav-btn next" onClick={handleNext}>
                <FaChevronRight />
              </button>
            </>
          )}

          {/* Fullscreen Button */}
          {allowFullscreen && (
            <button className="gallery-expand-btn" onClick={toggleFullscreen}>
              <FaExpand />
            </button>
          )}

          {/* Image Counter Badge */}
          {validImages.length > 1 && (
            <div className="gallery-counter">
              {currentIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && validImages.length > 1 && (
          <div className="gallery-thumbnails">
            {validImages.map((img, idx) => (
              <button
                key={idx}
                className={`thumbnail-btn ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="gallery-fullscreen-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullscreen(false)}
          >
            <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
              <img 
                src={validImages[currentIndex]} 
                alt={`Full view ${currentIndex + 1}`} 
                className="fullscreen-img"
              />
              
              {validImages.length > 1 && (
                <>
                  <button className="fullscreen-nav prev" onClick={handlePrev}>
                    <FaChevronLeft />
                  </button>
                  <button className="fullscreen-nav next" onClick={handleNext}>
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              <button className="fullscreen-close" onClick={() => setIsFullscreen(false)}>
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;


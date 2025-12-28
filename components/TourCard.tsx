
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tour } from '../types';
import { convertFromUSD } from '../utils/currency';

interface TourCardProps {
  tour: Tour;
  currency: string;
}

const TourCard: React.FC<TourCardProps> = ({ tour, currency }) => {
  const displayPrice = tour.displayPrice ?? convertFromUSD(tour.basePriceUSD, currency);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = tour.images[0];
    const handleLoad = () => {
      // Add a small delay to prevent flickering if image loads instantly from cache
      setTimeout(() => {
        setIsImageLoaded(true);
      }, 300);
    };
    img.addEventListener('load', handleLoad);

    // If the image is already cached by the browser, the load event might not fire
    if (img.complete) {
      handleLoad();
    }

    return () => {
      img.removeEventListener('load', handleLoad);
    };
  }, [tour.images]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % tour.images.length);
  }, [tour.images.length]);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + tour.images.length) % tour.images.length);
  }, [tour.images.length]);

  if (!isImageLoaded) {
    return (
      <div 
        className="rounded-xl overflow-hidden flex flex-col border animate-pulse"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="h-48" style={{ backgroundColor: 'var(--border-color)' }}></div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="h-6 rounded w-3/4" style={{ backgroundColor: 'var(--border-color)' }}></div>
          <div className="mt-2 flex-grow space-y-2">
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-color)' }}></div>
          </div>
          <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)'}}>
            <div className="h-7 rounded w-1/3" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <div className="h-10 rounded-md w-1/3" style={{ backgroundColor: 'var(--border-color)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group rounded-xl overflow-hidden shadow-lg flex flex-col transform border transition-all duration-300 hover:-translate-y-1 hover:scale-103 hover:shadow-[0_8px_30px_-5px_var(--shadow-color-primary)] hover:border-[var(--accent-primary)]"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="relative h-48 overflow-hidden">
        {tour.images.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500 ease-in-out"
            style={{
              backgroundImage: `url(${image})`,
              opacity: index === currentImageIndex ? 1 : 0,
            }}
            aria-hidden={index !== currentImageIndex}
          />
        ))}

        <button
          onClick={handlePrevImage}
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10"
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={handleNextImage}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10"
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {tour.images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-xl" style={{ color: 'var(--text-primary)'}}>{tour.title}</h3>
        <p className="text-sm mt-2 line-clamp-3 flex-grow" style={{ color: 'var(--text-secondary)'}}>{tour.description}</p>
        <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)'}}>
          <span className="font-bold text-lg" style={{ color: 'var(--accent-secondary)'}}>{currency} {displayPrice.toLocaleString()}</span>
          <Link 
            className="px-4 py-2 rounded-md text-white text-sm font-semibold transition-colors transform hover:scale-105 shadow-md" 
            to={`/tours/${tour.slug}`}
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 4px 6px -1px var(--shadow-color-primary), 0 2px 4px -1px var(--shadow-color-primary)'
            }}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TourCard;

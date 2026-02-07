
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tour } from '@/types';
import { convertFromUSD } from '@/utils/currency';
import { GoogleGenAI } from "@google/genai";

interface TourCardProps {
  tour: Tour;
  currency: string;
}

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const TourCard: React.FC<TourCardProps> = ({ tour, currency }) => {
  const displayPrice = tour.displayPrice ?? convertFromUSD(tour.basePriceUSD, currency);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = tour.images[0];
    const handleLoad = () => {
      setTimeout(() => {
        setIsImageLoaded(true);
      }, 300);
    };
    img.addEventListener('load', handleLoad);

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
    if (aiImageUrl) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % tour.images.length);
  }, [tour.images.length, aiImageUrl]);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (aiImageUrl) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + tour.images.length) % tour.images.length);
  }, [tour.images.length, aiImageUrl]);

  const handleAIMagic = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGeneratingAI(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `A breathtaking, cinematic, 8k professional travel photograph of ${tour.title} in ${tour.city}, ${tour.country}. High resolution, beautiful lighting, award winning composition.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "16:9" } }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                setAiImageUrl(`data:image/png;base64,${part.inlineData.data}`);
                break;
            }
        }
    } catch (err) {
        console.error("AI Image Generation failed:", err);
    } finally {
        setIsGeneratingAI(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/#/tours/${tour.slug}`;
    const shareData = {
      title: `Vanhsya: ${tour.title}`,
      text: `Check out this incredible adventure in ${tour.city}: ${tour.title}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.debug('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

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
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group rounded-2xl overflow-hidden shadow-lg flex flex-col transform border transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:border-[var(--accent-primary)]/50"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="relative h-56 overflow-hidden">
        {/* AI IMAGE OVERLAY */}
        {aiImageUrl && (
            <div className="absolute inset-0 z-20 animate-fadeIn">
                <img src={aiImageUrl} alt="AI Re-imagined" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-cyan-400 font-black border border-cyan-500/30 uppercase tracking-widest">AI Generated</div>
            </div>
        )}

        {!aiImageUrl && tour.images.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700 ease-in-out transform group-hover:scale-110"
            style={{
              backgroundImage: `url(${image})`,
              opacity: index === currentImageIndex ? 1 : 0,
            }}
            aria-hidden={index !== currentImageIndex}
          />
        ))}

        {/* LOADING OVERLAY */}
        {isGeneratingAI && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_var(--accent-primary)]"></div>
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Re-imagining...</p>
            </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {!aiImageUrl && (
            <>
                <button
                onClick={handlePrevImage}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 z-10"
                aria-label="Previous image"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                onClick={handleNextImage}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 z-10"
                aria-label="Next image"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </>
        )}

        {/* AI MAGIC BUTTON */}
        <button 
            onClick={handleAIMagic}
            disabled={isGeneratingAI}
            className={`absolute top-3 right-3 z-30 p-2.5 rounded-xl backdrop-blur-md border border-white/20 text-white transition-all duration-300 hover:scale-110 active:scale-95 group/magic ${aiImageUrl ? 'bg-cyan-500/20 text-cyan-400' : 'bg-black/40 hover:bg-cyan-600/40'}`}
            title="Re-imagine with AI"
        >
            <div className="group-hover/magic:animate-pulse">
                <SparkleIcon />
            </div>
            {isGeneratingAI && <div className="absolute inset-0 bg-white/20 rounded-xl animate-ping"></div>}
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
          {!aiImageUrl && tour.images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)]">{tour.city}, {tour.country}</p>
        </div>
        <h3 className="font-black text-xl font-cinzel leading-tight" style={{ color: 'var(--text-primary)'}}>{tour.title}</h3>
        <p className="text-sm mt-3 line-clamp-2 flex-grow leading-relaxed" style={{ color: 'var(--text-secondary)'}}>{tour.description}</p>
        
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Starting At</span>
              <span className="font-black text-xl text-white font-mono">{currency} {displayPrice.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
                onClick={handleShare}
                className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all relative group/shareBtn"
                title="Share Adventure"
            >
                <ShareIcon />
                {showCopyFeedback && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded shadow-lg animate-bounce">COPIED</div>
                )}
            </button>
            <Link 
                className="px-5 py-2.5 rounded-xl text-black text-xs font-black uppercase tracking-widest transition-all transform hover:scale-105 hover:shadow-[0_0_15px_var(--accent-primary)]" 
                to={`/tours/${tour.slug}`}
                style={{ backgroundColor: 'var(--accent-primary)' }}
            >
                Reserve
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCard;

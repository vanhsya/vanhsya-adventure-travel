
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TOURS_DATA, CURRENCY_RATES_FROM_USD } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import NotFoundPage from './NotFoundPage';
import InteractiveMap from '../components/InteractiveMap';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  ItineraryItem,
  MapMarkerData,
  Booking,
  PaymentTransactionRecord,
  TravelBookingRecord,
} from '../types';
import AnimateOnScroll from '../components/AnimateOnScroll';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { BRAND_CONTACTS, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';


declare global {
  interface Window {
    marked: any;
  }
}

const CheckIcon = () => <svg className="w-5 h-5 text-green-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const CrossIcon = () => <svg className="w-5 h-5 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const VRIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a8 8 0 0116 0v2a8 8 0 01-16 0v-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 11V9a2 2 0 012-2h10a2 2 0 012 2v2" />
    </svg>
);
const PackingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
);
const WeatherIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
const BulbIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;


const ItineraryAccordion: React.FC<{ items: ItineraryItem[] }> = ({ items }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button
                        onClick={() => handleToggle(index)}
                        className="w-full flex justify-between items-center p-4 text-left font-semibold"
                        style={{ color: 'var(--text-primary)'}}
                    >
                        <span>Day {item.day}: {item.title}</span>
                        <svg
                            className={`w-5 h-5 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}
                    >
                        <div className="p-4 pt-0 text-sm" style={{ color: 'var(--text-secondary)'}}>
                            {item.description}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


const WeatherDisplay: React.FC<{ weatherMarkdown: string; city: string }> = ({ weatherMarkdown, city }) => {
  const { theme } = useAppContext();
  const [htmlContent, setHtmlContent] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');

  useEffect(() => {
    if (weatherMarkdown && window.marked) {
      setHtmlContent(window.marked.parse(weatherMarkdown));
    }
  }, [weatherMarkdown]);

  const handleShare = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (navigator.share) {
      navigator.share({
        title: `Weather Forecast for ${city}`,
        text: `Here's the weather for ${city}:\n\n${textContent}`,
      }).catch(console.error);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`Here's the weather for ${city}:\n\n${textContent}`)
        .then(() => {
          setShareFeedback('Forecast copied to clipboard!');
          setTimeout(() => setShareFeedback(''), 3000);
        })
        .catch(() => {
          setShareFeedback('Could not copy forecast automatically.');
          setTimeout(() => setShareFeedback(''), 3000);
        });
    } else {
      setShareFeedback('Share API not available in this browser.');
      setTimeout(() => setShareFeedback(''), 3000);
    }
  };

  if (!htmlContent) return null;

  return (
    <>
      <div 
        className={`prose max-w-none prose-table:w-full prose-td:px-2 prose-td:py-1 prose-th:px-2 prose-th:py-1 ${theme === 'dark' ? 'prose-invert' : ''}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
      <div className="mt-4 space-y-2">
        <button 
          onClick={handleShare}
          className="w-full px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
        >
          Share Forecast
        </button>
        {shareFeedback && (
          <p className="text-xs text-center text-emerald-400 font-medium">{shareFeedback}</p>
        )}
      </div>
    </>
  );
};

const FunFactsDisplay: React.FC<{ funFactsMarkdown: string }> = ({ funFactsMarkdown }) => {
  const { theme } = useAppContext();
  const [htmlContent, setHtmlContent] = useState('');
  useEffect(() => {
    if (funFactsMarkdown && window.marked) {
      setHtmlContent(window.marked.parse(funFactsMarkdown));
    }
  }, [funFactsMarkdown]);

  if (!htmlContent) return null;

  return (
    <div 
      className={`prose max-w-none prose-ul:list-disc prose-ul:pl-5 space-y-2 ${theme === 'dark' ? 'prose-invert' : ''}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
};

const PackingListDisplay: React.FC<{ packingListMarkdown: string }> = ({ packingListMarkdown }) => {
    const { theme } = useAppContext();
    const [htmlContent, setHtmlContent] = useState('');
    useEffect(() => {
        if (packingListMarkdown && window.marked) {
            setHtmlContent(window.marked.parse(packingListMarkdown));
        }
    }, [packingListMarkdown]);

    if (!htmlContent) return null;

    return (
        <div
            className={`prose max-w-none prose-ul:list-disc prose-ul:pl-5 space-y-2 ${theme === 'dark' ? 'prose-invert' : ''}`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

const PricingOffer: React.FC<{ price: number, currency: string, discount?: number }> = ({ price, currency, discount }) => {
    const offerPrice = parseFloat((price * (CURRENCY_RATES_FROM_USD[currency] || 1)).toFixed(2));
    const originalPrice = parseFloat((offerPrice * 1.15).toFixed(2));
    const savings = parseFloat((originalPrice - offerPrice).toFixed(2));

    const [timeLeft, setTimeLeft] = useState(() => {
      const randomMinutes = Math.floor(Math.random() * 15) + 15; // 15 to 30 mins
      return randomMinutes * 60;
    });

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="mt-8 p-5 border rounded-lg shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent-secondary)', boxShadow: '0 0 20px var(--shadow-color-secondary)' }}>
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-sm line-through" style={{ color: 'var(--text-secondary)'}}>
                        {currency} {originalPrice.toLocaleString()}
                    </span>
                    <div className="text-4xl font-bold" style={{ color: 'var(--accent-secondary)'}}>
                        {currency} {offerPrice.toLocaleString()}
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                        You Save {currency} {savings.toLocaleString()}
                    </div>
                </div>
            </div>
            <div className="text-center mt-4 text-sm font-medium" style={{ color: 'var(--text-primary)'}}>
                Special offer expires in: 
                <span className="ml-2 font-bold text-lg tabular-nums tracking-wider" style={{ color: 'var(--accent-primary)'}}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};


const TIME_SLOT_OPTIONS = [
  '09:00 AM · Morning Departure',
  '03:30 PM · Sunset Session',
  '07:00 PM · Evening Concierge',
];

const TourDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currency, addBooking } = useAppContext();
  const { user, token, isFavorite, toggleFavorite } = useAuth();
  const navigate = useNavigate();
  const [pax, setPax] = useState(1);
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState(TIME_SLOT_OPTIONS[0]);
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [weather, setWeather] = useState('');
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [funFacts, setFunFacts] = useState('');
  const [isFunFactsLoading, setIsFunFactsLoading] = useState(false);
  const [funFactsError, setFunFactsError] = useState('');
  const [packingList, setPackingList] = useState('');
  const [isPackingListLoading, setIsPackingListLoading] = useState(false);
  const [packingListError, setPackingListError] = useState('');
  const [isVrModalOpen, setIsVrModalOpen] = useState(false);
  const [isVrLoading, setIsVrLoading] = useState(true);

  // Server Booking & Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<TravelBookingRecord | null>(null);
  const [receiptTx, setReceiptTx] = useState<PaymentTransactionRecord | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutNote, setCheckoutNote] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState('');
  const [videoStatus, setVideoStatus] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const tour = TOURS_DATA.find(t => t.slug === slug);
  const [selectedImage, setSelectedImage] = useState(tour?.images[0]);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.fullName);
      setCustomerEmail((prev) => prev || user.email);
      setCustomerPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    setSelectedImage(tour?.images[0]);
    setVideoUrl('');
  }, [slug, tour]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVrModalOpen(false);
        setReceiptOpen(false);
      }
    };
    
    if (isVrModalOpen || receiptOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isVrModalOpen, receiptOpen]);

  const tourMarker: MapMarkerData[] = useMemo(() => {
    if (!tour) return [];
    return [{
        lat: tour.latitude,
        lng: tour.longitude,
        popupContent: `<b>${tour.title}</b><br>${tour.city}`
    }];
  }, [tour]);
  
  const handleFetchWeather = async () => {
    if (!tour) return;
    setIsWeatherLoading(true);
    setWeatherError('');
    setWeather('');

    const prompt = `Provide a 5-day weather forecast for ${tour.city}, ${tour.country}. Include temperature in Celsius, weather conditions (e.g., Sunny, Cloudy with showers), and wind speed in km/h. Format the output as clean Markdown in a table format with columns: Day, Condition, Temp (°C), Wind (km/h). Add a single-sentence friendly summary at the top.`;

    try {
        const response = await fetch('/api/gemini/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
            throw new Error('Server error');
        }
        const data = await response.json();
        setWeather(data.text || '');
    } catch (err) {
        console.error(err);
        setWeatherError('Could not fetch weather data. Please try again.');
    } finally {
        setIsWeatherLoading(false);
    }
  };
  
  const handleFetchFunFacts = async () => {
    if (!tour) return;
    setIsFunFactsLoading(true);
    setFunFactsError('');
    setFunFacts('');

    const prompt = `Generate 3 to 5 interesting and little-known fun facts about ${tour.city}, ${tour.country}. Format the output as a clean Markdown bulleted list.`;

    try {
        const response = await fetch('/api/gemini/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
            throw new Error('Server error');
        }
        const data = await response.json();
        setFunFacts(data.text || '');
    } catch (err) {
        console.error(err);
        setFunFactsError('Could not fetch fun facts. Please try again.');
    } finally {
        setIsFunFactsLoading(false);
    }
  };

  const handleFetchPackingList = async () => {
    if (!tour) return;
    setIsPackingListLoading(true);
    setPackingListError('');
    setPackingList('');

    const prompt = `Based on a trip to ${tour.city}, ${tour.country} for ${tour.durationHours > 24 ? Math.ceil(tour.durationHours / 24) : 1} day(s), what should I pack? The tour is described as: "${tour.description}". Format the output as a clean Markdown list, categorized.`;

    try {
        const response = await fetch('/api/gemini/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
            throw new Error('Server error');
        }
        const data = await response.json();
        setPackingList(data.text || '');
    } catch (err) {
        console.error(err);
        setPackingListError('Could not generate a packing list. Please try again.');
    } finally {
        setIsPackingListLoading(false);
    }
  };

  const handleBookNow = async () => {
    if (!tour) return;
    setBookingError(null);

    if (!travelDate || !customerName.trim() || !customerEmail.trim()) {
      setBookingError('Please fill in your travel date, full name, and email address to reserve.');
      return;
    }

    setBookingBusy(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookingType: 'experience',
          itemSlug: tour.slug,
          travelDate,
          timeSlot,
          guests: pax,
          currency,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          specialRequests: specialRequests.trim(),
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok || !bookData.booking) {
        setBookingError(bookData.error || 'Unable to reserve this experience.');
        return;
      }

      const savedBooking: TravelBookingRecord = bookData.booking;
      const payRes = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: savedBooking.bookingRef }),
      });
      const payData = await payRes.json();

      const localBooking: Booking = {
        id: savedBooking.bookingRef,
        tourId: tour.id,
        tourTitle: tour.title,
        tourSlug: tour.slug,
        tourImage: tour.images[0],
        date: savedBooking.travelDate,
        status: 'upcoming',
        price: savedBooking.totalUsd,
        currency: 'USD',
      };
      addBooking(localBooking);

      setReceiptBooking(savedBooking);
      setReceiptTx(payData.transaction || null);
      setCheckoutUrl(payData.checkoutUrl || null);
      setCheckoutNote(payData.message || null);
      setReceiptOpen(true);
    } catch {
      setBookingError('Network error while creating reservation. Please retry.');
    } finally {
      setBookingBusy(false);
    }
  };

  const generateMissionBriefing = async () => {
    if (!tour) return;

    setIsVideoLoading(true);
    setVideoStatus('Initializing cinematic synthesis...');
    setVideoUrl('');

    try {
      setVideoStatus('Synthesizing visuals...');
      const prompt = `A cinematic, high-quality travel video showcasing the beautiful scenery and activities of ${tour.city}, ${tour.country}. ${tour.description}`;
      const response = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Video synthesis request failed');
      }

      const data = await response.json();
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else {
        throw new Error('No video URL returned');
      }
    } catch (err) {
      console.error(err);
      setVideoStatus('Synthesis failed. Please try again.');
    } finally {
      setIsVideoLoading(false);
      setVideoStatus('');
    }
  };


  if (!tour) {
    return <NotFoundPage />;
  }

  const currentPrice = tour.basePriceUSD;
  const totalAmount = currentPrice * pax;

  return (
    <div className="pt-24" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          <div className="lg:col-span-3">
            <AnimateOnScroll>
              <div className="space-y-4">
                <div 
                  className="h-72 md:h-[500px] rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden group bg-gray-900" 
                  role="img"
                  aria-label={`Image of ${tour.title}`}
                >
                  <img 
                    src={selectedImage} 
                    alt={`Image of ${tour.title}`} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {videoUrl && (
                    <video 
                      src={videoUrl} 
                      autoPlay 
                      loop 
                      controls 
                      className="absolute inset-0 w-full h-full object-cover z-10"
                    />
                  )}
                  {isVideoLoading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                      <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-white font-cinzel text-lg animate-pulse">{videoStatus}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {tour.images.map((img, index) => (
                    <button key={index} onClick={() => { setSelectedImage(img); setVideoUrl(''); }} className={`rounded-md overflow-hidden border-2 transition-all ${selectedImage === img && !videoUrl ? 'border-[var(--accent-primary)] scale-105' : 'border-transparent hover:border-[var(--accent-primary)]/50'}`}>
                        <img src={img} alt={`${tour.title} thumbnail ${index+1}`} className="w-full h-24 object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          <div className="lg:col-span-2">
            <AnimateOnScroll delay="200ms">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl md:text-4xl font-bold font-cinzel">{tour.title}</h1>
                <button
                  type="button"
                  onClick={() => toggleFavorite(tour.slug, 'experience')}
                  aria-label={isFavorite(tour.slug) ? 'Remove from favorites' : 'Save experience to favorites'}
                  className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                    isFavorite(tour.slug)
                      ? 'bg-rose-600/30 border-rose-400 text-rose-200'
                      : 'bg-white/5 border-white/15 text-gray-300 hover:text-white'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill={isFavorite(tour.slug) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
              <div className="text-md mt-2" style={{ color: 'var(--text-secondary)'}}>
                <span>{tour.durationHours > 0 ? `${tour.durationHours} hours` : 'Flexible'}</span> &bull; 
                <span> {tour.city}, {tour.country}</span>
              </div>
              <p className="mt-6 leading-relaxed" style={{ color: 'var(--text-secondary)'}}>{tour.description}</p>
              
              <AnimateOnScroll>
                <PricingOffer price={currentPrice} currency={currency} />
              </AnimateOnScroll>

              <div className="mt-6 p-4 rounded-xl border border-purple-500/25 bg-purple-950/20 text-xs space-y-1">
                <p className="font-bold uppercase tracking-wider text-purple-300">Meeting Hub</p>
                <p className="text-gray-200">
                  Central Pickup / Designated Meeting Hub — {tour.city}, {tour.country}
                </p>
              </div>
              
              <div className="mt-6 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="tour-travel-date" className="block font-semibold mb-1 text-gray-300">
                        Preferred Date *
                      </label>
                      <input
                        id="tour-travel-date"
                        type="date"
                        required
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="pax-count" className="block font-semibold mb-1 text-gray-300">
                        Guests *
                      </label>
                      <input 
                          type="number" 
                          id="pax-count"
                          name="count" 
                          min="1" 
                          max="30"
                          value={pax}
                          onChange={(e) => setPax(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tour-time-slot" className="block font-semibold mb-1 text-gray-300">
                      Departure Time Slot
                    </label>
                    <select
                      id="tour-time-slot"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {TIME_SLOT_OPTIONS.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Lead Traveler Name *"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Confirmation Email *"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="WhatsApp / Mobile (Optional)"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <input
                      type="text"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Hotel pickup or dietary note"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {bookingError && (
                    <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200">
                      {bookingError}
                    </div>
                  )}
              </div>

              <div className="mt-6 space-y-4">
                  <button 
                    onClick={handleBookNow}
                    disabled={bookingBusy}
                    className="w-full px-6 py-4 text-white font-black uppercase tracking-widest rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-60"
                    style={{ 
                      backgroundColor: 'var(--accent-primary)',
                      boxShadow: `0 4px 14px 0 var(--shadow-color-primary)`,
                      '--ring-color': 'var(--accent-primary)'
                    } as React.CSSProperties}>
                      {bookingBusy ? 'Creating Reservation...' : 'Book Adventure Now'}
                  </button>
                  <a
                    href={buildWhatsAppDirectEnquiryUrl(
                      `Hello Vanhsya Global Travels, I would like to book / enquire about "${tour.title}" (${tour.city}, ${tour.country}) on ${travelDate} (${timeSlot}) for ${pax} guest(s) in ${currency}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    Book / Enquire on WhatsApp ({BRAND_CONTACTS.whatsappDisplay})
                  </a>
                  {tour.vrPreviewUrl && (
                      <button
                          onClick={() => setIsVrModalOpen(true)}
                          className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-purple-500 flex items-center justify-center"
                      >
                          <VRIcon />
                          Launch VR Preview
                      </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <button 
                          onClick={generateMissionBriefing} 
                          disabled={isVideoLoading || !!videoUrl}
                          className="px-4 py-3 bg-pink-600/20 border border-pink-500/30 text-pink-300 font-bold rounded-lg hover:bg-pink-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center text-xs uppercase"
                      >
                          {isVideoLoading ? '...' : 'Video'}
                      </button>
                      <button 
                          onClick={handleFetchWeather} 
                          disabled={isWeatherLoading}
                          className="px-4 py-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center text-xs uppercase"
                      >
                          {isWeatherLoading ? '...' : 'Weather'}
                      </button>
                      <button 
                          onClick={handleFetchFunFacts} 
                          disabled={isFunFactsLoading}
                          className="px-4 py-3 bg-teal-600/20 border border-teal-500/30 text-teal-300 font-bold rounded-lg hover:bg-teal-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center text-xs uppercase"
                      >
                          {isFunFactsLoading ? '...' : 'Fun Facts'}
                      </button>
                      <button 
                          onClick={handleFetchPackingList} 
                          disabled={isPackingListLoading}
                          className="px-4 py-3 bg-orange-600/20 border border-orange-500/30 text-orange-300 font-bold rounded-lg hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center text-xs uppercase"
                      >
                          {isPackingListLoading ? '...' : 'Packing'}
                      </button>
                  </div>
              </div>

              <div className="mt-6 text-sm bg-purple-500/10 border border-purple-500/30 p-3 rounded-md" style={{ color: 'var(--accent-secondary)'}}>
                <span className="font-semibold">Group Discount:</span> {tour.groupDiscountPercent}% off for groups of {tour.groupDiscountThreshold} or more!
              </div>
              
              {tour.isMeetupEligible && (
                <div className="mt-6 text-center">
                  <Link to="/meetups" className="hover:underline font-medium" style={{ color: 'var(--accent-secondary)'}}>
                    Join a Stranger MeetUp for this destination
                  </Link>
                </div>
              )}
            </AnimateOnScroll>
          </div>
        </div>

        {/* --- Details Sections --- */}
        <div className="max-w-6xl mx-auto px-4 mt-16">
          <AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-bold mb-4 font-cinzel">What's Included</h2>
                    <ul className="space-y-3">
                    {tour.inclusions.map((item, index) => (
                        <li key={index} className="flex items-start">
                            <CheckIcon />
                            <span className="ml-3" style={{ color: 'var(--text-secondary)'}}>{item}</span>
                        </li>
                    ))}
                    </ul>
                    <h2 className="text-2xl font-bold mb-4 mt-8 font-cinzel">What's Not Included</h2>
                    <ul className="space-y-3">
                    {tour.exclusions.map((item, index) => (
                        <li key={index} className="flex items-start">
                            <CrossIcon />
                            <span className="ml-3" style={{ color: 'var(--text-secondary)'}}>{item}</span>
                        </li>
                    ))}
                    </ul>
                </div>
                {tour.sampleItinerary && tour.sampleItinerary.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 font-cinzel">Sample Itinerary</h2>
                        <ItineraryAccordion items={tour.sampleItinerary} />
                    </div>
                )}
            </div>
          </AnimateOnScroll>
        </div>


        <AnimateOnScroll>
            <div className="max-w-6xl mx-auto px-4 mt-16">
                <h2 className="text-2xl font-bold mb-4 font-cinzel">Location</h2>
                <InteractiveMap 
                key={`${tour.latitude}-${tour.longitude}`}
                centerLat={tour.latitude}
                centerLng={tour.longitude}
                zoom={13} 
                markers={tourMarker}
                />
            </div>
        </AnimateOnScroll>
        
        <div className="max-w-6xl mx-auto px-4 mt-16 space-y-12">
          {(isWeatherLoading || weatherError || weather) && (
            <AnimateOnScroll>
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
                <h3 className="text-2xl font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)'}}>
                    <WeatherIcon /> Weather in {tour.city}
                </h3>
                {isWeatherLoading && <SkeletonLoader />}
                {weatherError && <ErrorDisplay message={weatherError} onRetry={handleFetchWeather} />}
                {!isWeatherLoading && weather && <WeatherDisplay weatherMarkdown={weather} city={tour.city} />}
              </div>
            </AnimateOnScroll>
          )}

          {(isFunFactsLoading || funFactsError || funFacts) && (
            <AnimateOnScroll>
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
                <h3 className="text-2xl font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)'}}>
                    <BulbIcon /> Did You Know?
                </h3>
                {isFunFactsLoading && <SkeletonLoader />}
                {funFactsError && <ErrorDisplay message={funFactsError} onRetry={handleFetchFunFacts} />}
                {!isFunFactsLoading && funFacts && <FunFactsDisplay funFactsMarkdown={funFacts} />}
              </div>
            </AnimateOnScroll>
          )}

          {(isPackingListLoading || packingListError || packingList) && (
            <AnimateOnScroll>
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
                <h3 className="text-2xl font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)'}}>
                    <ListIcon /> Suggested Packing List
                </h3>
                {isPackingListLoading && <SkeletonLoader />}
                {packingListError && <ErrorDisplay message={packingListError} onRetry={handleFetchPackingList} />}
                {!isPackingListLoading && packingList && <PackingListDisplay packingListMarkdown={packingList} />}
              </div>
            </AnimateOnScroll>
          )}
        </div>

      </div>

      {/* --- VR Modal --- */}
      {isVrModalOpen && tour.vrPreviewUrl && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsVrModalOpen(false)}>
              <div className="relative w-full max-w-4xl bg-black rounded-lg shadow-2xl shadow-purple-500/20" onClick={e => e.stopPropagation()}>
                  <div className="aspect-video relative">
                    {isVrLoading && (
                      <div className="absolute inset-0 w-full h-full bg-gray-800 animate-pulse rounded-lg flex items-center justify-center border border-gray-700">
                           <div className="text-center">
                              <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-400 font-cinzel">Loading VR Experience...</p>
                           </div>
                      </div>
                    )}
                      <iframe
                          className={`w-full h-full rounded-lg transition-opacity duration-500 ${isVrLoading ? 'opacity-0' : 'opacity-100'}`}
                          src={tour.vrPreviewUrl}
                          title={`${tour.title} VR Preview`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          onLoad={() => setIsVrLoading(false)}
                      ></iframe>
                  </div>
                  <button
                      onClick={() => setIsVrModalOpen(false)}
                      className="absolute -top-4 -right-4 bg-white text-black rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl hover:bg-gray-200 transition-colors"
                      aria-label="Close VR preview"
                  >
                      &times;
                  </button>
              </div>
          </div>
      )}

      {/* --- Official Booking & Payment Receipt Modal --- */}
      <ReceiptModal
        isOpen={receiptOpen}
        booking={receiptBooking}
        payment={receiptTx}
        checkoutUrl={checkoutUrl}
        checkoutNote={checkoutNote}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
};

export default TourDetailPage;



import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TOURS_DATA, CURRENCY_RATES_FROM_USD } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import NotFoundPage from './NotFoundPage';
import { GoogleGenAI } from "@google/genai";
import InteractiveMap from '../components/InteractiveMap';
import { ItineraryItem, MapMarkerData } from '../types';
import AnimateOnScroll from '../components/AnimateOnScroll';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';


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
    } else {
      navigator.clipboard.writeText(`Here's the weather for ${city}:\n\n${textContent}`)
        .then(() => alert('Forecast copied to clipboard!'))
        .catch(() => alert('Could not copy forecast. Web Share API not supported.'));
    }
  };

  if (!htmlContent) return null;

  return (
    <>
      <div 
        className={`prose max-w-none prose-table:w-full prose-td:px-2 prose-td:py-1 prose-th:px-2 prose-th:py-1 ${theme === 'dark' ? 'prose-invert' : ''}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
      <button 
        onClick={handleShare}
        className="mt-4 w-full px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
      >
        Share Forecast
      </button>
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


const TourDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currency } = useAppContext();
  const [pax, setPax] = useState(1);
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
  
  const tour = TOURS_DATA.find(t => t.slug === slug);
  const [selectedImage, setSelectedImage] = useState(tour?.images[0]);

  useEffect(() => {
    setSelectedImage(tour?.images[0]);
  }, [slug, tour]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVrModalOpen(false);
      }
    };
    
    if (isVrModalOpen) {
      setIsVrLoading(true);
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isVrModalOpen]);

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

    const prompt = `Provide a 5-day weather forecast for ${tour.city}, ${tour.country}. Include temperature in Celsius, weather conditions (e.g., Sunny, Cloudy with showers), and wind speed in km/h. Format the output as clean Markdown in a table format with columns: Day, Condition, Temp (°C), Wind (km/h). Add a single-sentence friendly summary at the top. For example: "Here's the 5-day forecast for sunny Dubai!"`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        setWeather(response.text);
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

    const prompt = `Generate 3 to 5 interesting and little-known fun facts about ${tour.city}, ${tour.country}. Format the output as a clean Markdown bulleted list. Each fact should be concise and engaging for a traveler.`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        setFunFacts(response.text);
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

    const prompt = `Based on a trip to ${tour.city}, ${tour.country} for ${tour.durationHours > 24 ? Math.ceil(tour.durationHours / 24) : 1} day(s), what should I pack? The tour is described as: "${tour.description}". Provide a practical packing list. Consider the location and potential activities. Format the output as a clean Markdown list, categorized (e.g., Clothing, Essentials, Electronics).`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        setPackingList(response.text);
    } catch (err) {
        console.error(err);
        setPackingListError('Could not generate a packing list. Please try again.');
    } finally {
        setIsPackingListLoading(false);
    }
  };


  if (!tour) {
    return <NotFoundPage />;
  }

  const currentPrice = tour.basePriceUSD;

  return (
    <div className="pt-24" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          <div className="lg:col-span-3">
            <AnimateOnScroll>
              <div className="space-y-4">
                <div 
                  className="h-72 md:h-[500px] rounded-xl bg-cover bg-center shadow-lg transition-all duration-300" 
                  style={{ backgroundImage: `url(${selectedImage})` }}
                  role="img"
                  aria-label={`Image of ${tour.title}`}
                ></div>
                <div className="grid grid-cols-4 gap-4">
                  {tour.images.map((img, index) => (
                    <button key={index} onClick={() => setSelectedImage(img)} className={`rounded-md overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-[var(--accent-primary)] scale-105' : 'border-transparent hover:border-[var(--accent-primary)]/50'}`}>
                        <img src={img} alt={`${tour.title} thumbnail ${index+1}`} className="w-full h-24 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          <div className="lg:col-span-2">
            <AnimateOnScroll delay="200ms">
              <h1 className="text-3xl md:text-4xl font-bold">{tour.title}</h1>
              <div className="text-md mt-2" style={{ color: 'var(--text-secondary)'}}>
                <span>{tour.durationHours > 0 ? `${tour.durationHours} hours` : 'Flexible'}</span> &bull; 
                <span> {tour.city}, {tour.country}</span>
              </div>
              <p className="mt-6 leading-relaxed" style={{ color: 'var(--text-secondary)'}}>{tour.description}</p>
              
              <AnimateOnScroll>
                <PricingOffer price={currentPrice} currency={currency} />
              </AnimateOnScroll>
              
              <div className="mt-8">
                  <div className="flex items-center gap-4">
                      <label htmlFor="pax-count" className="font-semibold">Guests:</label>
                      <input 
                          type="number" 
                          id="pax-count"
                          name="count" 
                          min="1" 
                          value={pax}
                          onChange={(e) => setPax(Math.max(1, parseInt(e.target.value) || 1))}
                          className="border rounded-md px-3 py-2 w-24 text-center focus:ring-2 focus:outline-none"
                          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', '--ring-color': 'var(--accent-primary)' } as React.CSSProperties}
                      />
                  </div>
              </div>

              <div className="mt-6 space-y-4">
                  <button className="w-full px-6 py-3 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
                    style={{ 
                      backgroundColor: 'var(--accent-primary)',
                      boxShadow: `0 4px 14px 0 var(--shadow-color-primary)`,
                      '--ring-color': 'var(--accent-primary)'
                    } as React.CSSProperties}>
                      Book Now
                  </button>
                  {tour.vrPreviewUrl && (
                      <button
                          onClick={() => setIsVrModalOpen(true)}
                          className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-purple-500 flex items-center justify-center"
                      >
                          <VRIcon />
                          Launch VR Preview
                      </button>
                  )}
                  <button 
                      onClick={handleFetchWeather} 
                      disabled={isWeatherLoading}
                      className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                      {isWeatherLoading ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Fetching Weather...
                          </>
                      ) : (
                          'View 5-Day Forecast'
                      )}
                  </button>
                  <button 
                      onClick={handleFetchFunFacts} 
                      disabled={isFunFactsLoading}
                      className="w-full px-6 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-teal-500 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                      {isFunFactsLoading ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Finding Fun Facts...
                          </>
                      ) : (
                          'Discover Fun Facts'
                      )}
                  </button>
                  <button 
                      onClick={handleFetchPackingList} 
                      disabled={isPackingListLoading}
                      className="w-full px-6 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-600/30 hover:bg-orange-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-orange-500 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                      {isPackingListLoading ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating List...
                          </>
                      ) : (
                          <><PackingIcon /> Get Packing List</>
                      )}
                  </button>
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
                    <h2 className="text-2xl font-bold mb-4">What's Included</h2>
                    <ul className="space-y-3">
                    {tour.inclusions.map((item, index) => (
                        <li key={index} className="flex items-start">
                            <CheckIcon />
                            <span className="ml-3" style={{ color: 'var(--text-secondary)'}}>{item}</span>
                        </li>
                    ))}
                    </ul>
                    <h2 className="text-2xl font-bold mb-4 mt-8">What's Not Included</h2>
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
                        <h2 className="text-2xl font-bold mb-4">Sample Itinerary</h2>
                        <ItineraryAccordion items={tour.sampleItinerary} />
                    </div>
                )}
            </div>
          </AnimateOnScroll>
        </div>


        <AnimateOnScroll>
            <div className="max-w-6xl mx-auto px-4 mt-16">
                <h2 className="text-2xl font-bold mb-4">Location</h2>
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
    </div>
  );
};

export default TourDetailPage;
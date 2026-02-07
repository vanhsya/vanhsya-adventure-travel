
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../contexts/AppContext';

declare global {
  interface Window {
    marked: any;
  }
}

// --- SVG Icons ---
const AdventureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const RelaxationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.886 21h8.228M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>;
const FoodieIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c.454-.303.977-.454 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c-.454-.303-.977-.454-1.5-.454zM21 12.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c.454-.303.977-.454 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c-.454-.303-.977-.454-1.5-.454zM21 9.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c.454-.303.977-.454 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c-.454-.303-.977-.454-1.5-.454z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const CultureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const NightlifeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const NatureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>;
const ShoppingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;

const interestOptions: {name: string, icon: React.ReactNode}[] = [
    { name: 'Adventure', icon: <AdventureIcon /> }, { name: 'Relaxation', icon: <RelaxationIcon /> },
    { name: 'Foodie', icon: <FoodieIcon /> }, { name: 'History', icon: <HistoryIcon /> },
    { name: 'Culture', icon: <CultureIcon /> }, { name: 'Nightlife', icon: <NightlifeIcon /> },
    { name: 'Nature', icon: <NatureIcon /> }, { name: 'Shopping', icon: <ShoppingIcon /> }
];

type TravelVibe = 'Relaxed Pace' | 'Balanced Itinerary' | 'Action-Packed';
const travelVibes: TravelVibe[] = ['Relaxed Pace', 'Balanced Itinerary', 'Action-Packed'];

interface ItineraryDay {
  day: string;
  title: string;
  activities: string;
}

const FeedbackSection: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'submitted'>('idle');

    if (status === 'submitted') {
        return (
            <div className="mt-12 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fadeIn text-center">
                <p className="text-green-400 font-bold text-xs tracking-[0.3em] uppercase">/// Feedback Logged. Thank you, Explorer. ///</p>
            </div>
        );
    }

    return (
        <div className="mt-12 p-8 bg-white/5 border border-white/10 rounded-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6">Architectural Integrity Check</p>
            <h4 className="text-xl font-bold text-white mb-8 font-cinzel">Was this blueprint helpful?</h4>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                    onClick={() => setStatus('submitted')}
                    className="flex items-center justify-center gap-3 px-8 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all group font-bold uppercase text-xs tracking-widest"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.708C19.741 10 20 10.259 20 10.583v1.334c0 .324-.259.583-.583.583H14M14 10h-4M14 10V6a2 2 0 10-4 0v4M10 10H5.292C4.259 10 4 10.259 4 10.583v1.334c0 .324.259.583.583.583H10M10 10v4a2 2 0 12 4 0v-4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Affirmative
                </button>
                <button 
                    onClick={() => setStatus('submitted')}
                    className="flex items-center justify-center gap-3 px-8 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-black transition-all group font-bold uppercase text-xs tracking-widest"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Needs Calibration
                </button>
            </div>
        </div>
    );
};

const ItineraryDisplay: React.FC<{ itinerary: string; imageUrl: string | null; onReset: () => void }> = ({ itinerary, imageUrl, onReset }) => {
  const [tripTitle, setTripTitle] = useState('Your Custom Itinerary');
  const [parsedItinerary, setParsedItinerary] = useState<ItineraryDay[]>([]);
  const [openDay, setOpenDay] = useState<string | null>('Day 1');

  useEffect(() => {
    if (itinerary) {
      const lines = itinerary.split('\n');
      const title = lines.find(line => line.startsWith('# '))?.substring(2) || 'Your Custom Itinerary';
      setTripTitle(title);
      
      const days: ItineraryDay[] = [];
      let currentDay: ItineraryDay | null = null;
      lines.forEach(line => {
        const dayMatch = line.match(/^\#\#\s+(Day\s+\d+):\s*(.*)/);
        if (dayMatch) {
          if (currentDay) days.push(currentDay);
          currentDay = { day: dayMatch[1], title: dayMatch[2], activities: '' };
        } else if (currentDay && !line.startsWith('# ')) {
          currentDay.activities += line + '\n';
        }
      });
      if (currentDay) days.push(currentDay);
      setParsedItinerary(days);
    }
  }, [itinerary]);

  return (
    <div className="animate-fadeIn relative z-10">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 md:p-8 shadow-2xl shadow-[var(--shadow-color-secondary)]">
        {imageUrl ? (
          <div className="relative w-full h-80 rounded-lg mb-8 overflow-hidden group shadow-2xl animate-scale-in">
              <img src={imageUrl} alt={tripTitle} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 p-6">
                  <span className="bg-[var(--accent-primary)] text-black font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2 inline-block">AI Generated Experience</span>
                  <h2 className="text-3xl md:text-4xl font-bold font-cinzel text-white drop-shadow-md">{tripTitle}</h2>
              </div>
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-800 rounded-lg mb-6 flex items-center justify-center animate-pulse">
            <p style={{color: 'var(--text-secondary)'}}>Generating trip poster...</p>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
            {parsedItinerary.map((item, index) => (
                <div 
                  key={index} 
                  className="rounded-lg overflow-hidden border border-white/10 bg-white/5 transition-all duration-300 hover:bg-white/10 stagger-item"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                    <button
                        onClick={() => setOpenDay(openDay === item.day ? null : item.day)}
                        className="w-full flex justify-between items-center p-4 text-left font-semibold text-white group"
                    >
                        <span className="font-bold text-lg">
                          <span className="text-[var(--accent-primary)] transition-colors group-hover:text-white">{item.day}:</span> {item.title}
                        </span>
                        <svg
                            className={`w-5 h-5 transform transition-transform duration-300 text-gray-400 ${openDay === item.day ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${openDay === item.day ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="p-6 pt-0 border-t border-white/10 mt-2">
                           <div className={`prose prose-sm max-w-none prose-invert`} dangerouslySetInnerHTML={{ __html: window.marked.parse(item.activities) }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <FeedbackSection />
      </div>
      <div className="text-center mt-12 space-x-4">
        <button
            onClick={onReset}
            className="py-4 px-10 bg-[var(--accent-secondary)] text-white font-bold rounded-full shadow-lg hover:brightness-110 transition-all transform hover:scale-105 click-pulse"
            style={{boxShadow: '0 4px 20px 0 var(--shadow-color-secondary)'}}
        >
            Plan Another Trip
        </button>
      </div>
    </div>
  );
};


const Loader: React.FC = () => {
    const texts = useMemo(() => [
        "Initializing Neural Cartography...",
        "Accessing Global Itinerary Databases...",
        "Optimizing Logistics Matrix...",
        "Synthesizing Hidden Gem Vectors...",
        "Rendering High-Fidelity Visuals...",
        "Compiling Bespoke Travel Protocol...",
        "Finalizing Signature Blueprint..."
    ], []);
    
    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [scrambledText, setScrambledText] = useState(texts[0]);

    useEffect(() => {
        const textTimer = setInterval(() => {
            setIndex((prevIndex) => {
                const next = (prevIndex + 1) % texts.length;
                // Text Scramble effect start
                let iterations = 0;
                const target = texts[next];
                const scrambleInterval = setInterval(() => {
                    setScrambledText(
                        target.split("").map((char, i) => {
                            if (i < iterations) return target[i];
                            return String.fromCharCode(33 + Math.floor(Math.random() * 94));
                        }).join("")
                    );
                    if (iterations >= target.length) clearInterval(scrambleInterval);
                    iterations += 2;
                }, 30);
                return next;
            });
        }, 2800);

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 99) return 99;
                return Math.min(99, prev + (Math.random() * 1.5));
            });
        }, 120);

        return () => {
            clearInterval(textTimer);
            clearInterval(progressTimer);
        };
    }, [texts.length]);

    return (
        <div className="text-center relative z-10 flex flex-col items-center justify-center min-h-[65vh] px-4">
            <style>{`
                @keyframes grid-sweep {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
                @keyframes line-draw {
                    0% { width: 0; opacity: 0; }
                    50% { width: 100%; opacity: 1; }
                    100% { width: 100%; opacity: 0.2; }
                }
                .blueprint-grid {
                    background-image: 
                        linear-gradient(to right, rgba(0, 242, 254, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0, 242, 254, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                }
            `}</style>

            {/* Blueprint Architecture Container */}
            <div className="relative w-full max-w-2xl aspect-video mb-12 rounded-3xl border border-cyan-500/20 bg-black/60 overflow-hidden shadow-[0_0_50px_rgba(0,242,254,0.1)] group">
                <div className="absolute inset-0 blueprint-grid opacity-30"></div>
                
                {/* Construction Lines Swiping */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-cyan-400/30 shadow-[0_0_20px_#00f2fe] animate-[grid-sweep_5s_linear_infinite]"></div>
                    <div className="w-full h-1 bg-purple-500/20 shadow-[0_0_15px_#8a2be2] animate-[grid-sweep_5s_linear_infinite] [animation-delay:2.5s]"></div>
                </div>

                {/* Central 3D Model Proxy (Rotating Architectural Lines) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-64 h-64 opacity-60">
                        {/* Nested Geometric Rings */}
                        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[spin_15s_linear_infinite]"></div>
                        <div className="absolute inset-4 rounded-full border border-purple-500/20 animate-[spin_10s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-8 border border-white/10 animate-[spin_20s_linear_infinite]">
                            <div className="w-full h-full border-t border-b border-cyan-500/40"></div>
                        </div>
                        
                        {/* Architectural Wireframe Pulsing in Center */}
                        <div className="absolute inset-[30%] flex items-center justify-center">
                            <div className="w-full h-full border-2 border-cyan-400 rotate-45 animate-pulse flex items-center justify-center">
                                <div className="w-1/2 h-1/2 bg-cyan-500/20 animate-ping"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real-time Technical Data Panel */}
                <div className="absolute top-6 left-8 font-mono text-[9px] text-cyan-400/50 text-left space-y-1 tracking-widest hidden sm:block">
                    <p className="text-white/80 font-bold uppercase mb-2 border-b border-white/10 pb-1">Architecture Engine v4.0</p>
                    <p>MAPPING_COORDS: {Math.random().toFixed(4)}, {Math.random().toFixed(4)}</p>
                    <p>HEURISTIC_SCORE: {(progress * 1.2).toFixed(2)}%</p>
                    <p>DATA_STREAM: ENCRYPTED_SSL_AES256</p>
                    <p>NODE_STATUS: <span className="text-green-400 animate-pulse">OPTIMIZED</span></p>
                </div>

                <div className="absolute bottom-6 right-8 font-mono text-[9px] text-purple-400/50 text-right space-y-1 tracking-widest hidden sm:block">
                    <p>ARCHITECT_UID: VNHSY_00X122</p>
                    <p>VECTOR_SYNC: {progress > 50 ? 'SYNCED' : 'ALIGNING...'}</p>
                    <p>RENDER_TOLERANCE: 0.0001μ</p>
                </div>

                {/* Progress Circle in corner */}
                <div className="absolute bottom-6 left-8 w-12 h-12">
                   <svg className="w-full h-full -rotate-90">
                       <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                       <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500" style={{ strokeDasharray: 125, strokeDashoffset: 125 - (125 * progress) / 100 }} />
                   </svg>
                   <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-cyan-400">
                    {progress.toFixed(0)}%
                   </span>
                </div>
            </div>

            <div className="space-y-6 max-w-lg w-full">
                <div className="flex items-center justify-center gap-4">
                    <div className="h-px bg-gradient-to-r from-transparent to-cyan-500/50 flex-1"></div>
                    <h2 className="text-4xl font-black text-white font-cinzel tracking-[0.2em] uppercase">
                        Blueprint <span className="text-cyan-400 animate-pulse">Genesis</span>
                    </h2>
                    <div className="h-px bg-gradient-to-l from-transparent to-cyan-500/50 flex-1"></div>
                </div>
                
                <div className="relative h-12 flex items-center justify-center">
                    <p className="text-cyan-400 font-mono text-xl tracking-tighter uppercase drop-shadow-[0_0_10px_#00f2fe]">
                        {scrambledText}
                    </p>
                </div>

                {/* Technical Progress Bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full border border-white/5 overflow-hidden relative group">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-400 via-white to-purple-500 transition-all duration-1000 ease-out shadow-[0_0_25px_#00f2fe]" 
                        style={{ width: `${progress}%` }}
                    ></div>
                    {/* Glow effect that follows progress */}
                    <div 
                        className="absolute top-0 bottom-0 w-20 bg-white/20 blur-md transition-all duration-1000"
                        style={{ left: `calc(${progress}% - 20px)` }}
                    ></div>
                </div>
                
                <div className="flex justify-between items-center text-[8px] font-mono text-white/30 uppercase tracking-[0.5em] mt-2">
                    <span>Calibration Active</span>
                    <span>System Lock: Engaged</span>
                </div>
            </div>
        </div>
    );
}

const AIPlannerPage: React.FC = () => {
    const initialFormState = {
        destination: '',
        duration: '7',
        interests: new Set<string>(),
        budget: '2000',
        vibe: 'Balanced Itinerary' as TravelVibe,
    };
    const [formData, setFormData] = useState(initialFormState);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [itinerary, setItinerary] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [dynamicBg, setDynamicBg] = useState<string>('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop');

    const TOTAL_STEPS = 4;

    const fetchDestinationImage = async (dest: string) => {
        if (!dest) return;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const imagePrompt = `Create a breathtaking, cinematic, photorealistic 8k image of ${dest}. Wide angle, travel photography, golden hour lighting.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: imagePrompt }] },
                config: {
                    imageConfig: { aspectRatio: "16:9" }
                },
            });
            
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                setDynamicBg(`data:image/png;base64,${base64ImageBytes}`);
                break;
              }
            }
        } catch (err) {
            console.error("Background image generation failed", err);
        }
    };

    const handleInterestToggle = (interest: string) => {
        setFormData(prev => {
            const newInterests = new Set(prev.interests);
            if (newInterests.has(interest)) {
                newInterests.delete(interest);
            } else {
                newInterests.add(interest);
            }
            return { ...prev, interests: newInterests };
        });
    };
    
    const handleVibeSelect = (vibe: TravelVibe) => {
        setFormData(prev => ({ ...prev, vibe }));
    };

    const handleReset = () => {
        setFormData(initialFormState);
        setItinerary('');
        setImageUrl(null);
        setError('');
        setStep(1);
        setDynamicBg('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop');
    };

    const handleSubmit = async () => {
        if (!formData.destination) {
            setError("Please enter a destination to begin.");
            setStep(1);
            return;
        }
        setIsLoading(true);
        setError('');
        setItinerary('');
        setImageUrl(null);

        const itineraryPrompt = `
            Create a detailed travel itinerary based on the following preferences:
            - Destination: ${formData.destination}
            - Trip Duration: ${formData.duration} days
            - Travel Vibe: ${formData.vibe}
            - Main Interests: ${Array.from(formData.interests).join(', ') || 'General Sightseeing'}
            - Budget per person: Approximately $${formData.budget} USD

            Please provide a day-by-day plan. For each day, start with a second-level markdown heading like "## Day 1: Arrival and Exploration".
            Follow this with a list of suggested activities with brief details.
            Start the entire response with a catchy trip title as a main heading (H1), like "# Epic Adventure in [Destination]".
            Format the output as clean, well-structured Markdown.
        `;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            // --- Generate Trip Poster Image ---
            const imagePrompt = `Create a breathtaking, realistic travel photography style image of ${formData.destination}. Capture the essence of ${Array.from(formData.interests).join(', ')}. Cinematic lighting.`;

            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: imagePrompt }] },
                config: {
                    imageConfig: { aspectRatio: "16:9" }
                },
            });
            
            for (const part of imageResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                const url = `data:image/png;base64,${base64ImageBytes}`;
                setImageUrl(url);
                setDynamicBg(url); 
                break;
              }
            }

            // --- Generate Itinerary Text ---
            const textResponseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: itineraryPrompt,
            });
            let fullTextResponse = '';
            for await (const chunk of textResponseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullTextResponse += chunkText;
                    setItinerary(fullTextResponse);
                }
            }

        } catch (err) {
            console.error(err);
            setError('Failed to generate itinerary. Our AI might be on a coffee break. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div key="step1" className="text-center animate-slide-in">
                        <h2 className="text-3xl font-bold mb-6 text-white font-cinzel">Where does your compass point?</h2>
                        <div className="relative group max-w-lg mx-auto">
                          <input 
                              type="text" 
                              value={formData.destination} 
                              onChange={e => setFormData({...formData, destination: e.target.value})} 
                              placeholder="e.g., Kyoto, Japan" 
                              className="w-full bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-8 py-5 text-xl text-center text-white placeholder-gray-400 focus:ring-4 focus:ring-[var(--accent-secondary)]/30 focus:outline-none focus:border-[var(--accent-secondary)] transition-all shadow-xl" 
                          />
                          <div className="absolute inset-0 rounded-full bg-[var(--accent-secondary)] opacity-0 group-focus-within:opacity-5 transition-opacity pointer-events-none"></div>
                        </div>
                        <button 
                          onClick={() => { setStep(2); fetchDestinationImage(formData.destination); }} 
                          disabled={!formData.destination} 
                          className="mt-10 py-4 px-14 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-black uppercase tracking-widest rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 hover:shadow-cyan-500/50 click-pulse"
                        >
                          Discover &rarr;
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div key="step2" className="animate-slide-in w-full max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white font-cinzel">Logistics & Budget</h2>
                        <div className="mb-8 space-y-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Trip Duration (Days)</label>
                            <div className="relative">
                                <input 
                                  type="number" 
                                  value={formData.duration} 
                                  min="1" 
                                  max="30" 
                                  onChange={e => setFormData({...formData, duration: e.target.value})} 
                                  className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-[var(--accent-secondary)] focus:outline-none transition-all" 
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">Days</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Budget per person (USD)</label>
                            <input 
                              type="range" 
                              min="500" 
                              max="10000" 
                              step="100" 
                              value={formData.budget} 
                              onChange={e => setFormData({...formData, budget: e.target.value})} 
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-secondary)] hover:brightness-110 transition-all" 
                            />
                            <div className="text-center font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] animate-scale-in">
                              ${parseInt(formData.budget).toLocaleString()}
                            </div>
                        </div>
                         <div className="flex justify-between mt-12">
                            <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors">Back</button>
                            <button onClick={() => setStep(3)} className="py-3 px-10 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 click-pulse shadow-xl">Next</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div key="step3" className="animate-slide-in w-full max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white font-cinzel">Choose Your Vibe</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {travelVibes.map((vibe, idx) => (
                                <button 
                                    key={vibe} 
                                    type="button" 
                                    onClick={() => handleVibeSelect(vibe)} 
                                    className={`group p-6 text-left rounded-xl border transition-all duration-300 flex items-center justify-between hover:scale-[1.02] ${formData.vibe === vibe ? 'bg-[var(--accent-secondary)]/20 border-[var(--accent-secondary)] text-white shadow-lg shadow-purple-900/40' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex flex-col">
                                      <span className={`font-bold text-lg transition-colors ${formData.vibe === vibe ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{vibe}</span>
                                      <span className="text-xs text-gray-500 font-medium">
                                        {vibe === 'Relaxed Pace' ? 'One major sight a day.' : vibe === 'Balanced Itinerary' ? '2-3 activities per day.' : 'See it all, do it all.'}
                                      </span>
                                    </div>
                                    <div className={`h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center ${formData.vibe === vibe ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-gray-700'}`}>
                                      {formData.vibe === vibe && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black animate-scale-in" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                      )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-12">
                            <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors">Back</button>
                            <button onClick={() => setStep(4)} className="py-3 px-10 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 click-pulse shadow-xl">Next</button>
                        </div>
                    </div>
                );
            case 4:
                 return (
                    <div key="step4" className="animate-slide-in w-full">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white font-cinzel">What fuels your wanderlust?</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {interestOptions.map(({name, icon}, idx) => (
                                <button 
                                    key={name} 
                                    type="button" 
                                    onClick={() => handleInterestToggle(name)} 
                                    className={`relative p-5 flex flex-col items-center justify-center text-center rounded-2xl border transition-all duration-300 aspect-square stagger-item group ${formData.interests.has(name) ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-black font-black shadow-lg shadow-cyan-500/20 animate-select-pop' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/30'}`}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className={`transition-transform duration-300 ${formData.interests.has(name) ? 'scale-110' : 'group-hover:scale-110 group-hover:text-white'}`}>
                                      {icon}
                                    </div>
                                    <span className="text-xs mt-3 uppercase tracking-tighter font-bold">{name}</span>
                                    {formData.interests.has(name) && (
                                      <div className="absolute top-2 right-2 bg-black text-[var(--accent-primary)] rounded-full p-0.5 animate-scale-in">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                      </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-12 items-center">
                            <button onClick={() => setStep(3)} className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors">Back</button>
                            <button 
                              onClick={handleSubmit} 
                              disabled={isLoading} 
                              className="py-4 px-12 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-black uppercase tracking-[0.2em] text-sm rounded-full shadow-2xl transition-all transform hover:scale-105 click-pulse disabled:opacity-50"
                            >
                                {isLoading ? (
                                  <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Analyzing...
                                  </span>
                                ) : 'Generate Blueprint'}
                            </button>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="relative min-h-screen pt-24 pb-12 overflow-hidden transition-all duration-1000">
            {/* Dynamic Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform scale-105"
                style={{ 
                    backgroundImage: `url(${dynamicBg})`,
                    filter: isLoading || itinerary ? 'brightness(0.2) blur(20px)' : 'brightness(0.3) blur(4px)'
                }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 min-h-[70vh] flex flex-col justify-center">
                
                {isLoading || itinerary ? (
                    isLoading ? (
                        <div className="animate-scale-in">
                          <Loader />
                        </div>
                    ) : (
                        <div className="animate-scale-in">
                          <ItineraryDisplay itinerary={itinerary} imageUrl={imageUrl} onReset={handleReset} />
                        </div>
                    )
                ) : (
                     <div className="animate-fadeIn">
                        <div className="text-center mb-12">
                            <h1 className="text-5xl md:text-7xl font-black font-cinzel tracking-wider text-white drop-shadow-2xl animate-hero-p">
                                AI Travel Architect
                            </h1>
                            <p className="mt-6 text-xl text-gray-300 font-light tracking-wide italic opacity-80 animate-hero-p" style={{ animationDelay: '200ms' }}>
                                Design your bespoke global footprint in seconds.
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
                             {/* Progress Bar */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                                <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-700 ease-out shadow-[0_0_10px_var(--accent-primary)]" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                            </div>

                            <div className="w-full mt-4">
                                {renderStep()}
                            </div>
                        </div>
                        
                        {error && (
                          <div className="mt-8 text-center text-red-200 bg-red-900/30 border border-red-500/30 p-5 rounded-2xl backdrop-blur-md animate-scale-in">
                            <p className="font-bold mb-1">System Error</p>
                            <p className="text-sm opacity-80">{error}</p>
                          </div>
                        )}
                     </div>
                )}
            </div>
        </div>
    );
};

export default AIPlannerPage;

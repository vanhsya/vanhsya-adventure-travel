
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
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

const ItineraryDisplay: React.FC<{ itinerary: string; imageUrl: string | null; onReset: () => void }> = ({ itinerary, imageUrl, onReset }) => {
  const { theme } = useAppContext();
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
          <div className="relative w-full h-80 rounded-lg mb-8 overflow-hidden group shadow-2xl">
              <img src={imageUrl} alt={tripTitle} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 p-6">
                  <span className="bg-[var(--accent-primary)] text-black font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2 inline-block">AI Generated Experience</span>
                  <h2 className="text-3xl md:text-4xl font-bold font-cinzel text-white drop-shadow-md">{tripTitle}</h2>
              </div>
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-800 rounded-lg mb-6 flex items-center justify-center">
            <p style={{color: 'var(--text-secondary)'}}>Generating trip poster...</p>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
            {parsedItinerary.map((item, index) => (
                <div key={index} className="rounded-lg overflow-hidden border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
                    <button
                        onClick={() => setOpenDay(openDay === item.day ? null : item.day)}
                        className="w-full flex justify-between items-center p-4 text-left font-semibold text-white"
                    >
                        <span className="font-bold text-lg"><span className="text-[var(--accent-primary)]">{item.day}:</span> {item.title}</span>
                        <svg
                            className={`w-5 h-5 transform transition-transform duration-300 text-gray-400 ${openDay === item.day ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${openDay === item.day ? 'max-h-[1000px]' : 'max-h-0'}`}
                    >
                        <div className="p-6 pt-0 border-t border-white/10 mt-2">
                           <div className={`prose prose-sm max-w-none prose-invert`} dangerouslySetInnerHTML={{ __html: window.marked.parse(item.activities) }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
      <div className="text-center mt-12 space-x-4">
        <button
            onClick={onReset}
            className="py-4 px-10 bg-[var(--accent-secondary)] text-white font-bold rounded-full shadow-lg hover:brightness-110 transition-all transform hover:scale-105"
            style={{boxShadow: '0 4px 20px 0 var(--shadow-color-secondary)'}}
        >
            Plan Another Trip
        </button>
      </div>
    </div>
  );
};


const Loader: React.FC = () => {
    const texts = useMemo(() => ["Analyzing global travel trends...", "Checking flight availability...", "Curating hidden gems...", "Synthesizing your dream journey..."], []);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, 2000);
        return () => clearInterval(timer);
    }, [texts.length]);

    return (
        <div className="text-center relative z-10 flex flex-col items-center justify-center h-[50vh]">
            <div className="relative inline-block w-32 h-32 mb-8">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] animate-[pulse-orb_3s_ease-in-out_infinite] opacity-50 blur-xl absolute inset-0"></div>
                <div className="w-full h-full rounded-full border-4 border-[var(--accent-primary)] border-t-transparent animate-spin relative z-10"></div>
            </div>
            <h2 className="text-3xl font-bold text-white font-cinzel">Designing Your Blueprint</h2>
            <div className="planner-loader h-8 mt-4 relative w-full max-w-md">
                {texts.map((text, i) => (
                    <p key={i} className="absolute w-full text-center text-gray-300 text-lg" style={{ opacity: i === index ? 1 : 0, transition: 'opacity 0.5s', transform: i === index ? 'translateY(0)' : 'translateY(10px)' }}>
                        {text}
                    </p>
                ))}
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePrompt = `Create a breathtaking, cinematic, photorealistic 8k image of ${dest}. Wide angle, travel photography, golden hour lighting. If the destination is a region like 'UAE', show an iconic landmark representing it. If the destination is fictional or unrecognizable, generate a stunning, generic travel landscape representing exploration.`;
            
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: imagePrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            if (imageResponse.candidates?.[0]?.content?.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes = part.inlineData.data;
                        const generatedImageUrl = `data:image/png;base64,${base64ImageBytes}`;
                        setDynamicBg(generatedImageUrl);
                        break;
                    }
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // --- Generate Trip Poster Image FIRST to update background ---
            const imagePrompt = `Create a breathtaking, realistic travel photography style image of ${formData.destination}. Capture the essence of ${Array.from(formData.interests).join(', ')}. Cinematic lighting, 8k resolution, award winning photography. If the location is obscure or fictional, generate a stunning generic travel scene matching the vibe: ${formData.vibe}.`;

            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: imagePrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            if (imageResponse.candidates?.[0]?.content?.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes = part.inlineData.data;
                        const generatedImageUrl = `data:image/png;base64,${base64ImageBytes}`;
                        setImageUrl(generatedImageUrl);
                        setDynamicBg(generatedImageUrl); 
                        break;
                    }
                }
            }

            // --- Generate Itinerary Text ---
            const textResponseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
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
                    <div className="text-center animate-slide-in">
                        <h2 className="text-3xl font-bold mb-6 text-white">Where does your compass point?</h2>
                        <input 
                            type="text" 
                            value={formData.destination} 
                            onChange={e => setFormData({...formData, destination: e.target.value})} 
                            placeholder="e.g., Kyoto, Japan" 
                            className="w-full max-w-lg mx-auto bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-6 py-4 text-xl text-center text-white placeholder-gray-400 focus:ring-4 focus:ring-[var(--accent-secondary)]/50 focus:outline-none focus:border-[var(--accent-secondary)] transition-all shadow-xl" 
                        />
                        <button onClick={() => { setStep(2); fetchDestinationImage(formData.destination); }} disabled={!formData.destination} className="mt-8 py-4 px-12 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-bold rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 hover:shadow-cyan-500/50">Next Step &rarr;</button>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-slide-in w-full max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white">Logistics & Budget</h2>
                        <div className="mb-8">
                            <label className="block text-sm font-medium mb-3 text-gray-200">Trip Duration (Days)</label>
                            <input type="number" value={formData.duration} min="1" max="30" onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--accent-secondary)] focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-3 text-gray-200">Budget per person (USD)</label>
                            <input type="range" min="500" max="10000" step="100" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-secondary)]" />
                            <div className="text-center mt-3 font-bold text-2xl text-[var(--accent-primary)]">${parseInt(formData.budget).toLocaleString()}</div>
                        </div>
                         <div className="flex justify-between mt-10">
                            <button onClick={() => setStep(1)} className="text-gray-300 hover:text-white font-semibold">Back</button>
                            <button onClick={() => setStep(3)} className="py-2 px-8 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">Next</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="animate-slide-in w-full max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white">Choose Your Vibe</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {travelVibes.map(vibe => (
                                <button 
                                    key={vibe} 
                                    type="button" 
                                    onClick={() => handleVibeSelect(vibe)} 
                                    className={`p-5 text-left rounded-xl border transition-all duration-200 flex items-center justify-between ${formData.vibe === vibe ? 'bg-[var(--accent-secondary)]/80 border-[var(--accent-secondary)] text-white shadow-lg shadow-purple-900/50' : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10'}`}
                                >
                                    <span className="font-semibold text-lg">{vibe}</span>
                                    {formData.vibe === vibe && <div className="h-4 w-4 bg-white rounded-full"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-10">
                            <button onClick={() => setStep(2)} className="text-gray-300 hover:text-white font-semibold">Back</button>
                            <button onClick={() => setStep(4)} className="py-2 px-8 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">Next</button>
                        </div>
                    </div>
                );
            case 4:
                 return (
                    <div className="animate-slide-in w-full">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white">What fuels your wanderlust?</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {interestOptions.map(({name, icon}) => (
                                <button 
                                    key={name} 
                                    type="button" 
                                    onClick={() => handleInterestToggle(name)} 
                                    className={`p-4 flex flex-col items-center justify-center text-center rounded-xl border transition-all duration-200 aspect-square ${formData.interests.has(name) ? 'bg-[var(--accent-primary)]/80 border-[var(--accent-primary)] text-black font-bold shadow-lg shadow-cyan-900/50 transform scale-105' : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/30'}`}
                                >
                                    {icon}
                                    <span className="text-sm mt-2">{name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-10 items-center">
                            <button onClick={() => setStep(3)} className="text-gray-300 hover:text-white font-semibold">Back</button>
                            <button onClick={handleSubmit} disabled={isLoading} className="py-4 px-10 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-bold rounded-full shadow-xl shadow-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                                {isLoading ? 'Generating...' : 'Build My Blueprint'}
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
                    filter: isLoading || itinerary ? 'brightness(0.3) blur(10px)' : 'brightness(0.4)'
                }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 min-h-[70vh] flex flex-col justify-center">
                
                {isLoading || itinerary ? (
                    isLoading ? (
                        <Loader />
                    ) : (
                        <ItineraryDisplay itinerary={itinerary} imageUrl={imageUrl} onReset={handleReset} />
                    )
                ) : (
                     <div className="animate-fadeIn">
                        <div className="text-center mb-12">
                            <h1 className="text-5xl md:text-6xl font-black font-cinzel tracking-wider text-white drop-shadow-2xl">
                                AI Travel Architect
                            </h1>
                            <p className="mt-6 text-xl text-gray-200 font-light">
                                Design your dream adventure in seconds.
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                             {/* Progress Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                                <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500 ease-out" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                            </div>

                            <div className="w-full mt-4">
                                {renderStep()}
                            </div>
                        </div>
                        
                        {error && <div className="mt-8 text-center text-red-200 bg-red-900/50 border border-red-500/30 p-4 rounded-xl backdrop-blur-md">{error}</div>}
                     </div>
                )}
            </div>
        </div>
    );
};

export default AIPlannerPage;

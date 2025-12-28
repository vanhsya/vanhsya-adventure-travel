import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Chat } from "@google/genai";
import { Tour } from '../types';
import { decode, decodeAudioData } from '../utils/media';

// --- UI COMPONENTS ---

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center gap-2 text-purple-300">
        <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
        <span>AI is thinking...</span>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="p-3 bg-red-900/60 backdrop-blur-sm border border-red-500/80 text-red-200 rounded-lg text-sm shadow-lg shadow-red-900/50">
        <p className="font-bold mb-1">An Error Occurred</p>
        <p>{message}</p>
    </div>
);

// --- MAIN ASSISTANT COMPONENT ---

interface VRAssistantProps {
    onClose: () => void;
    tour?: Tour;
}

const VRAssistant: React.FC<VRAssistantProps> = ({ onClose, tour }) => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const [prompt, setPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string; sources?: any[] }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [useSearch, setUseSearch] = useState(true);
    const [useMaps, setUseMaps] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            setAi(genAI);
        } catch (e) {
            setError("Failed to initialize AI. Ensure API Key is configured.");
            console.error(e);
        }
    }, []);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const startNewChat = useCallback(() => {
        if (!ai) return;
        const model = 'gemini-2.5-flash';
        let tools: any[] = [];
        if (useSearch) tools.push({ googleSearch: {} });
        if (useMaps) tools.push({ googleMaps: {} });

        const systemInstruction = `You are a friendly and enthusiastic travel assistant for Vanhsya's VR Experience page. Your goal is to answer user questions about the virtual tours, destinations, and the VR technology itself. Be engaging and encourage users to explore the virtual experiences. If the user mentions a specific tour, tailor your responses to that tour if possible. Format your responses using Markdown for readability.`;
        
        const config: any = { systemInstruction };
        if (tools.length > 0) config.tools = tools;

        setChat(ai.chats.create({ model, config }));

        let initialMessage = "Welcome to the VR Experience! How can I help you explore today? Feel free to ask about our virtual destinations or the technology behind them.";
        if (tour) {
            initialMessage = `Welcome! I see you're looking at the ${tour.title} experience. What would you like to know about this virtual adventure in ${tour.city}?`;
        }
        setChatHistory([{ role: 'model', text: initialMessage }]);
    }, [ai, useSearch, useMaps, tour]);

    useEffect(() => {
        startNewChat();
    }, [startNewChat]);

    const handleSendMessage = useCallback(async () => {
        if (!prompt.trim() || !chat) return;
        
        setIsLoading(true);
        setError(null);
        
        const userMessage = prompt;
        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setPrompt('');

        try {
            const response = await chat.sendMessage({ message: userMessage });
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            setChatHistory(prev => [...prev, { role: 'model', text: response.text, sources }]);
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [chat, prompt]);
    
    const playTTS = async (text: string) => {
        if (!ai) return;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: { responseModalities: [Modality.AUDIO] },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            }
        } catch (e: any) {
            setError("TTS failed: " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fadeIn" aria-modal="true" role="dialog">
            <div className="w-full h-full max-w-4xl max-h-[90vh] flex flex-col bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/20">
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10">
                    <div>
                        <h2 className="font-cinzel text-xl text-pink-300">VR Experience Assistant</h2>
                        {tour && (
                            <p className="text-sm text-purple-300">Context: {tour.title}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors" aria-label="Close Assistant">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                    {chatHistory.map((entry, index) => (
                        <div key={index} className={`flex flex-col gap-2 ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-xl p-3 rounded-2xl ${entry.role === 'user' ? 'bg-pink-800/50 rounded-br-none' : 'bg-purple-800/50 rounded-bl-none'}`}>
                               <div className="prose prose-invert prose-sm text-white" dangerouslySetInnerHTML={{ __html: window.marked?.parse(entry.text) || entry.text.replace(/\n/g, '<br/>') }}></div>
                               {entry.role === 'model' && (
                                   <div className='flex items-center gap-4'>
                                        <button onClick={() => playTTS(entry.text)} className="mt-2 text-pink-300 hover:text-white transition-colors" aria-label="Read aloud">
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                        {entry.sources && entry.sources.length > 0 && (
                                           <div className="mt-2 border-l border-white/20 pl-2">
                                               <h4 className="text-xs font-bold text-purple-200 mb-1">Sources:</h4>
                                               <ul className="text-xs space-y-1">
                                                   {entry.sources.map((source: any, i: number) => (
                                                      <li key={i}><a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-pink-300 hover:underline">{source.web?.title || source.maps?.title}</a></li>
                                                   ))}
                                               </ul>
                                           </div>
                                       )}
                                   </div>
                               )}
                            </div>
                        </div>
                    ))}
                    {isLoading && <LoadingSpinner />}
                    {error && <ErrorDisplay message={error} />}
                </main>

                <footer className="flex-shrink-0 p-4 border-t border-white/10">
                     <div className="flex items-center gap-2 mb-2 text-xs">
                        <label className="flex items-center gap-1 cursor-pointer text-gray-300"><input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="accent-pink-500"/> Web Search</label>
                        <label className="flex items-center gap-1 cursor-pointer text-gray-300"><input type="checkbox" checked={useMaps} onChange={(e) => setUseMaps(e.target.checked)} className="accent-pink-500"/> Places Search</label>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()} placeholder="Ask about this experience..." className="w-full bg-black/30 border border-white/20 rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"/>
                        <button onClick={() => handleSendMessage()} disabled={isLoading || !prompt.trim()} className="bg-pink-600 px-5 rounded-lg hover:bg-pink-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default VRAssistant;

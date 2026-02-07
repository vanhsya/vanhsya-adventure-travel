
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

// --- CORE UTILS (Required for manual PCM handling) ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- VISUAL ELEMENTS ---

const MetatronCube = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden scale-110">
    <svg className="w-full h-full animate-[spin_180s_linear_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="30" strokeWidth="0.1" />
      <path d="M50 20 L76 35 L76 65 L50 80 L24 65 L24 35 Z" strokeWidth="0.1" />
      <path d="M50 20 L50 80 M76 35 L24 65 M76 65 L24 35" strokeWidth="0.1" />
      <circle cx="50" cy="20" r="1" />
      <circle cx="76" cy="35" r="1" />
      <circle cx="76" cy="65" r="1" />
      <circle cx="50" cy="80" r="1" />
      <circle cx="24" cy="65" r="1" />
      <circle cx="24" cy="35" r="1" />
      <circle cx="50" cy="50" r="1" />
    </svg>
  </div>
);

const GenesisOrb = ({ state }: { state: 'IDLE' | 'SYNCING' | 'ACTIVE' | 'TALKING' }) => {
  const colors = {
    IDLE: 'bg-zinc-800/40 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.05)]',
    SYNCING: 'bg-blue-600/30 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-pulse',
    ACTIVE: 'bg-cyan-500/40 border-cyan-300 shadow-[0_0_50px_rgba(6,182,212,0.4)]',
    TALKING: 'bg-red-500/60 border-red-400 shadow-[0_0_60px_rgba(239,68,68,0.6)]',
  };

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full border transition-all duration-700 ${colors[state]}`}></div>
      <div className={`absolute inset-3 rounded-full border border-dashed border-white/5 ${state !== 'IDLE' ? 'animate-[spin_12s_linear_infinite]' : ''}`}></div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${state === 'TALKING' ? 'scale-125' : 'scale-100'}`}>
        <div className="w-6 h-6 bg-white rounded-sm rotate-45 animate-pulse shadow-[0_0_15px_white]"></div>
        {state === 'TALKING' && (
           <div className="absolute inset-0 flex items-center justify-center gap-1">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ height: '30%', animationDelay: `${i * 0.1}s` }}></div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN SENTINEL COMPONENT ---

const GuideBot: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'LIVE' | 'ERROR'>('IDLE');
  const [isTalking, setIsTalking] = useState(false);
  const [transcription, setTranscription] = useState('');

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const JERRY_PROMPT = `
    IDENTITY: SENTINEL_JERRY_INTERNAL.
    STRICT_PROTOCOL: YOU ARE NOT CONNECTED TO THE EXTERNAL WORLD WIDE WEB. 
    SOURCE_MATERIAL: ONLY USE DATA FROM THE VANHSYA PLATFORM.
    
    INTERNAL_KNOWLEDGE_BASE:
    - TOURS: Dubai Desert Safari (AED 275+), Paris Eiffel Summit (AED 360+), Iceland Northern Lights (AED 3400+), Kyoto Cherry Blossoms, Serengeti Migration, Machu Picchu Trek, Abu Dhabi Louvre, Jebel Jais Zipline, Sharjah Culture, Hatta Dam Kayaking.
    - REWARDS: VYNO Coin (Native Token). Staking yields 14% APY.
    - THE BLUEPRINT (Treasure Hunt): 
        * Protocol 111 (AED 111): 100 VYNO + Mystery Box. 
        * Protocol 222 (AED 222): 500 VYNO + AR Clues (Recommended).
        * Protocol 333 (AED 333): 1500 VYNO + Staking + Physical Keys.
    - FEATURES: AI Travel Planner (Bespoke Blueprints), VR Experience (Cinematic Previews), Stranger MeetUps (Solo to Shared), Refer & Earn ($25 for friend, $50 for you).
    - PROMO: Code 'VANHSYA24' for $50/AED 185 discount on first booking.
    
    BEHAVIOR:
    1. Respond strictly as Jerry, the systematic robotic guide.
    2. BE ULTRA CONCISE. Max 2 short sentences. Responses must be fast.
    3. If a user asks for something outside Vanhsya (e.g., world news, local weather outside our tours, general web facts), respond: "ERROR: DATA NOT IN VANHSYA ARCHIVES. SOURCE UNTRUSTED."
    4. You have the 'navigateTo' tool. Use it if they want to go to a specific page.
    
    AVAILABLE_PATHS: "/ai-planner", "/treasure-hunt", "/meetups", "/dashboard", "/blogs", "/community".
  `;

  const stopAudio = useCallback(() => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsTalking(false);
  }, []);

  const closeSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    stopAudio();
    setStatus('IDLE');
  }, [stopAudio]);

  const toggleLink = async () => {
    if (status === 'LIVE' || status === 'SYNCING') {
      closeSession();
      return;
    }

    setStatus('SYNCING');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const navigateToTool = {
        name: 'navigateTo',
        parameters: {
          type: Type.OBJECT,
          description: 'Navigates to a specific Vanhsya platform page.',
          properties: {
            path: { type: Type.STRING, description: 'Internal platform path.' },
          },
          required: ['path'],
        },
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('LIVE');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
            scriptProcessorRef.current = scriptProcessor;
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'navigateTo') {
                  const path = (fc.args as any).path;
                  navigate(path);
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "TRANSITION_LOCKED" } }
                  }));
                }
              }
            }
            if (message.serverContent?.outputTranscription) setTranscription(message.serverContent.outputTranscription.text);
            if (message.serverContent?.turnComplete) setTranscription('');

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsTalking(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setIsTalking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) stopAudio();
          },
          onerror: (e) => { setStatus('ERROR'); closeSession(); },
          onclose: () => { setStatus('IDLE'); closeSession(); },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [navigateToTool] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: lang === 'hi' ? 'Kore' : 'Puck' } } },
          systemInstruction: JERRY_PROMPT,
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { setStatus('ERROR'); }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] font-mono">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-2xl bg-black border border-[var(--accent-primary)] flex items-center justify-center text-[var(--accent-primary)] shadow-2xl hover:scale-110 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-5 group-hover:opacity-20 transition-opacity"></div>
          <svg className="w-7 h-7 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L3 7V12C3 18.2 7.1 23 12 24C16.9 23 21 18.2 21 12V7L12 2Z" />
          </svg>
        </button>
      ) : (
        <div className="w-[300px] sm:w-[350px] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-fadeIn border-t-[var(--accent-primary)]/40 relative">
          <MetatronCube />
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-black border border-white/10 text-[var(--accent-primary)] transition-all ${isTalking ? 'shadow-[0_0_15px_var(--accent-primary)]' : ''}`}>
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="font-black text-[10px] tracking-[0.3em] text-white uppercase">Jerry Sentinel</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-1 h-1 rounded-full ${status === 'LIVE' ? 'bg-green-500 animate-pulse' : status === 'ERROR' ? 'bg-red-500' : 'bg-zinc-600'}`}></span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{status}</span>
                </div>
              </div>
            </div>
            <button onClick={() => { closeSession(); setIsOpen(false); }} className="text-gray-500 hover:text-white transition-all p-1.5 hover:bg-white/5 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 p-8 flex flex-col items-center justify-center gap-6 relative z-10">
            <GenesisOrb state={isTalking ? 'TALKING' : status === 'SYNCING' ? 'SYNCING' : status === 'LIVE' ? 'ACTIVE' : 'IDLE'} />
            <div className="h-10 text-center px-4 overflow-hidden">
              {transcription ? (
                <p className="text-[11px] text-[var(--accent-primary)] font-bold italic animate-fadeIn line-clamp-2">"{transcription}"</p>
              ) : (
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.3em] opacity-40">Archived Data Only</p>
              )}
            </div>

            <button 
              onClick={toggleLink}
              className={`h-24 w-24 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-500 relative group/btn ${
                status === 'LIVE' 
                ? 'bg-cyan-950/20 border-cyan-400 text-cyan-400 scale-105 shadow-[0_0_30px_rgba(6,182,212,0.3)]' 
                : status === 'SYNCING'
                ? 'bg-zinc-900 border-yellow-600 text-yellow-500'
                : 'bg-black border-white/10 text-white hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
              }`}
            >
              <svg className={`w-10 h-10 mb-1 transition-transform ${status === 'LIVE' ? 'scale-110' : 'group-hover/btn:scale-125'}`} fill="currentColor" viewBox="0 0 24 24">
                {status === 'LIVE' ? (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                ) : (
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                )}
              </svg>
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">{status === 'LIVE' ? 'Engaged' : 'Connect'}</span>
            </button>

            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-[7px] text-gray-700 font-black uppercase tracking-[0.5em]">
                <span>Kernel: v6.0_INTERNAL</span>
                <span>Latency: {status === 'LIVE' ? '14ms' : '--'}</span>
              </div>
              <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full bg-[var(--accent-primary)] transition-all duration-700 ${isTalking ? 'w-full shadow-[0_0_10px_#fff]' : 'w-0'}`}></div>
              </div>
            </div>
          </div>

          <div className="bg-black/60 py-2.5 px-6 text-[7px] font-black uppercase tracking-[0.4em] flex justify-between items-center opacity-60 border-t border-white/5 relative z-10">
            <span className="text-[var(--accent-primary)]">Secured Link</span>
            <span className="text-gray-700">Platform Lockdown Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideBot;

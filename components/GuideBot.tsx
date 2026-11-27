import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { BRAND_CONTACTS, buildWhatsAppDirectEnquiryUrl } from '../utils/utm';

// --- CORE AUDIO UTILS (16kHz PCM input -> 24kHz PCM output) ---

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
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
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 2));
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

function createBlobData(data: Float32Array): string {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const clamped = Math.max(-1, Math.min(1, data[i]));
    int16[i] = clamped * 32767;
  }
  return encode(new Uint8Array(int16.buffer));
}

// --- LANGUAGE, NAVIGATION, VOICE & SLANG CATALOGS ---

interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  uiLangSync?: 'en' | 'es' | 'hi' | 'ar';
}

const WORLD_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Auto-Detect Any Language', nativeLabel: 'Global Auto' },
  { code: 'en', label: 'English', nativeLabel: 'English', uiLangSync: 'en' },
  { code: 'ar', label: 'Arabic (UAE & Gulf)', nativeLabel: 'العربية', uiLangSync: 'ar' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', uiLangSync: 'hi' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', uiLangSync: 'es' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'zh', label: 'Mandarin Chinese', nativeLabel: '中文' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'tl', label: 'Tagalog / Filipino', nativeLabel: 'Tagalog' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'id', label: 'Indonesian / Malay', nativeLabel: 'Bahasa' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
];

const VOICE_PERSONAS = [
  { id: 'Zephyr', label: 'Zephyr', tone: 'Crisp & Welcoming' },
  { id: 'Kore', label: 'Kore', tone: 'Warm & Cultured' },
  { id: 'Puck', label: 'Puck', tone: 'Playful & Energetic' },
  { id: 'Charon', label: 'Charon', tone: 'Deep Executive' },
  { id: 'Fenrir', label: 'Fenrir', tone: 'Bold Explorer' },
] as const;

const VOICE_CADENCES = [
  { id: 'natural', label: 'Natural', rate: 1.0 },
  { id: 'luxury-calm', label: 'Calm Luxury', rate: 0.93 },
  { id: 'energetic', label: 'Fast & Upbeat', rate: 1.09 },
  { id: 'storyteller', label: 'Storyteller', rate: 0.96 },
] as const;

const SLANG_MODULATIONS = [
  { id: 'standard', label: 'Standard Luxury', hint: 'Clear international hospitality' },
  { id: 'uae-khaleeji', label: 'UAE Khaleeji', hint: 'Marhaba, Yalla & Gulf warmth' },
  { id: 'egyptian-masri', label: 'Egyptian Masri', hint: 'Ahlan & vibrant Cairo cadence' },
  { id: 'levantine', label: 'Levantine Shami', hint: 'Warm Ahla w sahla tone' },
  { id: 'hinglish-desi', label: 'Hinglish / Desi', hint: 'Friendly South Asian mix' },
  { id: 'taglish', label: 'Taglish / Manila', hint: 'Tara! Warm Filipino mix' },
  { id: 'japanese-casual', label: 'Tokyo Casual', hint: 'Friendly modern Japanese' },
  { id: 'parisian-street', label: 'Parisian Street', hint: 'Chic conversational French' },
  { id: 'british-aussie', label: 'British / Aussie', hint: 'Witty Commonwealth banter' },
  { id: 'nigerian-pidgin', label: 'Nigerian Pidgin', hint: 'Expressive West African warmth' },
  { id: 'local-street', label: 'Local Street Slang', hint: 'Authentic native idioms' },
  { id: 'genz-social', label: 'Social Club Chill', hint: 'Upbeat Stranger MeetUps vibe' },
  { id: 'executive', label: 'VIP Executive', hint: 'Polished diplomatic protocol' },
] as const;

const QUICK_NAV_ITEMS = [
  { label: 'Book Travel', path: '/book' },
  { label: 'Ventures & Surprises', path: '/ventures' },
  { label: 'The Blueprint', path: '/treasure-hunt' },
  { label: 'MeetUps', path: '/meetups' },
  { label: 'Social Club', path: '/social-club' },
  { label: 'AI Planner', path: '/ai-planner' },
  { label: 'VR Globe', path: '/vr-experience' },
  { label: 'Web3 Verify', path: '/vyno' },
  { label: 'Desert Safari', path: '/tours/dubai-desert-safari' },
  { label: 'Community', path: '/community' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Partners', path: '/partners/apply' },
];

const TRANSLATOR_PHRASE_PRESETS = [
  'Hello! Nice to meet you at Vanhsya Social Club.',
  'Where is tonight’s Stranger MeetUp venue in Dubai?',
  'Can we book the Dubai Desert Safari via WhatsApp?',
  'Life Begins With a Hello — Come alone. Explore together.',
];

interface ChatItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  links?: Array<{ label: string; path: string }>;
}

interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage: string;
  phoneticGuide: string;
  culturalNuanceTip: string;
}

// --- ANIMATED VISUALS ---

const CosmicSacredBackdrop = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none overflow-hidden scale-125">
    <svg className="w-full h-full animate-vanhsya-orbit" viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="36" strokeWidth="0.25" strokeDasharray="2 2" />
      <circle cx="50" cy="50" r="24" strokeWidth="0.2" />
      <path d="M50 14 L81 32 L81 68 L50 86 L19 68 L19 32 Z" strokeWidth="0.25" />
      <path d="M50 14 L50 86 M81 32 L19 68 M81 68 L19 32" strokeWidth="0.2" />
      <circle cx="50" cy="14" r="1.1" fill="currentColor" />
      <circle cx="81" cy="32" r="1.1" fill="currentColor" />
      <circle cx="81" cy="68" r="1.1" fill="currentColor" />
      <circle cx="50" cy="86" r="1.1" fill="currentColor" />
      <circle cx="19" cy="68" r="1.1" fill="currentColor" />
      <circle cx="19" cy="32" r="1.1" fill="currentColor" />
    </svg>
  </div>
);

const VanhsyaOrb: React.FC<{
  state: 'IDLE' | 'SYNCING' | 'ACTIVE' | 'TALKING' | 'TRANSLATING';
}> = ({ state }) => {
  const palette = {
    IDLE: 'bg-purple-950/50 border-purple-400/30 shadow-[0_0_25px_rgba(138,43,226,0.22)]',
    SYNCING: 'bg-amber-900/40 border-amber-400/70 shadow-[0_0_38px_rgba(245,158,11,0.45)] animate-pulse',
    ACTIVE: 'bg-cyan-950/50 border-cyan-400/80 shadow-[0_0_45px_rgba(0,242,254,0.45)]',
    TRANSLATING: 'bg-emerald-950/50 border-emerald-400/80 shadow-[0_0_45px_rgba(16,185,129,0.5)]',
    TALKING: 'bg-fuchsia-700/50 border-purple-300 shadow-[0_0_60px_rgba(168,85,247,0.75)]',
  };

  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-purple-600/20 via-cyan-400/15 to-fuchsia-500/20 blur-md animate-vanhsya-aurora" />
      <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${palette[state]}`} />
      <div
        className={`absolute inset-2 rounded-full border border-dashed border-cyan-300/35 ${
          state === 'IDLE' ? 'animate-vanhsya-orbit' : 'animate-vanhsya-orbit-reverse'
        }`}
      />
      <div className="relative w-14 h-14 rounded-full bg-black/70 border border-white/15 flex items-center justify-center overflow-hidden">
        {state === 'TALKING' || state === 'ACTIVE' || state === 'TRANSLATING' ? (
          <div className="flex items-end justify-center gap-1 h-7">
            {[0.45, 0.9, 0.65, 1, 0.55].map((heightRatio, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full animate-vanhsya-bar ${
                  state === 'TRANSLATING'
                    ? 'bg-emerald-300'
                    : state === 'TALKING'
                    ? 'bg-purple-300'
                    : 'bg-cyan-300'
                }`}
                style={{
                  height: `${Math.round(heightRatio * 24)}px`,
                  animationDelay: `${idx * 0.14}s`,
                  animationDuration: state === 'TALKING' ? '0.62s' : '1.15s',
                }}
              />
            ))}
          </div>
        ) : (
          <span className="font-cinzel font-black text-xl tracking-wider bg-gradient-to-br from-purple-300 via-white to-cyan-300 bg-clip-text text-transparent">
            VX
          </span>
        )}
      </div>
    </div>
  );
};

// --- MAIN VANHSYA TRAVELS X COMPONENT ---

const STORAGE_MODULATION_KEY = 'vanhsya-x-modulation-v1';

const GuideBot: React.FC = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'concierge' | 'translator'>('concierge');
  const [showModulationDrawer, setShowModulationDrawer] = useState(false);

  // Voice & Slang Modulation State (persisted)
  const [voiceName, setVoiceName] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_MODULATION_KEY) || '{}');
      return saved.voiceName || 'Zephyr';
    } catch {
      return 'Zephyr';
    }
  });
  const [voiceCadence, setVoiceCadence] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_MODULATION_KEY) || '{}');
      return saved.voiceCadence || 'natural';
    } catch {
      return 'natural';
    }
  });
  const [slangStyle, setSlangStyle] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_MODULATION_KEY) || '{}');
      return saved.slangStyle || 'standard';
    } catch {
      return 'standard';
    }
  });
  const [customModulation, setCustomModulation] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_MODULATION_KEY) || '{}');
      return saved.customModulation || '';
    } catch {
      return '';
    }
  });

  // Language State
  const [conciergeLang, setConciergeLang] = useState<string>(lang || 'auto');
  const [sourceLang, setSourceLang] = useState<string>('Auto-Detect Any Language');
  const [targetLangCode, setTargetLangCode] = useState<string>('ar');
  const [customTargetLang, setCustomTargetLang] = useState<string>('');

  // Live Voice Session State
  const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'LIVE' | 'ERROR'>('IDLE');
  const [liveSessionMode, setLiveSessionMode] = useState<'concierge' | 'translate'>('concierge');
  const [liveError, setLiveError] = useState<string>('');
  const [isTalking, setIsTalking] = useState(false);
  const [heardTranscript, setHeardTranscript] = useState('');
  const [spokenTranscript, setSpokenTranscript] = useState('');

  // Text Concierge State
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Welcome to Vanhsya Travels X. Speak or type in any language for tour insights, live translations, or instant navigation across Vanhsya.',
      links: [
        { label: 'The Blueprint', path: '/treasure-hunt' },
        { label: 'MeetUps', path: '/meetups' },
        { label: 'Social Club', path: '/social-club' },
      ],
    },
  ]);

  // Text & Audio Translator State
  const [translateInput, setTranslateInput] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [sourceTranscriptDisplay, setSourceTranscriptDisplay] = useState('');
  const [isRecordingPush, setIsRecordingPush] = useState(false);
  const [voiceTranslateLoading, setVoiceTranslateLoading] = useState(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  // Audio / WS Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const hasLiveErrorRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(1.0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rate = VOICE_CADENCES.find((c) => c.id === voiceCadence)?.rate ?? 1.0;
    playbackRateRef.current = rate;
    try {
      localStorage.setItem(
        STORAGE_MODULATION_KEY,
        JSON.stringify({ voiceName, voiceCadence, slangStyle, customModulation })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [voiceName, voiceCadence, slangStyle, customModulation]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, activeTab]);

  const stopAudio = useCallback(() => {
    audioSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsTalking(false);
  }, []);

  const closeSession = useCallback((finalStatus: 'IDLE' | 'ERROR' = 'IDLE') => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    stopAudio();
    setStatus(finalStatus);
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      closeSession();
    };
  }, [closeSession]);

  const resolvedTargetLanguageObj =
    WORLD_LANGUAGES.find((l) => l.code === targetLangCode) || WORLD_LANGUAGES[2];
  const resolvedTargetLanguageLabel =
    customTargetLang.trim() || resolvedTargetLanguageObj.label;

  const resolvedConciergeLanguageLabel =
    conciergeLang === 'auto'
      ? 'auto'
      : WORLD_LANGUAGES.find((l) => l.code === conciergeLang)?.label || conciergeLang;

  const handleConciergeLangChange = (code: string) => {
    setConciergeLang(code);
    const match = WORLD_LANGUAGES.find((l) => l.code === code);
    if (match?.uiLangSync && match.uiLangSync !== lang) {
      setLang(match.uiLangSync);
    }
  };

  const handleQuickNavigate = (path: string) => {
    navigate(path);
  };

  // Start Live Audio WebSocket Session (Concierge OR Speech-to-Speech Translator)
  const startLiveSession = async (requestedMode: 'concierge' | 'translate') => {
    if (status === 'LIVE' || status === 'SYNCING') {
      const sameMode = liveSessionMode === requestedMode;
      closeSession();
      if (sameMode) return;
    }

    hasLiveErrorRef.current = false;
    setLiveError('');
    setHeardTranscript('');
    setSpokenTranscript('');
    setLiveSessionMode(requestedMode);
    setStatus('SYNCING');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      if (inputAudioContextRef.current.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({
        mode: requestedMode,
        voice: voiceName,
        lang: resolvedConciergeLanguageLabel,
        targetCode: targetLangCode === 'auto' ? 'en' : targetLangCode,
        targetLabel: resolvedTargetLanguageLabel,
        style: voiceCadence,
        slang: slangStyle,
        customStyle: customModulation.trim(),
      });

      const wsUrl = `${protocol}//${window.location.host}/live?${params.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('LIVE');
        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);

        scriptProcessor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBase64 = createBlobData(inputData);
            ws.send(JSON.stringify({ audio: pcmBase64 }));
          }
        };

        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContextRef.current!.destination);
        scriptProcessorRef.current = scriptProcessor;
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.toolCall) {
            const functionResponses: any[] = [];
            for (const fc of message.toolCall.functionCalls || []) {
              if (fc.name === 'navigateTo') {
                const path = (fc.args as any)?.path;
                if (path) {
                  navigate(path);
                }
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result: `Navigated user to ${path}` },
                });
              }
            }
            if (ws.readyState === WebSocket.OPEN && functionResponses.length > 0) {
              ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
            }
          }

          if (message.inputTranscript) {
            setHeardTranscript((prev) => `${prev ? prev + ' ' : ''}${message.inputTranscript}`.slice(-180));
          }
          if (message.transcription) {
            setSpokenTranscript(message.transcription);
          }
          if (message.turnComplete) {
            setTimeout(() => setHeardTranscript(''), 3500);
          }

          if (message.audio) {
            setIsTalking(true);
            const ctx = outputAudioContextRef.current!;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decode(message.audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = playbackRateRef.current;
            source.connect(ctx.destination);
            source.onended = () => {
              audioSourcesRef.current.delete(source);
              if (audioSourcesRef.current.size === 0) setIsTalking(false);
            };
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration / playbackRateRef.current;
            audioSourcesRef.current.add(source);
          }

          if (message.interrupted) {
            stopAudio();
          }

          if (message.error) {
            hasLiveErrorRef.current = true;
            setLiveError(message.error);
            closeSession('ERROR');
          }
        } catch (err) {
          console.error('Error parsing Vanhsya X Live WS message:', err);
        }
      };

      ws.onerror = () => {
        hasLiveErrorRef.current = true;
        setLiveError('Unable to reach Vanhsya X Live Voice service.');
        closeSession('ERROR');
      };

      ws.onclose = () => {
        closeSession(hasLiveErrorRef.current ? 'ERROR' : 'IDLE');
      };
    } catch {
      setLiveError('Microphone permission is required for live voice. Use text chat or translator below anytime.');
      setStatus('ERROR');
    }
  };

  // Text Concierge + Intelligent Navigation
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const userMsg: ChatItem = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const nextHistory = [...chatHistory, userMsg].slice(-8);
    setChatHistory(nextHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          targetLang: resolvedConciergeLanguageLabel,
          voiceStyle: voiceCadence,
          slangStyle,
          customStyle: customModulation,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to connect to Vanhsya X.');
      }

      if (data.navigateToPath && data.navigateToPath.startsWith('/')) {
        navigate(data.navigateToPath);
      }

      setChatHistory((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply,
          links: Array.isArray(data.suggestedLinks) ? data.suggestedLinks : [],
        },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: err?.message || 'Could not process request right now.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Instant Text & Slang Translator
  const handleTranslateText = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const input = (overrideText ?? translateInput).trim();
    if (!input || translating) return;
    if (overrideText) setTranslateInput(overrideText);

    setTranslating(true);
    setTranslationError('');
    try {
      const response = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          sourceLang,
          targetLang: resolvedTargetLanguageLabel,
          slangStyle,
          voiceStyle: voiceCadence,
          customStyle: customModulation,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Translation error');
      }
      setTranslationResult(data);
    } catch (err: any) {
      setTranslationError(err?.message || 'Unable to translate right now.');
    } finally {
      setTranslating(false);
    }
  };

  // TTS Audio Playback (for Translated Text OR Voice Modulation Preview)
  const speakTextWithModulation = async (textToSpeak: string) => {
    if (!textToSpeak.trim() || isSpeakingTts) return;
    setIsSpeakingTts(true);
    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voiceName }),
      });
      const data = await response.json();
      if (!response.ok || !data.audio) {
        throw new Error(data.error || 'Speech synthesis unavailable.');
      }

      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      const ctx = outputAudioContextRef.current;
      const bytes = decode(data.audio);
      let buffer: AudioBuffer;
      try {
        buffer = await ctx.decodeAudioData(bytes.slice().buffer);
      } catch {
        buffer = await decodeAudioData(bytes, ctx, 24000, 1);
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = playbackRateRef.current;
      src.connect(ctx.destination);
      src.onended = () => setIsSpeakingTts(false);
      src.start();
    } catch (err: any) {
      setTranslationError(err?.message || 'Voice playback failed.');
      setIsSpeakingTts(false);
    }
  };

  // Push-to-Speak MediaRecorder Audio Translation Fallback (works reliably in any browser)
  const playBase64AudioClip = async (base64Data: string) => {
    try {
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }
      const ctx = outputAudioContextRef.current;
      const bytes = decode(base64Data);
      let buffer: AudioBuffer;
      try {
        buffer = await ctx.decodeAudioData(bytes.slice().buffer);
      } catch {
        buffer = await decodeAudioData(bytes, ctx, 24000, 1);
      }
      setIsSpeakingTts(true);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = playbackRateRef.current;
      src.connect(ctx.destination);
      src.onended = () => setIsSpeakingTts(false);
      src.start();
    } catch {
      setIsSpeakingTts(false);
    }
  };

  const handleTogglePushToSpeak = async () => {
    if (isRecordingPush && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingPush(false);
      return;
    }

    setTranslationError('');
    setSourceTranscriptDisplay('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 256) {
          setTranslationError('Recording too short. Tap Record Voice and speak for 2+ seconds.');
          return;
        }
        setVoiceTranslateLoading(true);
        try {
          const buf = await blob.arrayBuffer();
          const audioBase64 = encode(new Uint8Array(buf));
          const res = await fetch('/api/gemini/voice-translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              mimeType: mimeType.split(';')[0],
              targetLang: resolvedTargetLanguageLabel,
              slangStyle,
              voiceStyle: voiceCadence,
              customStyle: customModulation,
              voiceName,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Voice translation failed.');
          }
          if (data.sourceTranscript) {
            setSourceTranscriptDisplay(data.sourceTranscript);
            setTranslateInput(data.sourceTranscript);
          }
          setTranslationResult({
            translatedText: data.translatedText || '',
            detectedSourceLanguage: data.detectedSourceLanguage || 'Auto-Detected',
            phoneticGuide: data.phoneticGuide || '',
            culturalNuanceTip: data.culturalNuanceTip || '',
          });
          if (data.audio) {
            await playBase64AudioClip(data.audio);
          }
        } catch (err: any) {
          setTranslationError(err?.message || 'Unable to translate recorded speech.');
        } finally {
          setVoiceTranslateLoading(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingPush(true);
    } catch {
      setTranslationError('Microphone access is needed for voice recording. You can also type any phrase below.');
    }
  };

  const orbVisualState = isTalking
    ? 'TALKING'
    : status === 'SYNCING'
    ? 'SYNCING'
    : status === 'LIVE'
    ? liveSessionMode === 'translate'
      ? 'TRANSLATING'
      : 'ACTIVE'
    : 'IDLE';

  const activeSlangObj =
    SLANG_MODULATIONS.find((s) => s.id === slangStyle) || SLANG_MODULATIONS[0];

  return (
    <div className="fixed bottom-4 right-4 z-[100] font-inter">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Vanhsya Travels X AI Concierge and Translator"
          className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#110B1F]/95 backdrop-blur-xl border border-purple-400/45 text-white shadow-[0_12px_40px_rgba(138,43,226,0.45)] hover:scale-105 transition-all duration-300"
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/40 to-cyan-500/30 border border-purple-300/40">
            <span className="absolute inset-0 rounded-xl border border-dashed border-cyan-300/40 animate-vanhsya-orbit" />
            <span className="font-cinzel font-black text-sm tracking-wider bg-gradient-to-r from-purple-200 to-cyan-200 bg-clip-text text-transparent">
              VX
            </span>
          </span>
          <span className="text-left leading-tight hidden sm:block pr-1">
            <span className="block text-[11px] font-cinzel font-black tracking-[0.16em] text-white uppercase">
              Vanhsya Travels X
            </span>
            <span className="block text-[10px] text-cyan-300 font-medium">
              AI Guide &bull; Live Translator
            </span>
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
        </button>
      ) : (
        <div className="w-[345px] sm:w-[415px] max-h-[86vh] bg-[#0B0815]/95 backdrop-blur-3xl border border-purple-400/35 rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden animate-fadeIn relative">
          <CosmicSacredBackdrop />

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-black/50 flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600/35 to-cyan-500/25 border border-purple-400/40 flex items-center justify-center shrink-0 transition-all ${
                  isTalking ? 'shadow-[0_0_20px_rgba(168,85,247,0.8)] scale-105' : ''
                }`}
              >
                <span className="font-cinzel font-black text-sm text-white">VX</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-cinzel font-black text-xs tracking-[0.16em] text-white uppercase truncate">
                  Vanhsya Travels X
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'LIVE'
                        ? 'bg-emerald-400 animate-pulse'
                        : status === 'SYNCING'
                        ? 'bg-amber-400 animate-pulse'
                        : status === 'ERROR'
                        ? 'bg-rose-400'
                        : 'bg-purple-400'
                    }`}
                  />
                  <span className="text-[10px] text-gray-300 font-medium truncate">
                    {status === 'LIVE'
                      ? liveSessionMode === 'translate'
                        ? 'Live Voice Interpreter'
                        : `Live Voice · ${voiceName}`
                      : `${voiceName} · ${activeSlangObj.label}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowModulationDrawer((v) => !v)}
                title="Voice & Slang Modulation Studio"
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                  showModulationDrawer
                    ? 'bg-purple-600/35 border-purple-400 text-white'
                    : 'bg-white/5 border-white/15 text-purple-200 hover:bg-white/10'
                }`}
              >
                Voice &amp; Slang
              </button>
              <button
                type="button"
                onClick={() => {
                  closeSession();
                  setIsOpen(false);
                }}
                aria-label="Close Vanhsya Travels X"
                className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 px-4 pt-3 pb-2 bg-black/30 border-b border-white/5 relative z-10">
            <button
              type="button"
              onClick={() => setActiveTab('concierge')}
              className={`py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === 'concierge'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-md'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              X Concierge &amp; Nav
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('translator')}
              className={`py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === 'translator'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              All-Language Translator
            </button>
          </div>

          {/* Voice & Slang Modulation Studio (Collapsible Drawer) */}
          {showModulationDrawer && (
            <div className="px-4 py-3.5 bg-[#140E24] border-b border-purple-400/25 space-y-3 text-xs relative z-10 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                  Voice &amp; Slang Modulation Studio
                </span>
                <button
                  type="button"
                  disabled={isSpeakingTts}
                  onClick={() =>
                    speakTextWithModulation(
                      `Marhaba from Vanhsya Travels X! Welcome to ${BRAND_CONTACTS.clubName}, where Life Begins With a Hello.`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 font-semibold text-[10px]"
                >
                  {isSpeakingTts ? 'Playing...' : 'Preview Voice'}
                </button>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Voice Persona</p>
                <div className="flex flex-wrap gap-1.5">
                  {VOICE_PERSONAS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVoiceName(v.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
                        voiceName === v.id
                          ? 'bg-purple-600 border-purple-400 text-white font-semibold'
                          : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Cadence &amp; Speed</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {VOICE_CADENCES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setVoiceCadence(c.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] border transition-colors ${
                        voiceCadence === c.id
                          ? 'bg-cyan-600/35 border-cyan-400 text-cyan-100 font-semibold'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Slang &amp; Dialect Style</p>
                <div className="flex flex-wrap gap-1.5">
                  {SLANG_MODULATIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.hint}
                      onClick={() => setSlangStyle(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
                        slangStyle === s.id
                          ? 'bg-emerald-600/35 border-emerald-400 text-emerald-100 font-semibold'
                          : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={customModulation}
                  onChange={(e) => setCustomModulation(e.target.value)}
                  maxLength={140}
                  placeholder="Optional custom dialect/vibe (e.g. 'Dubai Marina friendly host')"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
            {activeTab === 'concierge' ? (
              <>
                {/* Animated Visualizer + Live Voice Control */}
                <div className="p-3.5 rounded-2xl bg-black/45 border border-white/10 flex items-center gap-4">
                  <VanhsyaOrb state={orbVisualState} />

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={conciergeLang}
                        onChange={(e) => handleConciergeLangChange(e.target.value)}
                        aria-label="Concierge Language"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#140F22] border border-purple-400/30 text-[11px] text-white focus:outline-none"
                      >
                        {WORLD_LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label} ({l.nativeLabel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => startLiveSession('concierge')}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                        status === 'LIVE' && liveSessionMode === 'concierge'
                          ? 'bg-rose-600/80 border-rose-400 text-white'
                          : 'bg-gradient-to-r from-purple-600/80 to-cyan-600/80 border-purple-300/40 text-white hover:opacity-95'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === 'LIVE' && liveSessionMode === 'concierge'
                            ? 'bg-white animate-ping'
                            : 'bg-cyan-300'
                        }`}
                      />
                      {status === 'SYNCING' && liveSessionMode === 'concierge'
                        ? 'Connecting Mic...'
                        : status === 'LIVE' && liveSessionMode === 'concierge'
                        ? 'Stop Live Voice'
                        : 'Talk Live With Vanhsya X'}
                    </button>

                    {(heardTranscript || spokenTranscript) && liveSessionMode === 'concierge' && (
                      <p className="text-[11px] text-cyan-200 italic line-clamp-2 leading-snug">
                        {spokenTranscript || `Heard: "${heardTranscript}"`}
                      </p>
                    )}
                  </div>
                </div>

                {liveError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-200">
                    {liveError}
                  </div>
                )}

                {/* Concierge Chat Thread */}
                <div
                  ref={chatScrollRef}
                  className="space-y-2.5 max-h-48 overflow-y-auto pr-1"
                >
                  {chatHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        item.role === 'user'
                          ? 'bg-purple-600/25 border border-purple-400/30 text-white ml-6'
                          : 'bg-white/5 border border-white/10 text-gray-200 mr-4'
                      }`}
                    >
                      <p>{item.text}</p>
                      {item.links && item.links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.links.map((lk) => (
                            <button
                              key={`${item.id}-${lk.path}`}
                              type="button"
                              onClick={() => handleQuickNavigate(lk.path)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/35 text-[10px] font-semibold transition-colors"
                            >
                              Go to {lk.label} &rarr;
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-purple-300 animate-pulse mr-6">
                      Vanhsya X is preparing your guide...
                    </div>
                  )}
                </div>

                {/* Ask or Voice-Navigate by Text */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything or say 'Open The Blueprint'..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 shrink-0"
                  >
                    Ask
                  </button>
                </form>

                {/* Quick Platform Navigator Pills */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      Quick Platform Navigation
                    </span>
                    <a
                      href={buildWhatsAppDirectEnquiryUrl(
                        'Hello Vanhsya Travels X Concierge, I need direct booking assistance.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 underline"
                    >
                      WhatsApp {BRAND_CONTACTS.whatsappDisplay}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NAV_ITEMS.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleQuickNavigate(item.path)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-400/40 text-[10px] text-gray-200 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* --- TAB 2: ALL-LANGUAGE LIVE + TEXT TRANSLATOR --- */
              <div className="space-y-3.5">
                {/* Language Pair Bar */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">From</label>
                    <select
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#140F22] border border-white/15 text-[11px] text-white focus:outline-none"
                    >
                      {WORLD_LANGUAGES.map((l) => (
                        <option key={`src-${l.code}`} value={l.label}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Translate To</label>
                    <select
                      value={targetLangCode}
                      onChange={(e) => {
                        setTargetLangCode(e.target.value);
                        setCustomTargetLang('');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#140F22] border border-cyan-400/35 text-[11px] text-white focus:outline-none"
                    >
                      {WORLD_LANGUAGES.filter((l) => l.code !== 'auto').map((l) => (
                        <option key={`tgt-${l.code}`} value={l.code}>
                          {l.label} ({l.nativeLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom language support for ANY dialect or world language */}
                <input
                  type="text"
                  value={customTargetLang}
                  onChange={(e) => setCustomTargetLang(e.target.value)}
                  placeholder="Or type ANY language/dialect (e.g. Emirati Arabic, Swiss German, Swahili)..."
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />

                {/* Real-Time Speech-to-Speech Live Interpreter */}
                <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-300">
                        Live Voice Interpreter
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Speak naturally &rarr; real-time audio into {resolvedTargetLanguageObj.label}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleTogglePushToSpeak}
                        disabled={voiceTranslateLoading}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-colors shrink-0 ${
                          isRecordingPush
                            ? 'bg-amber-500 text-black animate-pulse'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {voiceTranslateLoading
                          ? 'Translating...'
                          : isRecordingPush
                          ? 'Stop & Translate'
                          : 'Record Clip'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startLiveSession('translate')}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-colors shrink-0 ${
                          status === 'LIVE' && liveSessionMode === 'translate'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {status === 'SYNCING' && liveSessionMode === 'translate'
                          ? 'Connecting...'
                          : status === 'LIVE' && liveSessionMode === 'translate'
                          ? 'Stop Mic'
                          : 'Speak Live'}
                      </button>
                    </div>
                  </div>

                  {sourceTranscriptDisplay && (
                    <div className="p-2 rounded-xl bg-black/50 border border-cyan-400/25 text-[11px] text-cyan-200">
                      <span className="text-gray-400">Heard Clip:</span> “{sourceTranscriptDisplay}”
                    </div>
                  )}

                  {liveSessionMode === 'translate' && (heardTranscript || spokenTranscript) && (
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-1 text-[11px]">
                      {heardTranscript && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Heard:</span> {heardTranscript}
                        </p>
                      )}
                      {spokenTranscript && (
                        <p className="text-emerald-300 font-semibold">
                          <span className="text-emerald-500">Translated:</span> {spokenTranscript}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Phrase Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {TRANSLATOR_PHRASE_PRESETS.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTranslateText(undefined, phrase)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-gray-300 text-left truncate max-w-full"
                    >
                      “{phrase}”
                    </button>
                  ))}
                </div>

                {/* Text & Slang Modulation Translator Form */}
                <form onSubmit={(e) => handleTranslateText(e)} className="space-y-2">
                  <textarea
                    rows={2}
                    value={translateInput}
                    onChange={(e) => setTranslateInput(e.target.value)}
                    placeholder={`Type any message to translate with ${activeSlangObj.label} modulation...`}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={translating || !translateInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {translating
                      ? 'Translating...'
                      : `Translate (${activeSlangObj.label})`}
                  </button>
                </form>

                {translationError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-200">
                    {translationError}
                  </div>
                )}

                {translationResult && (
                  <div className="p-3.5 rounded-2xl bg-[#140F24] border border-cyan-400/35 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold">
                        {translationResult.detectedSourceLanguage} &rarr; {resolvedTargetLanguageLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => speakTextWithModulation(translationResult.translatedText)}
                          disabled={isSpeakingTts}
                          className="px-2 py-1 rounded-md bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-semibold"
                        >
                          {isSpeakingTts ? 'Speaking...' : `Speak (${voiceName})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(translationResult.translatedText);
                            setCopiedTranslation(true);
                            setTimeout(() => setCopiedTranslation(false), 2000);
                          }}
                          className="px-2 py-1 rounded-md bg-white/10 text-gray-200 text-[10px]"
                        >
                          {copiedTranslation ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {translationResult.translatedText}
                    </p>

                    {translationResult.phoneticGuide && (
                      <p className="text-[11px] text-purple-200">
                        <strong className="text-purple-300">Pronunciation:</strong> {translationResult.phoneticGuide}
                      </p>
                    )}

                    {translationResult.culturalNuanceTip && (
                      <p className="text-[11px] text-gray-400">
                        <strong className="text-cyan-300">Slang / Nuance:</strong>{' '}
                        {translationResult.culturalNuanceTip}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-black/65 py-2.5 px-5 text-[10px] font-medium flex justify-between items-center border-t border-white/10 relative z-10 text-gray-400">
            <span className="text-purple-300 font-semibold">Vanhsya Travels X</span>
            <span>{BRAND_CONTACTS.websiteDisplay} &bull; UAE 18+</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideBot;

import React, { useRef, useState } from 'react';
import { Camera, Crosshair, Mic, Search, Sparkles, Volume2 } from 'lucide-react';
import { REALM_CONFIGS } from '../../data/realmsData';
import type { RealmId } from '../../types/spatial';
import type { CoachConsultationTopic } from '../../utils/coachSearchRules';

interface CommandPillProps {
  realm: RealmId;
  topics: CoachConsultationTopic[];
  activeTopicId?: string;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  onSubmitText: (input: string) => void;
  onSubmitFile: (file: File) => void;
  onQuickDemoScene: () => void;
}

export const CommandPill: React.FC<CommandPillProps> = ({
  realm,
  topics,
  activeTopicId,
  isSpeaking,
  onToggleSpeak,
  onSubmitText,
  onSubmitFile,
  onQuickDemoScene,
}) => {
  const cfg = REALM_CONFIGS[realm];
  const [value, setValue] = useState('');
  const [showTricksTray, setShowTricksTray] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      onQuickDemoScene();
      return;
    }
    onSubmitText(trimmed);
    setValue('');
    setShowTricksTray(false);
  };

  const handleVoiceMicInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setShowTricksTray((v) => !v);
      onQuickDemoScene();
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'fa-IR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setIsListeningMic(true);
      rec.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        setIsListeningMic(false);
        if (transcript) {
          setValue(transcript);
          onSubmitText(transcript);
        }
      };
      rec.onerror = () => {
        setIsListeningMic(false);
        setShowTricksTray(true);
      };
      rec.onend = () => {
        setIsListeningMic(false);
      };
      rec.start();
    } catch {
      setIsListeningMic(false);
      setShowTricksTray((v) => !v);
    }
  };

  return (
    <div
      data-testid="single-bottom-hub"
      className="fixed z-30 bottom-3 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-[760px] lg:w-[840px] flex flex-col items-center gap-2 pointer-events-auto"
    >
      {/* FC 27 Slanted Blade Quick-Tricks Bar (Shown when 'ترفندها' is toggled) */}
      {showTricksTray && (
        <div
          dir="rtl"
          data-testid="quick-tricks-tray"
          className="w-full flex items-center justify-center flex-wrap gap-2 px-3 py-2 bg-[#05080C]/95 border-l-4 shadow-2xl"
          style={{ borderColor: cfg.accentHex }}
        >
          {topics.map((t) => {
            const selected = activeTopicId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`tray-topic-btn-${t.num}`}
                onClick={() => {
                  onSubmitText(t.id);
                  setShowTricksTray(false);
                }}
                className="fc27-blade px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer"
                style={{
                  backgroundColor: selected ? cfg.accentHex : 'rgba(14, 20, 28, 0.95)',
                  color: selected ? '#05070B' : '#FFFFFF',
                  borderLeft: `3px solid ${cfg.accentHex}`,
                }}
              >
                <span className="fc27-unskew flex items-center gap-1.5">
                  <span className="font-mono-tabular text-[10px] opacity-80">{t.num}</span>
                  <span>{t.titleFa}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* EA SPORTS FC 27 Lower-Third Slanted Broadcast Command Bar */}
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center gap-2 px-2 py-1.5 bg-[#05080C]/92 border-t border-b border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
        style={{ borderLeft: `4px solid ${cfg.accentHex}`, borderRight: `2px solid ${cfg.accentHex}66` }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          data-testid="gameplay-file-input"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSubmitFile(f);
            e.target.value = '';
          }}
        />

        {/* 1. FC 27 Primary Slanted Blade Button: [△] Upload Gameplay Scene */}
        <button
          type="button"
          data-testid="upload-gameplay-btn"
          onClick={() => fileRef.current?.click()}
          className="fc27-blade shrink-0 px-4 py-2 font-black text-xs sm:text-sm transition hover:brightness-110 cursor-pointer shadow-[0_0_24px_rgba(204,255,0,0.25)]"
          style={{ backgroundColor: cfg.accentHex, color: '#05070B' }}
        >
          <span className="fc27-unskew flex items-center gap-2">
            <span className="fc27-key-chip bg-black/85 text-white">△</span>
            <Camera className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">ارسال صحنه بازی</span>
          </span>
        </button>

        {/* 2. FC 27 Slanted Blade Button: [✕] Instant Live ADK Analysis */}
        <button
          type="button"
          data-testid="instant-demo-scene-btn"
          onClick={onQuickDemoScene}
          title="اجرای زنده ۴ ایجنت ADK روی صحنه بازی"
          className="fc27-blade shrink-0 px-3 py-2 text-xs font-extrabold text-white bg-[#0E141B] hover:bg-[#17212C] border border-white/20 transition cursor-pointer"
          style={{ borderLeft: `3px solid ${cfg.accentHex}` }}
        >
          <span className="fc27-unskew flex items-center gap-1.5">
            <span
              className="fc27-key-chip text-[#05070B]"
              style={{ backgroundColor: cfg.accentHex }}
            >
              ✕
            </span>
            <Crosshair className="w-3.5 h-3.5" style={{ color: cfg.accentHex }} />
            <span className="hidden sm:inline">تست صحنه نمونه</span>
            <span className="sm:hidden">نمونه</span>
          </span>
        </button>

        {/* 3. FC 27 Tactical Search Input */}
        <div className="flex-1 min-w-0 flex items-center bg-black/70 border border-white/15 px-2.5 py-1.5">
          <input
            type="text"
            dir="rtl"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="omnichannel-input"
            placeholder="اسم بازی یا مشکل گیم‌پلی را بنویس تا کلیپ واقعی پیدا کنیم..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/55 focus:outline-none min-w-0 font-medium"
          />
        </div>

        {/* 4. FC 27 Slanted Blade Button: [□] Toggle Tricks */}
        <button
          type="button"
          data-testid="toggle-tricks-btn"
          onClick={() => setShowTricksTray((v) => !v)}
          className="fc27-blade shrink-0 px-3 py-2 text-[11px] font-extrabold text-white bg-[#0E141B] hover:bg-[#17212C] border border-white/15 transition cursor-pointer"
        >
          <span className="fc27-unskew flex items-center gap-1.5">
            <span className="fc27-key-chip bg-white/15 text-white">□</span>
            <Sparkles className="w-3 h-3" style={{ color: cfg.accentHex }} />
            <span className="hidden sm:inline">ترفندها</span>
          </span>
        </button>

        {/* 5. FC 27 Slanted Blade Button: [R3] Voice Coach */}
        <button
          type="button"
          onClick={isSpeaking ? onToggleSpeak : handleVoiceMicInput}
          data-testid="coach-voice-toggle"
          aria-label="Speak with Coach or toggle voice"
          title="صحبت صوتی با مربی (R3)"
          className="fc27-blade shrink-0 px-2.5 py-2 cursor-pointer transition bg-[#0E141B] hover:bg-[#17212C] border border-white/15 text-white"
          style={{
            borderColor: isListeningMic || isSpeaking ? cfg.accentHex : undefined,
          }}
        >
          <span className="fc27-unskew flex items-center gap-1">
            <span className="fc27-key-chip bg-white/15 text-white hidden sm:inline-flex">R3</span>
            {isSpeaking ? (
              <Volume2 className="w-4 h-4" style={{ color: cfg.accentHex }} />
            ) : (
              <Mic
                className={`w-4 h-4 ${isListeningMic ? 'animate-pulse' : ''}`}
                style={{ color: isListeningMic ? '#EF4444' : cfg.accentHex }}
              />
            )}
          </span>
        </button>

        {/* 6. FC 27 Slanted Search Submit Blade */}
        <button
          type="submit"
          data-testid="omnichannel-submit"
          aria-label="جستجوی کلیپ و راهنمای مربی"
          className="fc27-blade shrink-0 px-3 py-2 font-black text-xs transition hover:brightness-110 cursor-pointer"
          style={{ backgroundColor: cfg.accentHex, color: '#05070B' }}
        >
          <span className="fc27-unskew flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">جستجو</span>
          </span>
        </button>
      </form>
    </div>
  );
};

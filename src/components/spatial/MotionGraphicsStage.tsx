import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Cpu,
  ExternalLink,
  Film,
  Gamepad2,
  Globe,
  Image as ImageIcon,
  MousePointerClick,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Volume2,
  X,
} from 'lucide-react';
import { REALM_CONFIGS } from '../../data/realmsData';
import type { RealmId } from '../../types/spatial';
import {
  type CoachConsultationTopic,
  type MotionCalloutNode,
  buildAdkMicroIntelForTopic,
} from '../../utils/coachSearchRules';
import { CoachAnswerBoard } from './CoachAnswerBoard';

interface MotionGraphicsStageProps {
  realm: RealmId;
  topic: CoachConsultationTopic;
  isLoadingSearch: boolean;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  onTapCoordinate: (xPct: number, yPct: number) => void;
  onUploadFile: (file: File) => void;
  onRefreshLiveAdk: () => void;
  onClose: () => void;
}

type ActiveAdkTab = 'mechanics' | 'counter' | 'patch' | 'checklist';

function getCircleColor(node: MotionCalloutNode, idx: number, accentHex: string): string {
  if (node.zoneType === 'danger') return '#EF4444';
  if (node.zoneType === 'target') return '#10B981';
  if (node.zoneType === 'path') return accentHex;
  if (idx === 1 && idx < 2) return '#EF4444';
  if (idx >= 2) return '#10B981';
  return accentHex;
}

export const MotionGraphicsStage: React.FC<MotionGraphicsStageProps> = ({
  realm,
  topic,
  isLoadingSearch,
  isSpeaking,
  onToggleSpeak,
  onTapCoordinate,
  onUploadFile,
  onRefreshLiveAdk,
  onClose,
}) => {
  const cfg = REALM_CONFIGS[realm];
  const [viewMode, setViewMode] = useState<'image' | 'video'>('image');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);
  const [activeAgentTab, setActiveAgentTab] = useState<ActiveAdkTab>('mechanics');
  const [motionKey, setMotionKey] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const stageFileRef = useRef<HTMLInputElement | null>(null);
  const canvasBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedVideoIdx(0);
    setMotionKey((k) => k + 1);
  }, [topic.id]);

  const adkIntel = topic.adkIntel ?? buildAdkMicroIntelForTopic(topic);
  const activeImage = topic.images[selectedImageIdx] ?? topic.images[0];
  const activeVideo = topic.videos[selectedVideoIdx] ?? topic.videos[0];
  const resolvedImageUrl =
    activeImage && failedUrls[activeImage.imageUrl]
      ? activeImage.fallbackUrl
      : activeImage?.imageUrl;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasBoxRef.current) return;
    const rect = canvasBoxRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    onTapCoordinate(xPct, yPct);
    setMotionKey((k) => k + 1);
  };

  return (
    <section
      key={`${topic.id}-${motionKey}`}
      data-testid="motion-graphics-stage"
      aria-label="AI Tactical Telestrator Stage"
      className="motion-stage-enter fixed z-30 left-3 right-3 top-12 md:left-8 md:right-auto md:top-14 md:w-[55vw] md:max-w-[700px] max-h-[calc(100vh-5.4rem)] overflow-y-auto no-scrollbar flex flex-col gap-1.5 pointer-events-auto"
    >
      <input
        ref={stageFileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUploadFile(f);
          e.target.value = '';
        }}
      />

      {/* 1. EA SPORTS FC 27 Slanted Blade Header Bar */}
      <div
        className="flex items-center justify-between gap-2 bg-[#05080C]/95 border-t border-b border-white/15 px-3 py-1.5"
        style={{ borderLeft: `4px solid ${cfg.accentHex}` }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            data-testid="stage-upload-own-btn"
            onClick={() => stageFileRef.current?.click()}
            className="fc27-blade px-3 py-1 text-[11px] font-black transition cursor-pointer"
            style={{ backgroundColor: cfg.accentHex, color: '#05070B' }}
          >
            <span className="fc27-unskew flex items-center gap-1.5">
              <span className="fc27-key-chip bg-black/85 text-white">△</span>
              <Camera className="w-3.5 h-3.5" />
              <span>عکس/ویدیوی بازی من</span>
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-motion-image"
            onClick={() => {
              setViewMode('image');
              setMotionKey((k) => k + 1);
            }}
            className="fc27-blade px-3 py-1 text-[11px] font-extrabold transition cursor-pointer"
            style={{
              backgroundColor: viewMode === 'image' ? '#121A22' : 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
              borderLeft: viewMode === 'image' ? `3px solid ${cfg.accentHex}` : '3px solid transparent',
            }}
          >
            <span className="fc27-unskew flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" style={{ color: cfg.accentHex }} />
              <span>خط و دایره روی عکس</span>
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-motion-video"
            onClick={() => {
              setViewMode('video');
              setMotionKey((k) => k + 1);
            }}
            className="fc27-blade px-3 py-1 text-[11px] font-extrabold transition cursor-pointer"
            style={{
              backgroundColor: viewMode === 'video' ? '#121A22' : 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
              borderLeft: viewMode === 'video' ? `3px solid ${cfg.accentHex}` : '3px solid transparent',
            }}
          >
            <span className="fc27-unskew flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" style={{ color: cfg.accentHex }} />
              <span>ویدیو ({topic.videos.length})</span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="refresh-live-adk-btn"
            onClick={onRefreshLiveAdk}
            title="بروزرسانی زنده ایجنت‌های داخلی AIPETROS"
            className="fc27-blade px-2.5 py-1 text-[10px] font-mono-tabular font-bold text-white/90 hover:text-white bg-white/10 cursor-pointer"
          >
            <span className="fc27-unskew flex items-center gap-1">
              <RefreshCw
                className={`w-3 h-3 ${isLoadingSearch ? 'animate-spin' : ''}`}
                style={{ color: cfg.accentHex }}
              />
              <span className="hidden sm:inline">آپدیت ADK</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleSpeak}
            aria-label="Play or stop Coach voice"
            className="fc27-blade px-2.5 py-1 text-[11px] font-extrabold cursor-pointer transition"
            style={{
              backgroundColor: isSpeaking ? cfg.accentHex : 'rgba(255,255,255,0.1)',
              color: isSpeaking ? '#05070B' : '#FFFFFF',
            }}
          >
            <span className="fc27-unskew flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSpeaking ? 'توقف' : 'صدا'}</span>
            </span>
          </button>

          <button
            type="button"
            data-testid="replay-motion-btn"
            onClick={() => setMotionKey((k) => k + 1)}
            title="کشیدن دوباره خط و دایره"
            aria-label="Replay tactical lines and circles"
            className="fc27-blade p-1.5 text-white/80 hover:text-white bg-white/10 cursor-pointer"
          >
            <span className="fc27-unskew">
              <RotateCcw className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            data-testid="close-motion-stage"
            onClick={onClose}
            aria-label="Close tactical stage"
            className="fc27-blade p-1.5 text-white/80 hover:text-white bg-white/10 cursor-pointer"
          >
            <span className="fc27-unskew">
              <X className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Telestrator Canvas: Draws Red Danger Circles, Glowing Trajectory Lines & Green Target Circles */}
      <div
        ref={canvasBoxRef}
        data-testid="telestrator-interactive-canvas"
        onClick={viewMode === 'image' ? handleCanvasClick : undefined}
        className={`relative w-full aspect-video bg-[#05070B] overflow-hidden shadow-[0_24px_65px_rgba(0,0,0,0.92)] ${
          viewMode === 'image' ? 'cursor-crosshair' : ''
        }`}
        style={{ border: `1px solid ${cfg.accentHex}88`, borderLeft: `4px solid ${cfg.accentHex}` }}
      >
        {/* Top Interactive Hint Badge + Active Patch Version */}
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <span
            dir="rtl"
            className="fc27-blade px-3 py-1 bg-black/90 text-[10px] sm:text-[11px] font-bold text-white border-r-2"
            style={{ borderColor: cfg.accentHex }}
          >
            <span className="fc27-unskew flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.accentHex }} />
              <span className="truncate">
                {isLoadingSearch
                  ? '۴ ایجنت داخلی در حال استخراج دیتای زنده وب...'
                  : 'روی هر جای عکس کلیک کن تا VisionAgent از همان‌جا خط و دایره بکشد'}
              </span>
            </span>
          </span>

          <span
            className="fc27-blade px-2.5 py-0.5 bg-black/90 font-mono-tabular text-[10px] font-extrabold hidden sm:inline-block shrink-0"
            style={{ color: cfg.accentHex, borderLeft: `3px solid ${cfg.accentHex}` }}
          >
            <span className="fc27-unskew">{adkIntel.patchVersion}</span>
          </span>
        </div>

        {/* Underlying Gameplay Screenshot or Video */}
        {viewMode === 'image' && activeImage ? (
          <img
            src={resolvedImageUrl}
            alt={activeImage.title}
            referrerPolicy="no-referrer"
            onError={() =>
              setFailedUrls((prev) => ({ ...prev, [activeImage.imageUrl]: true }))
            }
            className="w-full h-full object-cover brightness-95 contrast-110 select-none"
          />
        ) : activeVideo?.youtubeId ? (
          <iframe
            key={activeVideo.youtubeId}
            data-testid="cinema-youtube-iframe"
            title={activeVideo.title}
            src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0&modestbranding=1`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video
            key={activeVideo?.clipUrl ?? '/media/lobby-bg.mp4'}
            src={activeVideo?.clipUrl ?? '/media/lobby-bg.mp4'}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* Live Animated SVG Telestrator: Circles + Trajectory Lines */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <marker
                id={`arrow-telestrator-${realm}`}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5.5"
                markerHeight="5.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={cfg.accentHex} />
              </marker>
            </defs>

            {/* 1. Prominent Tactical Circles Drawn Directly on the Gameplay Frame */}
            {topic.motionCallouts.map((node, idx) => {
              const circleColor = getCircleColor(node, idx, cfg.accentHex);
              const r = node.radius ?? (idx === 1 ? 8 : 6.8);
              return (
                <g key={`circle-${node.id}`}>
                  <circle cx={node.x} cy={node.y} r={r} fill={circleColor} fillOpacity="0.18" />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill="none"
                    stroke={circleColor}
                    strokeWidth="0.85"
                    strokeDasharray={idx === 1 ? '2 1.2' : 'none'}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r * 0.42}
                    fill="none"
                    stroke={circleColor}
                    strokeWidth="0.55"
                    strokeOpacity="0.85"
                  />
                  <circle cx={node.x} cy={node.y} r="1.3" fill={circleColor} />
                </g>
              );
            })}

            {/* 2. Animated Curved Trajectory Lines & Arrows Connecting the Circles */}
            {topic.motionArrows.map((arr, idx) => {
              const pathD = `M ${arr.fromX} ${arr.fromY} Q ${arr.ctrlX} ${arr.ctrlY} ${arr.toX} ${arr.toY}`;
              return (
                <g key={arr.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2.4"
                    strokeOpacity="0.65"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={cfg.accentHex}
                    strokeWidth="1.35"
                    markerEnd={`url(#arrow-telestrator-${realm})`}
                    className="motion-vector-path"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  />
                </g>
              );
            })}
          </svg>

          {/* 3. FC 27 Slanted Blade Callout Tags Next to Each Drawn Circle */}
          {topic.motionCallouts.map((node, idx) => {
            const circleColor = getCircleColor(node, idx, cfg.accentHex);
            return (
              <div
                key={node.id}
                dir="rtl"
                className="motion-callout-pop absolute -translate-x-1/2 px-2.5 py-0.5 bg-black/92 text-white shadow-xl"
                style={{
                  left: `${node.x}%`,
                  top: `${Math.min(91, node.y + 7)}%`,
                  borderRight: `3px solid ${circleColor}`,
                  borderTop: `1px solid ${circleColor}66`,
                  borderBottom: `1px solid ${circleColor}66`,
                  animationDelay: `${0.12 + idx * 0.18}s`,
                }}
              >
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{ backgroundColor: circleColor }}
                  />
                  <span className="text-[11px] font-black">{node.titleFa}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Internal Multi-Agent Panel in EA SPORTS FC 27 Slanted Blade Style */}
      <div
        dir="rtl"
        data-testid="adk-multi-agent-panel"
        className="bg-[#05080C]/95 border border-white/15 p-3 flex flex-col gap-2.5 shadow-2xl"
        style={{ borderRight: `4px solid ${cfg.accentHex}` }}
      >
        {/* Top Row: 4 Internal Deterministic Agents Switcher in FC 27 Slanted Blades */}
        <div className="flex items-center justify-between flex-wrap gap-1.5 border-b border-white/10 pb-2">
          <div className="flex items-center flex-wrap gap-1.5">
            <span
              className="fc27-blade px-2.5 py-1 text-[10px] font-mono-tabular font-extrabold bg-white/10"
              style={{ color: cfg.accentHex, borderRight: `2px solid ${cfg.accentHex}` }}
            >
              <span className="fc27-unskew flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                <span>@GOOGLE/ADK LIVE</span>
              </span>
            </span>

            <button
              type="button"
              data-testid="adk-tab-mechanics"
              onClick={() => setActiveAgentTab('mechanics')}
              className="fc27-blade px-3 py-1 text-[11px] font-black cursor-pointer transition"
              style={{
                backgroundColor:
                  activeAgentTab === 'mechanics' ? cfg.accentHex : 'rgba(18, 26, 34, 0.9)',
                color: activeAgentTab === 'mechanics' ? '#05070B' : '#FFFFFF',
                borderRight: `3px solid ${cfg.accentHex}`,
              }}
            >
              <span className="fc27-unskew flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>۱. ایجنت دکمه‌ها و تایمینگ</span>
              </span>
            </button>

            <button
              type="button"
              data-testid="adk-tab-counter"
              onClick={() => setActiveAgentTab('counter')}
              className="fc27-blade px-3 py-1 text-[11px] font-black cursor-pointer transition"
              style={{
                backgroundColor:
                  activeAgentTab === 'counter' ? '#EF4444' : 'rgba(18, 26, 34, 0.9)',
                color: '#FFFFFF',
                borderRight: '3px solid #EF4444',
              }}
            >
              <span className="fc27-unskew flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>۲. ایجنت خطای مرگبار و پاتک</span>
              </span>
            </button>

            <button
              type="button"
              data-testid="adk-tab-patch"
              onClick={() => setActiveAgentTab('patch')}
              className="fc27-blade px-3 py-1 text-[11px] font-black cursor-pointer transition"
              style={{
                backgroundColor:
                  activeAgentTab === 'patch' ? '#10B981' : 'rgba(18, 26, 34, 0.9)',
                color: activeAgentTab === 'patch' ? '#05070B' : '#FFFFFF',
                borderRight: '3px solid #10B981',
              }}
            >
              <span className="fc27-unskew flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>۳. ایجنت پچ‌نوت و منابع وب ({adkIntel.liveSources?.length ?? 2})</span>
              </span>
            </button>

            <button
              type="button"
              data-testid="adk-tab-checklist"
              onClick={() => setActiveAgentTab('checklist')}
              className="fc27-blade px-3 py-1 text-[11px] font-black cursor-pointer transition"
              style={{
                backgroundColor:
                  activeAgentTab === 'checklist' ? cfg.accentHex : 'rgba(18, 26, 34, 0.9)',
                color: activeAgentTab === 'checklist' ? '#05070B' : '#FFFFFF',
                borderRight: `3px solid ${cfg.accentHex}`,
              }}
            >
              <span className="fc27-unskew flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>۴. چک‌لیست ۳ گام</span>
              </span>
            </button>
          </div>

          {/* Scene & Video FC 27 Blades */}
          <div className="flex items-center gap-1.5">
            {topic.images.slice(0, 2).map((img, idx) => {
              const active = viewMode === 'image' && selectedImageIdx === idx;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setViewMode('image');
                    setSelectedImageIdx(idx);
                    setMotionKey((k) => k + 1);
                  }}
                  className="fc27-blade px-2.5 py-0.5 text-[10px] font-extrabold cursor-pointer transition"
                  style={{
                    backgroundColor: active ? cfg.accentHex : 'rgba(255,255,255,0.09)',
                    color: active ? '#05070B' : '#FFFFFF',
                  }}
                >
                  <span className="fc27-unskew">صحنه {idx + 1}</span>
                </button>
              );
            })}
            {topic.videos.slice(0, 1).map((vid) => (
              <button
                key={vid.id}
                type="button"
                onClick={() => {
                  setViewMode('video');
                  setSelectedVideoIdx(0);
                  setMotionKey((k) => k + 1);
                }}
                className="fc27-blade px-2.5 py-0.5 text-[10px] font-extrabold cursor-pointer transition"
                style={{
                  backgroundColor: viewMode === 'video' ? cfg.accentHex : 'rgba(255,255,255,0.09)',
                  color: viewMode === 'video' ? '#05070B' : '#FFFFFF',
                }}
              >
                <span className="fc27-unskew flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>فیلم</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Specialized ADK Agent Output Card — EA SPORTS FC 27 Card System */}
        {topic.answerBlock && <CoachAnswerBoard answerBlock={topic.answerBlock} accentHex={cfg.accentHex} />}

        {activeAgentTab === 'mechanics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="fc27-card-volt p-3">
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
                <span className="font-mono-tabular text-[10px] font-black text-[#CCFF00]">
                  MicroMechanicsAgent · ترکیب دکمه‌ها
                </span>
                <span className="px-1.5 py-0.5 bg-[#CCFF00] text-[#05070B] font-mono-tabular text-[9px] font-black">
                  FC27 PRO
                </span>
              </div>
              <div className="text-white font-bold leading-relaxed">
                {adkIntel.inputComboFa}
              </div>
            </div>

            <div className="fc27-card p-3">
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
                <span className="font-mono-tabular text-[10px] font-black text-[#F5C542]">
                  extract_frame_inputs() · تایمینگ فریم
                </span>
                <span className="px-1.5 py-0.5 bg-white/10 text-[#CCFF00] font-mono-tabular text-[9px] font-black">
                  MS
                </span>
              </div>
              <div className="text-white/95 font-medium leading-relaxed">
                {adkIntel.frameTimingFa}
              </div>
            </div>
          </div>
        )}

        {activeAgentTab === 'counter' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="fc27-card-live p-3">
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
                <span className="font-mono-tabular text-[10px] font-black text-[#FF2E54]">
                  CounterPlayMistakeAgent · خطای مرگبار
                </span>
                <span className="px-1.5 py-0.5 bg-[#FF2E54] text-white font-mono-tabular text-[9px] font-black">
                  RISK
                </span>
              </div>
              <div className="text-white font-bold leading-relaxed">
                {adkIntel.fatalMistakeFa}
              </div>
            </div>

            <div className="fc27-card-volt p-3">
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
                <span className="font-mono-tabular text-[10px] font-black text-[#CCFF00]">
                  audit_fatal_mistakes() · پاتک و پلن B
                </span>
                <span className="px-1.5 py-0.5 bg-[#CCFF00] text-[#05070B] font-mono-tabular text-[9px] font-black">
                  COUNTER
                </span>
              </div>
              <div className="text-white/95 font-medium leading-relaxed">
                {adkIntel.counterPlayFa}
              </div>
            </div>
          </div>
        )}

        {activeAgentTab === 'patch' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="fc27-card-gold p-3">
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#F5C542]/25">
                <span className="font-mono-tabular text-[10px] font-black text-[#F5C542]">
                  MetaPatchNotesAgent · پچ روز
                </span>
                <span className="px-1.5 py-0.5 bg-[#F5C542] text-[#05070B] font-mono-tabular text-[9px] font-black">
                  {adkIntel.patchVersion}
                </span>
              </div>
              <div
                dir="ltr"
                className="text-left font-mono-tabular text-[11px] text-white font-bold leading-relaxed"
              >
                {adkIntel.proSettingsFa}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {adkIntel.agentsTrace.map((ag) => (
                  <span
                    key={ag.id}
                    className="px-1.5 py-0.5 bg-[#070B11] border border-[#CCFF00]/30 font-mono-tabular text-[9px] font-bold text-[#CCFF00]"
                  >
                    ✓ {ag.agentName} ({ag.latencyMs}ms)
                  </span>
                ))}
              </div>
            </div>

            {/* Real Live Reddit & Web Sources Fetched by Internal MetaPatchNotesAgent */}
            <div className="fc27-card p-3 flex flex-col justify-between">
              <div className="font-mono-tabular text-[10px] font-black text-[#CCFF00] flex items-center gap-1 pb-1.5 border-b border-white/10">
                <Globe className="w-3 h-3" />
                <span>منابع زنده استخراج‌شده از وب و Reddit API</span>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                {(adkIntel.liveSources ?? []).slice(0, 3).map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 fc27-chamfer-sm bg-[#070B11] hover:bg-white/10 border border-white/12 text-[11px] text-white transition"
                  >
                    <span className="truncate font-bold">{src.title}</span>
                    <span className="shrink-0 font-mono-tabular text-[9px] font-black text-[#CCFF00] flex items-center gap-1">
                      <span>{src.source}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeAgentTab === 'checklist' && (
          <div className="flex flex-col gap-2 text-xs">
            {adkIntel.microChecklistFa.map((step, i) => (
              <div
                key={i}
                className={`px-3 py-2 text-white font-bold leading-relaxed flex items-center gap-2.5 ${
                  i === 0 ? 'fc27-card-volt' : i === 1 ? 'fc27-card-live' : 'fc27-card-gold'
                }`}
              >
                <span
                  dir="ltr"
                  className={`w-6 h-6 shrink-0 flex items-center justify-center font-display text-sm font-black italic ${
                    i === 0
                      ? 'bg-[#CCFF00] text-[#05070B]'
                      : i === 1
                        ? 'bg-[#FF2E54] text-white'
                        : 'bg-[#F5C542] text-[#05070B]'
                  }`}
                >
                  0{i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

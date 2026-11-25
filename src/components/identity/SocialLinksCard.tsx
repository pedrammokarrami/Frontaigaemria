import React, { useState } from 'react';
import { Check, Link2, Plus, X } from 'lucide-react';

export interface SocialPlatformDef {
  id: string;
  label: string;
  placeholder: string;
  category: 'social' | 'gaming' | 'cinema' | 'audio';
  accentHex: string;
  shortMark: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: '@username',
    category: 'social',
    accentHex: '#E1306C',
    shortMark: 'IG',
  },
  {
    id: 'x',
    label: 'X / Twitter',
    placeholder: '@handle',
    category: 'social',
    accentHex: '#334155',
    shortMark: 'X',
  },
  {
    id: 'discord',
    label: 'Discord',
    placeholder: 'username#0001',
    category: 'social',
    accentHex: '#5865F2',
    shortMark: 'DC',
  },
  {
    id: 'twitch',
    label: 'Twitch',
    placeholder: 'twitch.tv/channel',
    category: 'social',
    accentHex: '#9146FF',
    shortMark: 'TW',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    placeholder: '@channel',
    category: 'social',
    accentHex: '#EF4444',
    shortMark: 'YT',
  },
  {
    id: 'steam',
    label: 'Steam',
    placeholder: 'Steam ID',
    category: 'gaming',
    accentHex: '#2563EB',
    shortMark: 'ST',
  },
  {
    id: 'riot',
    label: 'Riot ID',
    placeholder: 'Name#TAG',
    category: 'gaming',
    accentHex: '#FF4655',
    shortMark: 'RI',
  },
  {
    id: 'ea',
    label: 'EA Sports',
    placeholder: 'EA ID',
    category: 'gaming',
    accentHex: '#16A34A',
    shortMark: 'EA',
  },
  {
    id: 'chesscom',
    label: 'Epic / Console',
    placeholder: 'Epic or PSN ID',
    category: 'gaming',
    accentHex: '#0EA5E9',
    shortMark: 'EP',
  },
];

export const CINEMA_SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  { id: 'telegram', label: 'Telegram', placeholder: 't.me/channel', category: 'cinema', accentHex: '#0EA5E9', shortMark: 'TG' },
  { id: 'letterboxd', label: 'Letterboxd', placeholder: 'letterboxd.com/user', category: 'cinema', accentHex: '#10B981', shortMark: 'LB' },
  { id: 'imdb', label: 'IMDb List', placeholder: 'ur12345678', category: 'cinema', accentHex: '#EAB308', shortMark: 'IM' },
  { id: 'anilist', label: 'AniList', placeholder: 'anilist.co/user', category: 'cinema', accentHex: '#38BDF8', shortMark: 'AL' },
  { id: 'trakt', label: 'Trakt TV', placeholder: 'trakt.tv/users/...', category: 'cinema', accentHex: '#E11D48', shortMark: 'TK' },
  { id: 'youtube', label: 'YouTube', placeholder: '@channel', category: 'social', accentHex: '#EF4444', shortMark: 'YT' },
  { id: 'instagram', label: 'Instagram', placeholder: '@username', category: 'social', accentHex: '#E1306C', shortMark: 'IG' },
  { id: 'x', label: 'X / Twitter', placeholder: '@handle', category: 'social', accentHex: '#334155', shortMark: 'X' },
  { id: 'plex', label: 'P2P / Plex', placeholder: 'peer://node-id', category: 'cinema', accentHex: '#F59E0B', shortMark: 'P2' },
];

export const AUDIO_SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  { id: 'telegram', label: 'Telegram', placeholder: 't.me/music_ch', category: 'audio', accentHex: '#0EA5E9', shortMark: 'TG' },
  { id: 'spotify', label: 'Spotify', placeholder: 'spotify:user:...', category: 'audio', accentHex: '#16A34A', shortMark: 'SP' },
  { id: 'soundcloud', label: 'SoundCloud', placeholder: 'soundcloud.com/...', category: 'audio', accentHex: '#F97316', shortMark: 'SC' },
  { id: 'applemusic', label: 'Apple Music', placeholder: '@apple_id', category: 'audio', accentHex: '#FB7185', shortMark: 'AM' },
  { id: 'castbox', label: 'Podcast RSS', placeholder: 'rss/feed-url', category: 'audio', accentHex: '#A855F7', shortMark: 'RS' },
  { id: 'mixcloud', label: 'Mixcloud', placeholder: 'mixcloud.com/dj', category: 'audio', accentHex: '#38BDF8', shortMark: 'MC' },
  { id: 'youtube', label: 'YT Music', placeholder: '@channel', category: 'social', accentHex: '#EF4444', shortMark: 'YT' },
  { id: 'instagram', label: 'Instagram', placeholder: '@username', category: 'social', accentHex: '#E1306C', shortMark: 'IG' },
  { id: 'x', label: 'X / Twitter', placeholder: '@handle', category: 'social', accentHex: '#334155', shortMark: 'X' },
];

export type LinkedSocialMap = Record<string, string>;

interface SocialLinksCardProps {
  links: LinkedSocialMap;
  accentHex: string;
  surfaceBg: string;
  borderColor: string;
  onSaveLink: (platformId: string, handle: string) => void;
  onRemoveLink: (platformId: string) => void;
  platforms?: SocialPlatformDef[];
  titleFa?: string;
}

export const SocialLinksCard: React.FC<SocialLinksCardProps> = ({
  links,
  accentHex,
  surfaceBg,
  borderColor,
  onSaveLink,
  onRemoveLink,
  platforms = SOCIAL_PLATFORMS,
  titleFa = 'لینک اکانت‌های سوشیال و گیم',
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftHandle, setDraftHandle] = useState('');

  const connectedCount = Object.values(links).filter((v) => v.trim().length > 0).length;

  const openEditor = (platform: SocialPlatformDef) => {
    setEditingId(platform.id);
    setDraftHandle(links[platform.id] ?? '');
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const cleaned = draftHandle.trim();
    if (cleaned) {
      onSaveLink(editingId, cleaned);
    } else {
      onRemoveLink(editingId);
    }
    setEditingId(null);
    setDraftHandle('');
  };

  return (
    <section
      dir="rtl"
      data-testid="social-links-card"
      aria-label="لینک کردن شبکه‌های اجتماعی و اکانت‌های بازی"
      className="rounded-[22px] border p-5 flex flex-col gap-3.5 transition-colors duration-300 shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
      style={{
        backgroundColor: surfaceBg,
        borderColor,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
          <h3 className="text-[13.5px] font-bold text-white">
            {titleFa}
          </h3>
        </div>
        <span className="text-[12px] text-slate-300 font-mono-tabular">
          {connectedCount} متصل
        </span>
      </div>

      {/* Clean Adaptive Dark Platform Grid */}
      <div className="grid grid-cols-3 gap-2">
        {platforms.map((platform) => {
          const linkedHandle = links[platform.id]?.trim();
          const isEditing = editingId === platform.id;

          return (
            <button
              key={platform.id}
              type="button"
              data-testid={`social-link-btn-${platform.id}`}
              onClick={() => openEditor(platform)}
              className={`group rounded-xl border px-2.5 py-2.5 text-right transition cursor-pointer flex flex-col gap-1 min-w-0 ${
                isEditing
                  ? 'border-white/55 bg-white/14'
                  : linkedHandle
                    ? 'border-white/20 bg-white/8 hover:border-white/35'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span
                  className="w-5 h-5 rounded-md text-[9.5px] font-extrabold text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: platform.accentHex }}
                >
                  {platform.shortMark}
                </span>
                {linkedHandle ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                )}
              </div>

              <span className="text-[11.5px] font-semibold text-white/95 truncate w-full">
                {platform.label}
              </span>
              <span
                dir="ltr"
                className="text-[10.5px] text-slate-300/80 truncate w-full text-right font-mono-tabular"
              >
                {linkedHandle || 'اتصال'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline Quick-Connect Input */}
      {editingId && (
        <form
          onSubmit={handleConfirm}
          data-testid="social-link-editor-form"
          className="pt-3 border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            dir="ltr"
            autoFocus
            data-testid="social-link-input"
            value={draftHandle}
            onChange={(e) => setDraftHandle(e.target.value)}
            placeholder={
              platforms.find((p) => p.id === editingId)?.placeholder ?? '@handle'
            }
            className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-white/20 bg-black/35 text-[12.5px] text-white placeholder:text-slate-400 focus:outline-none focus:border-white/50"
          />
          <button
            type="submit"
            data-testid="social-link-save-btn"
            className="h-9 px-3.5 rounded-xl text-[12px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
            style={{
              backgroundColor: accentHex,
              color:
                accentHex === '#EAB308' || accentHex === '#F59E0B' || accentHex === '#38BDF8'
                  ? '#090D16'
                  : '#FFFFFF',
            }}
          >
            ثبت
          </button>
          {links[editingId] && (
            <button
              type="button"
              data-testid="social-link-remove-btn"
              onClick={() => {
                onRemoveLink(editingId);
                setEditingId(null);
              }}
              aria-label="حذف اتصال"
              className="w-9 h-9 rounded-xl border border-white/15 text-slate-300 hover:text-rose-400 hover:border-rose-400/50 flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      )}
    </section>
  );
};

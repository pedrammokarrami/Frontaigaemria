import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  Flame,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { MediaHubKind } from '../../data/iconicMediaCharacters';
import { AUDIO_ROOMS } from '../../utils/audioAgents';
import { CINEMA_ROOMS, type UndergroundStreamPost } from '../../utils/cinemaAgents';
import {
  AUDIO_MEDIA_PRESETS,
  CINEMA_MEDIA_PRESETS,
  type MediaSocialPost,
  type MediaSocialState,
  type MediaSocialTabId,
  addMediaPostComment,
  appendMediaChatMessage,
  buildMediaAutoReply,
  createMediaSocialClub,
  createMediaSocialPost,
  loadMediaSocialState,
  postMediaClubAnnouncement,
  saveMediaSocialState,
  shareMediaSocialPost,
  toUndergroundStreamPost,
  toggleMediaClubMembership,
  toggleMediaCommentLike,
  toggleMediaFriendship,
  toggleMediaPostReaction,
} from '../../utils/mediaSocialRules';
import { GtaSocialClubsPanel } from './GtaSocialClubsPanel';
import { PlayerProfileModal } from './PlayerProfileModal';

interface MediaSocialWorldProps {
  hub: MediaHubKind;
  activeRoomId: string;
  onPlayStreamInHub: (post: UndergroundStreamPost) => void;
  onBack: () => void;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export const MediaSocialWorld: React.FC<MediaSocialWorldProps> = ({
  hub,
  activeRoomId,
  onPlayStreamInHub,
  onBack,
}) => {
  const [socialState, setSocialState] = useState<MediaSocialState>(() =>
    loadMediaSocialState(hub)
  );
  const [activeChannelId, setActiveChannelId] = useState<string>(
    hub === 'cinema' ? 'global-cinema' : 'global-audio'
  );
  const [chatInput, setChatInput] = useState<string>('');
  const [friendSearch, setFriendSearch] = useState<string>('');
  const [friendFilter, setFriendFilter] = useState<'all' | 'friends' | 'online'>('all');
  const [feedFilter, setFeedFilter] = useState<'all' | 'primary' | 'clubs'>('all');
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(
    () => socialState.posts[0]?.id ?? null
  );
  const [openSharePostId, setOpenSharePostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [shareToastByPost, setShareToastByPost] = useState<Record<string, string>>({});
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [selectedProfileHandle, setSelectedProfileHandle] = useState<string | null>(null);

  // Create Post Modal State (Mirroring GtaSocialWorld 100%)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false);
  const [postCaption, setPostCaption] = useState<string>('');
  const [postRoomId, setPostRoomId] = useState<string>(activeRoomId);
  const [postDistrict, setPostDistrict] = useState<string>(
    hub === 'cinema' ? 'سالن نوآر کلاسیک' : 'کافه وستورلد'
  );
  const [postGameTag, setPostGameTag] = useState<string>(
    hub === 'cinema' ? '4K Cinema · Watch Party' : 'Hi-Res Mix · Live Set'
  );
  const [postStreamUrl, setPostStreamUrl] = useState<string>('');
  const [postMediaUrl, setPostMediaUrl] = useState<string>(
    hub === 'cinema' ? CINEMA_MEDIA_PRESETS[0].url : AUDIO_MEDIA_PRESETS[0].url
  );
  const [postError, setPostError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveMediaSocialState(socialState);
  }, [socialState]);

  useEffect(() => {
    setPostRoomId(activeRoomId);
  }, [activeRoomId]);

  useEffect(() => {
    if (chatScrollRef.current && socialState.activeTab === 'chat') {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [socialState.messages.length, socialState.activeTab, activeChannelId]);

  const mediaPresets = hub === 'cinema' ? CINEMA_MEDIA_PRESETS : AUDIO_MEDIA_PRESETS;
  const globalChannelId = hub === 'cinema' ? 'global-cinema' : 'global-audio';
  const clubChannelId = `club-${socialState.userCrewTag.toLowerCase()}`;

  const tabs: Array<{
    id: MediaSocialTabId;
    labelFa: string;
    badge?: number;
  }> = [
    { id: 'feed', labelFa: 'فید و پست‌ها', badge: socialState.posts.length },
    { id: 'chat', labelFa: 'چت و دایرکت', badge: socialState.messages.length },
    {
      id: 'friends',
      labelFa: 'دوستان و ادد',
      badge: socialState.members.filter((m) => m.isFriend).length,
    },
    { id: 'clubs', labelFa: 'کلاب‌ها', badge: socialState.clubs.length },
  ];

  const backdropUrl =
    socialState.activeTab === 'clubs'
      ? '/src/assets/images/gta6_club_penthouse_hq_1795183788895.jpg'
      : '/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg';

  const visiblePosts = useMemo(() => {
    return socialState.posts.filter((p) => {
      if (feedFilter === 'all') return true;
      if (feedFilter === 'primary') {
        return hub === 'cinema'
          ? p.roomId === 'movie' || p.roomId === 'series'
          : p.roomId === 'westworld-cafe' || p.roomId === 'berlin-rave' || p.roomId === 'mj-concert';
      }
      return hub === 'cinema'
        ? p.roomId === 'anime' || p.roomId === 'tv-climax' || p.roomId === 'documentary'
        : p.roomId === 'ac-library' || p.roomId === 'podcast-studio' || p.roomId === 'tomorrowland' || p.roomId === 'meditation';
    });
  }, [feedFilter, hub, socialState.posts]);

  const visibleMessages = socialState.messages.filter((m) => {
    if (activeChannelId === globalChannelId) {
      return m.channelId === globalChannelId || !m.channelId;
    }
    return m.channelId === activeChannelId;
  });

  const filteredMembers = socialState.members.filter((m) => {
    if (friendFilter === 'friends' && !m.isFriend) return false;
    if (friendFilter === 'online' && m.onlineStatus !== 'ONLINE') return false;
    if (friendSearch.trim()) {
      const q = friendSearch.toLowerCase();
      return (
        m.handle.toLowerCase().includes(q) ||
        m.displayNameFa.toLowerCase().includes(q) ||
        m.favoriteGame.toLowerCase().includes(q) ||
        (m.clanTag?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const friendsCount = socialState.members.filter((m) => m.isFriend).length;
  const joinedClubsCount = socialState.clubs.filter((c) => c.isJoined).length;
  const spotlightClub =
    socialState.clubs.find((c) => c.isJoined) ?? socialState.clubs[0] ?? null;
  const selectedMember = selectedProfileHandle
    ? socialState.members.find(
        (m) => m.handle.toLowerCase() === selectedProfileHandle.toLowerCase()
      ) ?? null
    : null;

  const handleOpenDirectChat = (memberId: string) => {
    setActiveChannelId(`dm-${memberId}`);
    setSocialState((s) => ({ ...s, activeTab: 'chat' }));
    setSelectedProfileHandle(null);
  };

  const handleSendChat = (e: React.FormEvent, overrideText?: string) => {
    e.preventDefault();
    const rawText = (overrideText ?? chatInput).trim();
    if (!rawText) return;
    if (!overrideText) setChatInput('');

    setSocialState((prev) => {
      const next = appendMediaChatMessage(prev, {
        channelId: activeChannelId,
        text: rawText,
        isSelf: true,
      });
      const reply = buildMediaAutoReply(next, rawText, activeChannelId);
      return {
        ...next,
        messages: [...next.messages, reply].slice(-30),
      };
    });
  };

  const handleUploadPostImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPostMediaUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    const res = createMediaSocialPost(socialState, {
      captionFa: postCaption,
      districtFa: postDistrict,
      gameTag: postGameTag,
      roomId: postRoomId,
      mediaUrl: postMediaUrl,
      streamUrl: postStreamUrl,
    });
    if (!res.ok) {
      setPostError(res.error ?? 'خطا در ثبت پست');
      return;
    }
    setSocialState({ ...res.state, activeTab: 'feed' });
    setPostCaption('');
    setPostStreamUrl('');
    setIsCreatePostOpen(false);
  };

  const triggerShareToast = (postId: string, msg: string) => {
    setShareToastByPost((prev) => ({ ...prev, [postId]: msg }));
    window.setTimeout(() => {
      setShareToastByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }, 2600);
  };

  const chatQuickPrompts =
    hub === 'cinema'
      ? [
          'کی پایه واچ‌پارتی ۴K امشب تو سالن نوآره؟',
          'لینک زیرنویس انیمه توکیو آماده پخشه!',
          'کلاب فیلم‌های کالت فعال شد — عضو شید.',
        ]
      : [
          'بیس ۱۴۲ BPM برلین روشنه، کی آنلاینه؟',
          'امشب کافه وست‌ورلد جاز آکوستیک داریم!',
          'بوکمارک فصل جدید کتاب صوتی آلموت ثبت شد.',
        ];

  return (
    <div
      data-testid={`${hub}-gta-social-world`}
      dir="rtl"
      style={{ fontFamily: "'Vazirmatn', var(--font-sans)" }}
      className="relative w-full h-dvh overflow-y-auto overflow-x-hidden bg-[#0B0814] text-white select-text"
    >
      {/* Full-Bleed Atmospheric GTA VI Neon Vice Backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={backdropUrl}
          alt={hub === 'cinema' ? 'پس‌زمینه کلاب سینما' : 'پس‌زمینه کلاب موزیک'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35 transition-opacity duration-500"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,8,20,0.82) 0%, rgba(11,8,20,0.72) 40%, rgba(11,8,20,0.96) 100%)',
          }}
        />
      </div>

      {/* Sticky 3-Zone Header (Exact mirror of GtaSocialWorld) */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E0A19]/92 backdrop-blur-xl">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              data-testid={`${hub}-social-back-btn`}
              onClick={onBack}
              aria-label="بازگشت به لابی"
              className="w-9 h-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/12 flex items-center justify-center text-white transition cursor-pointer shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] sm:text-[16px] font-black tracking-tight text-white truncate">
                  {hub === 'cinema' ? 'سوشال کلاب سینما و تلویزیون' : 'سوشال کلاب موزیک و پادکست'}
                </span>
                <span
                  dir="ltr"
                  className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#FF3B8B]/20 border border-[#FF3B8B]/40 text-[10px] font-mono-tabular font-bold text-[#FF8EC2]"
                >
                  SOCIAL CLUB · GTA VI
                </span>
              </div>
              <p className="text-[10.5px] sm:text-[11px] text-[#B8ABC9] truncate">
                {hub === 'cinema'
                  ? 'فید فیلم و سریال · واچ‌پارتی · کلاب آرشیو · چت زنده'
                  : 'فید ترک و پادکست · پلی‌لیست کلاب‌ها · چت زنده'}
              </p>
            </div>
          </div>

          {/* Desktop 4-Tab Nav */}
          <nav
            aria-label="بخش‌های سوشال کلاب"
            className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-black/45 border border-white/10"
          >
            {tabs.map((tab) => {
              const active = socialState.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`${hub}-social-tab-${tab.id}`}
                  onClick={() => setSocialState((s) => ({ ...s, activeTab: tab.id }))}
                  className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-lg text-[13px] font-bold transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#FF3B8B] text-white shadow-[0_0_16px_rgba(255,59,139,0.45)]'
                      : 'text-[#C5B9D6] hover:text-white hover:bg-white/6'
                  }`}
                >
                  <span>{tab.labelFa}</span>
                  {typeof tab.badge === 'number' && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[11px] font-mono-tabular ${
                        active ? 'bg-black/25 text-white' : 'bg-white/8 text-[#C5B9D6]'
                      }`}
                    >
                      {faNum(tab.badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right REP + New Post */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#161025] border border-[#FF944D]/35 text-[12px] font-bold text-[#FFD4A8]">
              <Flame className="w-3.5 h-3.5 text-[#FF944D]" />
              <span data-testid={`${hub}-social-rep`} className="font-mono-tabular">
                {faNum(socialState.userStreetRep.toLocaleString())} REP
              </span>
            </div>

            <button
              type="button"
              data-testid={`${hub}-social-new-post-btn`}
              onClick={() => setIsCreatePostOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[12.5px] font-bold transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>پست جدید</span>
            </button>
          </div>
        </div>

        {/* Mobile 4-Tab Strip */}
        <div className="lg:hidden border-t border-white/10 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const active = socialState.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`${hub}-social-mobile-tab-${tab.id}`}
                onClick={() => setSocialState((s) => ({ ...s, activeTab: tab.id }))}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  active
                    ? 'bg-[#FF3B8B] text-white'
                    : 'bg-white/5 text-[#C5B9D6] hover:text-white'
                }`}
              >
                {tab.labelFa}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main 12-Col Grid Workspace (8 cols main + 4 cols desktop sidebar) */}
      <main className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT / MAIN 8 COLUMNS */}
          <section className="lg:col-span-8 min-w-0">
            {/* TAB 1: FEED & POSTS */}
            {socialState.activeTab === 'feed' && (
              <div data-testid={`${hub}-social-panel-feed`} className="space-y-5">
                {/* Quick Compose Prompt Bar + Segmented Filter */}
                <div className="rounded-xl border border-white/12 bg-[#130E1D]/88 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src="/src/assets/images/athlete_avatar_1794943635940.jpg"
                        alt={socialState.userHandle}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg object-cover border border-[#FF3B8B]/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-white truncate">
                          {hub === 'cinema'
                            ? 'فیلم، سریال یا استریم تلگرام خودت را به اشتراک بگذار'
                            : 'ترک، میکس، پادکست یا فصل کتاب صوتیت را به اشتراک بگذار'}
                        </p>
                        <p className="text-[12px] text-[#C5B9D6] truncate">
                          <span dir="ltr" className="font-mono-tabular text-[#FF944D]">
                            @{socialState.userHandle}
                          </span>{' '}
                          ·{' '}
                          <span dir="ltr" className="font-mono-tabular">
                            [{socialState.userCrewTag}]
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid={`${hub}-feed-open-composer-btn`}
                      onClick={() => setIsCreatePostOpen(true)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>انتشار پست جدید</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
                    <div
                      role="tablist"
                      className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/35 border border-white/10"
                    >
                      {[
                        { id: 'all' as const, label: 'همه پست‌ها' },
                        {
                          id: 'primary' as const,
                          label: hub === 'cinema' ? 'فیلم و سریال' : 'موزیک و ریو',
                        },
                        {
                          id: 'clubs' as const,
                          label: hub === 'cinema' ? 'انیمه، مستند و رترو' : 'کتاب صوتی و پادکست',
                        },
                      ].map((f) => {
                        const active = feedFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setFeedFilter(f.id)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11.5px] sm:text-[12px] font-semibold transition cursor-pointer whitespace-nowrap ${
                              active
                                ? 'bg-[#FF3B8B] text-white'
                                : 'text-[#C5B9D6] hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>

                    <span className="text-[12px] text-[#B8ABC9] tabular-nums">
                      {faNum(visiblePosts.length)} پست فعال
                    </span>
                  </div>
                </div>

                {/* Posts Stream */}
                <div className="space-y-5">
                  {visiblePosts.map((post: MediaSocialPost) => {
                    const matchedMember = socialState.members.find(
                      (m) => m.handle.toLowerCase() === post.authorHandle.toLowerCase()
                    );
                    const isCommentsOpen = openCommentsPostId === post.id;
                    const isShareOpen = openSharePostId === post.id;
                    const isLiked = post.userReaction === 'like';
                    const isDisliked = post.userReaction === 'dislike';
                    const shareNotice = shareToastByPost[post.id];
                    const spoilerHidden =
                      hub === 'cinema' && post.hasSpoiler && !revealedSpoilers[post.id];

                    return (
                      <article
                        key={post.id}
                        data-testid={`${hub}-social-post-${post.id}`}
                        className="rounded-xl border border-white/12 bg-[#130E1D]/90 overflow-hidden"
                      >
                        {/* Author Header */}
                        <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedProfileHandle(post.authorHandle)}
                            className="flex items-center gap-3 min-w-0 text-right cursor-pointer group"
                          >
                            <img
                              src={post.avatarUrl}
                              alt={post.authorHandle}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-lg object-cover border border-white/20 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-[14px] font-bold text-white group-hover:text-[#FF8EC2] transition truncate">
                                  {post.authorDisplayNameFa}
                                </span>
                                <span
                                  dir="ltr"
                                  className="font-mono-tabular text-[12px] font-semibold text-[#FF944D]"
                                >
                                  @{post.authorHandle}
                                </span>
                                <span
                                  dir="ltr"
                                  className="font-mono-tabular text-[11.5px] text-[#38E8FF]"
                                >
                                  [{post.authorTag}]
                                </span>
                              </div>
                              <p className="text-[12px] text-[#B8ABC9] mt-0.5 truncate">
                                {post.districtFa} · {post.gameTag} · {post.timestamp}
                              </p>
                            </div>
                          </button>

                          {matchedMember && (
                            <button
                              type="button"
                              data-testid={`${hub}-post-add-friend-${post.id}`}
                              onClick={() =>
                                setSocialState((s) => toggleMediaFriendship(s, matchedMember.id))
                              }
                              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[12px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                matchedMember.isFriend
                                  ? 'border-[#38E8FF]/45 bg-[#38E8FF]/12 text-[#8EF4FF]'
                                  : 'border-white/15 bg-white/6 hover:bg-white/12 text-white'
                              }`}
                            >
                              {matchedMember.isFriend ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>دوست</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>ادد</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Caption + Cinema Spoiler-Shield */}
                        <div className="px-4 sm:px-5 pb-3.5 space-y-2">
                          {spoilerHidden ? (
                            <div className="rounded-xl bg-amber-500/12 border border-amber-400/35 p-3 flex flex-wrap items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-amber-200">
                                <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
                                <span>این پست حاوی اسپویل داستان است (محافظ اسپویل فعال)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedSpoilers((prev) => ({ ...prev, [post.id]: true }))
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-[12px] font-extrabold cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>نمایش متن</span>
                              </button>
                            </div>
                          ) : (
                            <p className="text-[14.5px] leading-relaxed text-[#F5EFFC]">
                              {post.captionFa}
                            </p>
                          )}
                        </div>

                        {/* 16:9 Scene Image + Direct Stream Launch Button */}
                        {post.mediaUrl && (
                          <div className="relative w-full aspect-[16/9] bg-[#0B0814] border-y border-white/10 overflow-hidden">
                            <img
                              src={post.mediaUrl}
                              alt={post.districtFa}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
                            />
                            <div className="absolute bottom-3 right-4 left-4 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[12px] text-white/95">
                                <span className="font-bold drop-shadow block">{post.districtFa}</span>
                                <span dir="ltr" className="font-mono-tabular text-[#FFD4A8] text-[11px]">
                                  {post.gameTag}
                                  {post.telegramChannel ? ` · ${post.telegramChannel}` : ''}
                                </span>
                              </div>

                              <button
                                type="button"
                                data-testid={`${hub}-post-play-btn-${post.id}`}
                                onClick={() =>
                                  onPlayStreamInHub(toUndergroundStreamPost(post, hub))
                                }
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[12px] font-bold shadow-lg cursor-pointer whitespace-nowrap"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>پخش در اتاق</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Interactive Action Bar: Like, Dislike, Comment, Share */}
                        <div className="px-4 sm:px-5 py-3 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2 border-b border-white/10">
                          <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                            <button
                              type="button"
                              data-testid={`${hub}-post-like-btn-${post.id}`}
                              aria-pressed={isLiked}
                              onClick={() =>
                                setSocialState((s) =>
                                  toggleMediaPostReaction(s, post.id, 'like')
                                )
                              }
                              className={`inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                                isLiked
                                  ? 'border-[#FF3B8B] bg-[#FF3B8B]/20 text-[#FF99C2]'
                                  : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4 shrink-0" />
                              <span>لایک</span>
                              <span
                                data-testid={`${hub}-post-like-count-${post.id}`}
                                className="tabular-nums font-bold"
                              >
                                {faNum(post.likesCount)}
                              </span>
                            </button>

                            <button
                              type="button"
                              data-testid={`${hub}-post-dislike-btn-${post.id}`}
                              aria-pressed={isDisliked}
                              onClick={() =>
                                setSocialState((s) =>
                                  toggleMediaPostReaction(s, post.id, 'dislike')
                                )
                              }
                              className={`inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                                isDisliked
                                  ? 'border-[#FF944D] bg-[#FF944D]/20 text-[#FFD0A8]'
                                  : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                              }`}
                            >
                              <ThumbsDown className="w-4 h-4 shrink-0" />
                              <span>دیسلایک</span>
                              <span className="tabular-nums font-bold">
                                {faNum(post.dislikesCount)}
                              </span>
                            </button>

                            <button
                              type="button"
                              data-testid={`${hub}-post-comment-toggle-${post.id}`}
                              aria-expanded={isCommentsOpen}
                              onClick={() =>
                                setOpenCommentsPostId((cur) => (cur === post.id ? null : post.id))
                              }
                              className={`inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                                isCommentsOpen
                                  ? 'border-[#38E8FF]/60 bg-[#38E8FF]/15 text-[#9EF5FF]'
                                  : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                              }`}
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" />
                              <span>کامنت</span>
                              <span className="tabular-nums font-bold">
                                {faNum(post.comments.length)}
                              </span>
                            </button>
                          </div>

                          <button
                            type="button"
                            data-testid={`${hub}-post-share-btn-${post.id}`}
                            aria-expanded={isShareOpen}
                            onClick={() =>
                              setOpenSharePostId((cur) => (cur === post.id ? null : post.id))
                            }
                            className={`inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                              post.sharedByMe || isShareOpen
                                ? 'border-[#38E8FF]/60 bg-[#38E8FF]/15 text-[#9EF5FF]'
                                : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                            }`}
                          >
                            <Share2 className="w-4 h-4 shrink-0" />
                            <span>اشتراک‌گذاری</span>
                            <span className="tabular-nums font-bold">
                              {faNum(post.sharesCount)}
                            </span>
                          </button>
                        </div>

                        {shareNotice && (
                          <div className="px-4 sm:px-5 py-2.5 bg-[#38E8FF]/12 border-b border-[#38E8FF]/25 text-[12.5px] text-[#9EF5FF] flex items-center gap-2">
                            <Check className="w-4 h-4 shrink-0" />
                            <span>{shareNotice}</span>
                          </div>
                        )}

                        {isShareOpen && (
                          <div className="px-4 sm:px-5 py-3.5 bg-[#0D0916] border-b border-white/10 space-y-2.5">
                            <p className="text-[12px] font-semibold text-[#D6CBE6]">
                              اشتراک‌گذاری در کلاب:
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/?media_post=${post.id}`;
                                  if (navigator.clipboard?.writeText) {
                                    void navigator.clipboard.writeText(url).catch(() => {});
                                  }
                                  setSocialState((s) => shareMediaSocialPost(s, post.id));
                                  setOpenSharePostId(null);
                                  triggerShareToast(post.id, 'لینک پست کپی و به اشتراک گذاشته شد');
                                }}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/15 bg-white/6 hover:bg-white/12 text-[12.5px] font-semibold text-white cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#FF944D]" />
                                <span>کپی لینک پست</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSocialState((s) =>
                                    shareMediaSocialPost(s, post.id, globalChannelId)
                                  );
                                  setOpenSharePostId(null);
                                  triggerShareToast(post.id, 'پست در چت عمومی کلاب منتشر شد');
                                }}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#FF3B8B]/45 bg-[#FF3B8B]/18 hover:bg-[#FF3B8B]/28 text-[12.5px] font-semibold text-[#FFD1E5] cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>ارسال در چت عمومی کلاب</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Comments Thread */}
                        {isCommentsOpen && (
                          <div className="px-4 sm:px-5 py-4 bg-[#0D0916]/85 space-y-4">
                            {post.comments.length === 0 ? (
                              <p className="text-[12.5px] text-[#A497B8]">
                                هنوز کامنتی ثبت نشده — اولین نفر باشید که نظر می‌دهید.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {post.comments.map((cm) => (
                                  <div
                                    key={cm.id}
                                    className="flex items-start gap-3 pb-3 border-b border-white/8 last:border-b-0 last:pb-0"
                                  >
                                    <img
                                      src={cm.avatarUrl}
                                      alt={cm.authorHandle}
                                      referrerPolicy="no-referrer"
                                      className="w-8 h-8 rounded-md object-cover border border-white/15 shrink-0 mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-[12px]">
                                          <span
                                            dir="ltr"
                                            className="font-mono-tabular font-bold text-[#FF944D]"
                                          >
                                            @{cm.authorHandle}
                                          </span>
                                          <span
                                            dir="ltr"
                                            className="font-mono-tabular text-[#38E8FF]"
                                          >
                                            [{cm.authorTag}]
                                          </span>
                                          <span className="text-[#9E90B5]">· {cm.timestamp}</span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSocialState((s) =>
                                              toggleMediaCommentLike(s, post.id, cm.id)
                                            )
                                          }
                                          className={`inline-flex items-center gap-1 text-[11.5px] font-mono-tabular cursor-pointer ${
                                            cm.likedByMe
                                              ? 'text-[#FF3B8B] font-bold'
                                              : 'text-[#A497B8] hover:text-white'
                                          }`}
                                        >
                                          <Heart
                                            className={`w-3.5 h-3.5 ${
                                              cm.likedByMe ? 'fill-current' : ''
                                            }`}
                                          />
                                          <span>{faNum(cm.likesCount)}</span>
                                        </button>
                                      </div>
                                      <p className="text-[13px] text-[#EDE6F7] mt-1 leading-relaxed">
                                        {cm.text}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const draft = (commentDrafts[post.id] ?? '').trim();
                                if (!draft) return;
                                setSocialState((s) => addMediaPostComment(s, post.id, draft));
                                setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
                              }}
                              className="flex items-center gap-2 pt-1"
                            >
                              <input
                                type="text"
                                dir="rtl"
                                data-testid={`${hub}-post-comment-input-${post.id}`}
                                value={commentDrafts[post.id] ?? ''}
                                onChange={(e) =>
                                  setCommentDrafts((prev) => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                placeholder="کامنت خود را بنویسید..."
                                className="flex-1 min-w-0 h-10 px-3.5 rounded-lg border border-white/15 bg-[#171124] text-[13px] text-white placeholder:text-[#9E90B5] focus:outline-none focus:border-[#FF3B8B]"
                              />
                              <button
                                type="submit"
                                data-testid={`${hub}-post-comment-submit-${post.id}`}
                                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>ارسال</span>
                              </button>
                            </form>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE MULTI-CHANNEL & PRIVATE DM CHAT */}
            {socialState.activeTab === 'chat' && (
              <div data-testid={`${hub}-social-panel-chat`} className="space-y-4">
                <div className="rounded-xl border border-white/12 bg-[#130E1D]/92 overflow-hidden">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-[17px] font-bold text-white">
                        {hub === 'cinema'
                          ? 'چت زنده کلاب سینما و دایرکت'
                          : 'چت زنده کلاب موزیک و دایرکت'}
                      </h2>
                      <p className="text-[12px] text-[#B8ABC9] mt-0.5">
                        گفتگو در چت عمومی، چت اختصاصی کلاب و پیام خصوصی با اعضا
                      </p>
                    </div>
                  </div>

                  {/* Channel Switcher */}
                  <div className="px-4 sm:px-5 py-3 border-b border-white/10 bg-black/25 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveChannelId(globalChannelId)}
                      className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                        activeChannelId === globalChannelId
                          ? 'bg-[#FF3B8B] text-white'
                          : 'bg-white/6 text-[#C5B9D6] hover:text-white'
                      }`}
                    >
                      چت عمومی کلاب
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveChannelId(clubChannelId)}
                      className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                        activeChannelId === clubChannelId
                          ? 'bg-[#38E8FF] text-[#081018]'
                          : 'bg-white/6 text-[#C5B9D6] hover:text-white'
                      }`}
                    >
                      چت کلاب [{socialState.userCrewTag}]
                    </button>

                    {socialState.members.map((m) => {
                      const chId = `dm-${m.id}`;
                      const active = activeChannelId === chId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveChannelId(chId)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                            active
                              ? 'bg-[#FF944D] text-[#120804]'
                              : 'bg-white/6 text-[#C5B9D6] hover:text-white'
                          }`}
                        >
                          <img
                            src={m.avatarUrl}
                            alt={m.handle}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span dir="ltr" className="font-mono-tabular">
                            @{m.handle}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Messages Stream */}
                  <div
                    ref={chatScrollRef}
                    className="h-[340px] sm:h-[400px] overflow-y-auto p-4 sm:p-5 space-y-3"
                  >
                    {visibleMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-[#A497B8] space-y-1.5">
                        <MessageCircle className="w-7 h-7 text-[#FF944D]" />
                        <p className="text-[14px] font-semibold text-white">
                          شروع گفتگو در این کانال
                        </p>
                        <p className="text-[12.5px]">
                          اولین پیام را بفرستید تا اعضای آنلاین پاسخ دهند.
                        </p>
                      </div>
                    ) : (
                      visibleMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.isSelf ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[78%] rounded-xl px-4 py-2.5 border ${
                              msg.isSelf
                                ? 'bg-[#FF3B8B]/18 border-[#FF3B8B]/40 text-white'
                                : 'bg-[#1A1328] border-white/10 text-[#F2ECFA]'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-[11.5px] mb-1">
                              <span
                                dir="ltr"
                                className="font-mono-tabular font-bold"
                                style={{ color: msg.isSelf ? '#FF8EC2' : '#38E8FF' }}
                              >
                                @{msg.senderHandle}
                              </span>
                              <span dir="ltr" className="font-mono-tabular text-[#FF944D]">
                                [{msg.senderTag}]
                              </span>
                              <span className="text-[#9E90B5]">{msg.timestamp}</span>
                            </div>
                            <p className="text-[13.5px] leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Prompts + Composer */}
                  <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0D0916]/90 space-y-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {chatQuickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={(e) => handleSendChat(e, prompt)}
                          className="px-3 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/12 text-[11.5px] text-[#D6CBE6] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleSendChat} className="flex items-center gap-2.5">
                      <input
                        type="text"
                        dir="rtl"
                        data-testid={`${hub}-social-chat-input`}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="پیام خود را در کلاب بنویسید..."
                        className="flex-1 min-w-0 h-11 px-4 rounded-lg border border-white/15 bg-[#171124] text-[13.5px] text-white placeholder:text-[#9E90B5] focus:outline-none focus:border-[#FF3B8B]"
                      />
                      <button
                        type="submit"
                        data-testid={`${hub}-social-chat-send-btn`}
                        className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[13.5px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span>ارسال</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FRIENDS RADAR & ADD FRIEND */}
            {socialState.activeTab === 'friends' && (
              <div data-testid={`${hub}-social-panel-friends`} className="space-y-4">
                <div className="rounded-xl border border-white/12 bg-[#130E1D]/90 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[18px] font-bold text-white">
                        {hub === 'cinema'
                          ? 'دوستان و آرشیویست‌های کلاب سینما'
                          : 'دوستان، دی‌جی‌ها و شنوندگان کلاب موزیک'}
                      </h2>
                      <p className="text-[12.5px] text-[#B8ABC9] mt-0.5">
                        جستجوی اعضا، ادد کردن در لیست دوستان و شروع چت خصوصی
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/35 border border-white/10 self-start">
                      {[
                        { id: 'all' as const, label: 'همه' },
                        { id: 'online' as const, label: 'آنلاین' },
                        { id: 'friends' as const, label: `دوستان (${faNum(friendsCount)})` },
                      ].map((f) => {
                        const active = friendFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFriendFilter(f.id)}
                            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${
                              active
                                ? 'bg-[#38E8FF] text-[#081018]'
                                : 'text-[#C5B9D6] hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-[#9E90B5] absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      dir="rtl"
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      placeholder="جستجوی نام، آیدی، اتاق یا کلاب [TAG]..."
                      className="w-full h-11 pr-10 pl-4 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white placeholder:text-[#9E90B5] focus:outline-none focus:border-[#38E8FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMembers.map((member) => (
                    <article
                      key={member.id}
                      data-testid={`${hub}-friend-card-${member.id}`}
                      className="rounded-xl border border-white/12 bg-[#130E1D]/90 p-4 flex flex-col justify-between gap-4 hover:border-white/25 transition"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={member.avatarUrl}
                          alt={member.displayNameFa}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span dir="ltr" className="font-mono-tabular text-[13px] font-bold text-[#FF944D] truncate">
                              @{member.handle}
                            </span>
                            <span dir="ltr" className="font-mono-tabular text-[11px] font-bold text-[#38E8FF]">
                              [{member.clanTag ?? 'VIP'}]
                            </span>
                          </div>
                          <h3 className="text-[14.5px] font-bold text-white truncate mt-0.5">
                            {member.displayNameFa}
                          </h3>
                          <p className="text-[12px] text-[#B8ABC9] mt-0.5 truncate">
                            {member.favoriteGame}
                          </p>
                          <p className="text-[12px] text-[#DED4EB] mt-2 leading-relaxed">
                            {member.playStyleFa}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          data-testid={`${hub}-friend-toggle-${member.id}`}
                          onClick={() =>
                            setSocialState((s) => toggleMediaFriendship(s, member.id))
                          }
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12.5px] font-bold transition cursor-pointer ${
                            member.isFriend
                              ? 'border border-[#38E8FF]/50 bg-[#38E8FF]/15 text-[#9EF5FF]'
                              : 'bg-[#FF3B8B] hover:brightness-110 text-white'
                          }`}
                        >
                          {member.isFriend ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span>دوست شما</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>افزودن دوست</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDirectChat(member.id)}
                          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-white/15 bg-white/6 hover:bg-white/14 text-[12.5px] font-semibold text-white cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#38E8FF]" />
                          <span>چت</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedProfileHandle(member.handle)}
                          className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-white/15 bg-white/6 hover:bg-white/14 text-[12.5px] font-semibold text-[#D6CBE6] hover:text-white cursor-pointer"
                        >
                          پروفایل
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: CLUBS DIRECTORY & WALL */}
            {socialState.activeTab === 'clubs' && (
              <GtaSocialClubsPanel
                clubs={socialState.clubs}
                userCrewTag={socialState.userCrewTag}
                onToggleClubJoin={(clubId) =>
                  setSocialState((s) => toggleMediaClubMembership(s, clubId))
                }
                onCreateClub={(input) =>
                  setSocialState((s) => createMediaSocialClub(s, input))
                }
                onPostClubAnnouncement={(clubId, text) =>
                  setSocialState((s) => postMediaClubAnnouncement(s, clubId, text))
                }
                onOpenProfileByHandle={(handle) => setSelectedProfileHandle(handle)}
              />
            )}
          </section>

          {/* RIGHT 4-COL DESKTOP SIDEBAR (Exact mirror of GtaSocialWorld) */}
          <aside className="lg:col-span-4 space-y-5">
            {/* User Crew Identity Card */}
            <div className="rounded-xl border border-white/12 bg-[#130E1D]/92 p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/src/assets/images/athlete_avatar_1794943635940.jpg"
                  alt={socialState.userHandle}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover border-2 border-[#FF3B8B]/60 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span dir="ltr" className="font-mono-tabular text-[15px] font-bold text-white truncate">
                      @{socialState.userHandle}
                    </span>
                    <span dir="ltr" className="font-mono-tabular text-[12px] font-bold text-[#38E8FF]">
                      [{socialState.userCrewTag}]
                    </span>
                  </div>
                  <p className="text-[12px] text-[#B8ABC9] mt-0.5">
                    {hub === 'cinema'
                      ? 'آرشیویست کلاب سینما و تلویزیون'
                      : 'کیوریتور کلاب موزیک و پادکست'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/10 pt-3 border-t border-white/10 text-center">
                <div>
                  <span className="text-[11px] text-[#A497B8] block">اعتبار REP</span>
                  <span className="font-mono-tabular text-[15px] font-bold text-[#FF944D] mt-0.5 block">
                    {faNum(socialState.userStreetRep.toLocaleString())}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#A497B8] block">دوستان</span>
                  <span className="font-mono-tabular text-[15px] font-bold text-[#38E8FF] mt-0.5 block">
                    {faNum(friendsCount)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#A497B8] block">کلاب‌ها</span>
                  <span className="font-mono-tabular text-[15px] font-bold text-[#FF8EC2] mt-0.5 block">
                    {faNum(joinedClubsCount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatePostOpen(true)}
                  className="h-9 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[12.5px] font-bold transition cursor-pointer"
                >
                  انتشار پست جدید
                </button>
                <button
                  type="button"
                  onClick={() => setSocialState((s) => ({ ...s, activeTab: 'clubs' }))}
                  className="h-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/12 text-white text-[12.5px] font-semibold transition cursor-pointer"
                >
                  کلاب‌های من
                </button>
              </div>
            </div>

            {/* Active Members Sidebar Card */}
            <div className="rounded-xl border border-white/12 bg-[#130E1D]/92 p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#38E8FF]" />
                  <span>اعضای آنلاین کلاب</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSocialState((s) => ({ ...s, activeTab: 'friends' }))}
                  className="text-[12px] text-[#FF8EC2] hover:text-white cursor-pointer"
                >
                  مشاهده همه
                </button>
              </div>

              <div className="space-y-3">
                {socialState.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2.5 pb-3 border-b border-white/8 last:border-b-0 last:pb-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProfileHandle(m.handle)}
                      className="flex items-center gap-2.5 min-w-0 text-right cursor-pointer group"
                    >
                      <img
                        src={m.avatarUrl}
                        alt={m.handle}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover border border-white/15 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white group-hover:text-[#FF8EC2] truncate">
                          {m.displayNameFa.split('·')[0].trim()}
                        </p>
                        <p dir="ltr" className="font-mono-tabular text-[11px] text-[#A497B8] truncate">
                          @{m.handle} · [{m.clanTag ?? 'VIP'}]
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSocialState((s) => toggleMediaFriendship(s, m.id))}
                        className={`h-8 px-2.5 rounded-md text-[11.5px] font-bold transition cursor-pointer ${
                          m.isFriend
                            ? 'bg-[#38E8FF]/15 text-[#9EF5FF] border border-[#38E8FF]/40'
                            : 'bg-white/8 hover:bg-[#FF3B8B] text-white'
                        }`}
                      >
                        {m.isFriend ? <Check className="w-3.5 h-3.5" /> : 'ادد'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDirectChat(m.id)}
                        className="h-8 w-8 rounded-md bg-white/6 hover:bg-white/14 text-[#C5B9D6] hover:text-white flex items-center justify-center cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Spotlight Club */}
            {spotlightClub && (
              <div className="rounded-xl border border-white/12 bg-[#130E1D]/92 overflow-hidden">
                <div className="relative h-28 bg-[#0B0814]">
                  <img
                    src={spotlightClub.bannerUrl}
                    alt={spotlightClub.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#130E1D] via-[#130E1D]/45 to-transparent"
                  />
                  <div className="absolute bottom-2.5 right-4 left-4 flex items-center justify-between">
                    <span className="text-[13.5px] font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#FF944D]" />
                      {spotlightClub.name}
                    </span>
                    <span dir="ltr" className="font-mono-tabular text-[12px] font-bold text-[#38E8FF]">
                      [{spotlightClub.tag}]
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  <p className="text-[12.5px] text-[#D6CBE6] leading-relaxed">
                    {spotlightClub.announcements[0]?.text ?? spotlightClub.mottoFa}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[12px]">
                    <span className="text-[#A497B8] tabular-nums">
                      {faNum(spotlightClub.membersCount)} عضو فعال
                    </span>
                    <button
                      type="button"
                      onClick={() => setSocialState((s) => ({ ...s, activeTab: 'clubs' }))}
                      className="font-semibold text-[#FF8EC2] hover:text-white cursor-pointer"
                    >
                      ورود به مقر کلاب
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Create Post Modal (Exact mirror of GtaSocialWorld composer + Room & Stream Link) */}
      {isCreatePostOpen && (
        <div
          data-testid={`${hub}-create-post-modal`}
          className="fixed inset-0 z-50 bg-black/78 backdrop-blur-md flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSubmitCreatePost}
            className="w-full max-w-xl rounded-2xl border border-[#FF3B8B]/40 bg-[#140E20] p-5 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-[18px] font-bold text-white">
                  {hub === 'cinema'
                    ? 'انتشار پست جدید در کلاب سینما'
                    : 'انتشار پست جدید در کلاب موزیک و پادکست'}
                </h2>
                <p className="text-[12px] text-[#B8ABC9] mt-0.5">
                  <span dir="ltr" className="font-mono-tabular text-[#FF944D]">
                    @{socialState.userHandle}
                  </span>{' '}
                  ·{' '}
                  <span dir="ltr" className="font-mono-tabular">
                    [{socialState.userCrewTag}]
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                aria-label="بستن پنجره پست جدید"
                className="w-9 h-9 rounded-lg hover:bg-white/10 text-[#C5B9D6] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#D6CBE6] mb-1.5">
                متن پست
              </label>
              <textarea
                rows={3}
                dir="rtl"
                data-testid={`${hub}-create-post-caption`}
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder={
                  hub === 'cinema'
                    ? 'نقد فیلم، پیشنهاد سریال یا اطلاع‌رسانی واچ‌پارتی امشب را بنویسید...'
                    : 'ترک محبوب، ست ریو امشب یا نکته کتاب صوتی خود را بنویسید...'
                }
                className="w-full p-3.5 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white placeholder:text-[#8E7FA6] focus:outline-none focus:border-[#FF3B8B] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#D6CBE6] mb-1">
                  اتاق مقصد
                </label>
                <select
                  value={postRoomId}
                  onChange={(e) => {
                    setPostRoomId(e.target.value);
                    const found =
                      hub === 'cinema'
                        ? CINEMA_ROOMS.find((r) => r.id === e.target.value)
                        : AUDIO_ROOMS.find((r) => r.id === e.target.value);
                    if (found) setPostDistrict(found.titleFa);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#0D0916] text-[13px] text-white focus:outline-none"
                >
                  {(hub === 'cinema' ? CINEMA_ROOMS : AUDIO_ROOMS).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.titleFa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#D6CBE6] mb-1">
                  تگ یا کیفیت استریم
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={postGameTag}
                  onChange={(e) => setPostGameTag(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#0D0916] text-[13px] font-mono-tabular text-white focus:outline-none focus:border-[#FF3B8B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#D6CBE6] mb-1">
                لینک استریم یا کانال تلگرام (اختیاری)
              </label>
              <input
                type="text"
                dir="ltr"
                value={postStreamUrl}
                onChange={(e) => setPostStreamUrl(e.target.value)}
                placeholder="https://t.me/... or https://.../stream.m3u8"
                className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#0D0916] text-[13px] font-mono-tabular text-white placeholder:text-[#8E7FA6] focus:outline-none focus:border-[#38E8FF]"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-[#D6CBE6] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#FF944D]" />
                  <span>انتخاب کاور صحنه</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#38E8FF] hover:underline cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>آپلود از دستگاه</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPostImage}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {mediaPresets.map((preset) => {
                  const selected = postMediaUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPostMediaUrl(preset.url)}
                      className={`relative rounded-lg overflow-hidden aspect-[16/10] border-2 transition cursor-pointer ${
                        selected ? 'border-[#FF3B8B]' : 'border-white/12 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-black/70 text-[10.5px] text-white truncate">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {postError && <p className="text-[12.5px] text-rose-300">{postError}</p>}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                className="h-10 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[#D6CBE6] text-[13px] font-medium cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                data-testid={`${hub}-create-post-submit`}
                className="h-10 px-5 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[13px] font-bold cursor-pointer"
              >
                انتشار پست
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member Profile Modal */}
      {selectedMember && (
        <PlayerProfileModal
          gamer={selectedMember}
          allGamers={socialState.members}
          onClose={() => setSelectedProfileHandle(null)}
          onToggleFriend={(id) => setSocialState((s) => toggleMediaFriendship(s, id))}
          onOpenDirectChat={handleOpenDirectChat}
        />
      )}
    </div>
  );
};

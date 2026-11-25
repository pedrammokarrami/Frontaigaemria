import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Heart,
  Link2,
  MessageSquare,
  PlayCircle,
  Send,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import {
  type UndergroundStreamPost,
  addUndergroundStreamComment,
  publishUndergroundStream,
  rankTrendingStreams,
  resolveTelegramChannelId,
  scanSpoilerContent,
  toggleUndergroundStreamLike,
} from '../../utils/cinemaAgents';

interface UndergroundSocialClubProps {
  hub: 'cinema' | 'audio';
  activeRoomId: string;
  initialPosts: UndergroundStreamPost[];
  activePersonaBadge: string;
  accentHex: string;
  onPlayStreamInHub: (post: UndergroundStreamPost) => void;
}

interface StoredClubIdentity {
  telegramHandle: string;
  telegramChannelId: string;
  imdbUrl: string;
  twitchUrl: string;
  spotifyUrl: string;
  soundcloudUrl: string;
}

const IDENTITY_STORAGE_KEY = 'aipetros-underground-identity-v1';

const DEFAULT_IDENTITY: StoredClubIdentity = {
  telegramHandle: '@alderson_node',
  telegramChannelId: 't.me/alderson_node_aipetros_stream',
  imdbUrl: 'https://www.imdb.com/user/ur9910421/',
  twitchUrl: 'https://www.twitch.tv/alderson_noir',
  spotifyUrl: 'https://open.spotify.com/user/modular_hana',
  soundcloudUrl: 'https://soundcloud.com/berlin_rave_archive',
};

const SpoilerProtectedText: React.FC<{
  text: string;
  enabled: boolean;
  itemKey: string;
}> = ({ text, enabled, itemKey }) => {
  const [revealed, setRevealed] = useState(false);
  const scan = useMemo(() => scanSpoilerContent(text), [text]);

  if (!enabled || !scan.hasSpoiler) {
    return <span>{text}</span>;
  }

  return (
    <span className="inline">
      {scan.segments.map((seg, idx) => {
        if (!seg.isSpoiler) {
          return <span key={idx}>{seg.text} </span>;
        }
        return (
          <span key={idx} className="inline-flex flex-wrap items-center gap-1.5 mx-0.5">
            <span
              data-testid={`spoiler-text-${itemKey}-${idx}`}
              className={`px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 transition duration-200 ${
                revealed ? 'blur-0 text-rose-100' : 'blur-[5px] select-none text-rose-200/80'
              }`}
            >
              {seg.text}
            </span>
            <button
              type="button"
              data-testid={`reveal-spoiler-btn-${itemKey}-${idx}`}
              onClick={() => setRevealed((r) => !r)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10.5px] font-bold text-amber-200 cursor-pointer shrink-0 whitespace-nowrap"
            >
              {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{revealed ? 'مخفی کن' : 'نمایش اسپویل'}</span>
            </button>
          </span>
        );
      })}
    </span>
  );
};

export const UndergroundSocialClub: React.FC<UndergroundSocialClubProps> = ({
  hub,
  activeRoomId,
  initialPosts,
  activePersonaBadge,
  accentHex,
  onPlayStreamInHub,
}) => {
  const postsStorageKey = `aipetros-underground-posts-${hub}-v1`;

  const [identity, setIdentity] = useState<StoredClubIdentity>(() => {
    try {
      const raw = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
      if (raw) return { ...DEFAULT_IDENTITY, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return DEFAULT_IDENTITY;
  });

  const [telegramDraft, setTelegramDraft] = useState(identity.telegramHandle);
  const [linkOneDraft, setLinkOneDraft] = useState(
    hub === 'cinema' ? identity.imdbUrl : identity.spotifyUrl
  );
  const [linkTwoDraft, setLinkTwoDraft] = useState(
    hub === 'cinema' ? identity.twitchUrl : identity.soundcloudUrl
  );
  const [identitySavedNote, setIdentitySavedNote] = useState<string | null>(null);

  const [posts, setPosts] = useState<UndergroundStreamPost[]>(() => {
    try {
      const raw = window.localStorage.getItem(postsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as UndergroundStreamPost[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return initialPosts;
  });

  const [composerOpen, setComposerOpen] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamCaption, setStreamCaption] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);

  const [openCommentsId, setOpenCommentsId] = useState<string | null>(
    initialPosts[0]?.id ?? null
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setLinkOneDraft(hub === 'cinema' ? identity.imdbUrl : identity.spotifyUrl);
    setLinkTwoDraft(hub === 'cinema' ? identity.twitchUrl : identity.soundcloudUrl);
  }, [hub, identity]);

  useEffect(() => {
    try {
      window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    } catch {
      // ignore
    }
  }, [identity]);

  useEffect(() => {
    try {
      window.localStorage.setItem(postsStorageKey, JSON.stringify(posts));
    } catch {
      // ignore
    }
  }, [posts, postsStorageKey]);

  const rankedPosts = useMemo(() => rankTrendingStreams(posts), [posts]);

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const resolved = resolveTelegramChannelId(telegramDraft);
    const nextIdentity: StoredClubIdentity = {
      ...identity,
      telegramHandle: resolved.cleanHandle || identity.telegramHandle,
      telegramChannelId: resolved.channelId || identity.telegramChannelId,
      ...(hub === 'cinema'
        ? { imdbUrl: linkOneDraft.trim(), twitchUrl: linkTwoDraft.trim() }
        : { spotifyUrl: linkOneDraft.trim(), soundcloudUrl: linkTwoDraft.trim() }),
    };
    setIdentity(nextIdentity);
    setIdentitySavedNote(
      resolved.channelId
        ? `کانال غیرمتمرکز ${resolved.channelId} به پروفایل متصل شد.`
        : 'لینک‌های سوشیال ذخیره شدند (هندل تلگرام حداقل ۳ کاراکتر).'
    );
    window.setTimeout(() => setIdentitySavedNote(null), 3500);
  };

  const handlePublishStream = (e: React.FormEvent) => {
    e.preventDefault();
    const res = publishUndergroundStream(posts, {
      hub,
      roomId: activeRoomId,
      titleFa: streamTitle,
      captionFa: streamCaption,
      streamUrl,
      authorHandle: identity.telegramHandle.replace(/^@/, '') || 'aipetros_node',
      authorTelegramChannel: identity.telegramChannelId,
      personaBadge: activePersonaBadge,
      personaAccentHex: accentHex,
    });

    if (!res.ok) {
      setPublishError(res.error ?? 'آدرس استریم نامعتبر است.');
      return;
    }

    setPosts(res.posts);
    setPublishError(null);
    setStreamTitle('');
    setStreamUrl('');
    setStreamCaption('');
    setComposerOpen(false);
  };

  const handleLikePost = (postId: string) => {
    setPosts((prev) => toggleUndergroundStreamLike(prev, postId));
  };

  const handleAddComment = (postId: string) => {
    const text = commentDrafts[postId] ?? '';
    if (!text.trim()) return;
    setPosts((prev) =>
      addUndergroundStreamComment(
        prev,
        postId,
        identity.telegramHandle.replace(/^@/, '') || 'guest_node',
        text
      )
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <aside
      data-testid={`underground-club-${hub}`}
      dir="rtl"
      className="rounded-3xl bg-[#07090D]/85 backdrop-blur-2xl border border-white/12 p-3.5 sm:p-4 shadow-[0_24px_64px_rgba(0,0,0,0.68)] flex flex-col gap-3"
    >
      {/* Header: Mr. Robot Underground Terminal Aesthetic */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-[13px] font-extrabold text-white truncate">
              Underground Club · شبکه غیرمتمرکز تلگرام
            </h2>
            <p className="text-[10.5px] font-mono text-emerald-300/80 truncate" dir="ltr">
              {identity.telegramChannelId}
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid={`ug-open-composer-${hub}`}
          onClick={() => setComposerOpen((o) => !o)}
          className="shrink-0 whitespace-nowrap min-h-[32px] px-3 rounded-xl text-[11px] font-bold border border-emerald-400/45 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 transition cursor-pointer"
        >
          {composerOpen ? 'بستن فرم' : '+ ارسال استریم'}
        </button>
      </div>

      {/* Decentralized Telegram + IMDb/Twitch or Spotify/SoundCloud Identity Linker */}
      <form
        onSubmit={handleSaveIdentity}
        className="rounded-2xl bg-black/50 border border-white/10 p-2.5 flex flex-col gap-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-white/55">Telegram @Handle</span>
            <input
              type="text"
              dir="ltr"
              data-testid={`ug-telegram-input-${hub}`}
              value={telegramDraft}
              onChange={(e) => setTelegramDraft(e.target.value)}
              placeholder="@username"
              className="min-h-[34px] px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11.5px] font-mono text-white focus:outline-none focus:border-emerald-400/60"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-white/55">
              {hub === 'cinema' ? 'IMDb Profile URL' : 'Spotify Profile URL'}
            </span>
            <input
              type="url"
              dir="ltr"
              data-testid={`ug-social-one-input-${hub}`}
              value={linkOneDraft}
              onChange={(e) => setLinkOneDraft(e.target.value)}
              className="min-h-[34px] px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11.5px] font-mono text-white focus:outline-none focus:border-white/35"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-white/55">
              {hub === 'cinema' ? 'Twitch Channel URL' : 'SoundCloud Profile URL'}
            </span>
            <input
              type="url"
              dir="ltr"
              data-testid={`ug-social-two-input-${hub}`}
              value={linkTwoDraft}
              onChange={(e) => setLinkTwoDraft(e.target.value)}
              className="min-h-[34px] px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11.5px] font-mono text-white focus:outline-none focus:border-white/35"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] text-emerald-300/90 truncate">
            {identitySavedNote ??
              (hub === 'cinema'
                ? 'اتصال همزمان IMDb · Twitch · کانال تلگرام'
                : 'اتصال همزمان Spotify · SoundCloud · کانال تلگرام')}
          </span>
          <button
            type="submit"
            data-testid={`ug-save-identity-${hub}`}
            className="shrink-0 whitespace-nowrap min-h-[30px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white cursor-pointer transition inline-flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>اتصال نود</span>
          </button>
        </div>
      </form>

      {/* Collapsible Stream Submission Form */}
      {composerOpen && (
        <form
          onSubmit={handlePublishStream}
          data-testid={`ug-stream-composer-${hub}`}
          className="rounded-2xl bg-slate-900/75 border border-emerald-400/30 p-3 flex flex-col gap-2"
        >
          <input
            type="text"
            data-testid={`ug-composer-title-${hub}`}
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            placeholder={
              hub === 'cinema'
                ? 'عنوان فیلم/اپیزود (مثلاً: سکانس باران بلید رانر)'
                : 'عنوان ترک/پادکست (مثلاً: ست زنده تکنو برلین)'
            }
            className="min-h-[36px] px-3 rounded-xl bg-black/50 border border-white/10 text-[12px] text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400/60"
          />
          <input
            type="text"
            dir="ltr"
            data-testid={`ug-composer-url-${hub}`}
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="https://t.me/channel/12 | https://.../stream.m3u8 | webrtc://..."
            className="min-h-[36px] px-3 rounded-xl bg-black/50 border border-white/10 text-[12px] font-mono text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400/60"
          />
          <input
            type="text"
            data-testid={`ug-composer-caption-${hub}`}
            value={streamCaption}
            onChange={(e) => setStreamCaption(e.target.value)}
            placeholder="توضیح کوتاه (هشدار: ایجنت Spoiler-Shield جملات اسپویل را تار می‌کند)"
            className="min-h-[36px] px-3 rounded-xl bg-black/50 border border-white/10 text-[12px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
          />
          {publishError && (
            <p className="text-[11px] text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{publishError}</span>
            </p>
          )}
          <button
            type="submit"
            data-testid={`ug-composer-submit-${hub}`}
            className="min-h-[36px] rounded-xl bg-emerald-400 text-slate-950 font-extrabold text-[12px] hover:bg-emerald-300 transition cursor-pointer"
          >
            انتشار در لیست Trending Now
          </button>
        </form>
      )}

      {/* Top Streamers / Trending Now Live Ranked List */}
      <div className="flex items-center justify-between text-[11px] text-white/60 px-0.5">
        <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
          <Flame className="w-3.5 h-3.5" />
          <span>Top Streamers · Trending Now</span>
        </span>
        <span className="font-mono-tabular">{rankedPosts.length} feeds</span>
      </div>

      <div
        data-testid={`ug-trending-list-${hub}`}
        className="flex flex-col gap-2.5 max-h-[360px] lg:max-h-[420px] overflow-y-auto pr-0.5"
      >
        {rankedPosts.map((post, idx) => {
          const isCommentsOpen = openCommentsId === post.id;
          return (
            <article
              key={post.id}
              data-testid={`ug-stream-card-${post.id}`}
              className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 p-3 flex flex-col gap-2 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono-tabular text-white/60">
                    <span className="font-bold text-emerald-300">#{idx + 1}</span>
                    <span>·</span>
                    <span className="text-white/85">@{post.authorHandle}</span>
                    <span>·</span>
                    <span style={{ color: post.personaAccentHex }}>{post.personaBadge}</span>
                    <span>·</span>
                    <span>{post.streamFormat}</span>
                  </div>
                  <h3 className="text-[12.5px] font-extrabold text-white mt-0.5 leading-snug">
                    {post.titleFa}
                  </h3>
                </div>

                <button
                  type="button"
                  data-testid={`ug-like-btn-${post.id}`}
                  aria-pressed={post.likedByMe}
                  onClick={() => handleLikePost(post.id)}
                  className={`shrink-0 whitespace-nowrap min-h-[30px] px-2.5 rounded-lg border text-[11px] font-mono-tabular font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                    post.likedByMe
                      ? 'bg-rose-500/20 border-rose-400/60 text-rose-200'
                      : 'bg-white/5 border-white/10 text-white/75 hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${post.likedByMe ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{post.likesCount}</span>
                </button>
              </div>

              <p className="text-[11.5px] text-white/75 leading-relaxed">
                <SpoilerProtectedText
                  text={post.captionFa}
                  enabled={hub === 'cinema'}
                  itemKey={`cap-${post.id}`}
                />
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/8">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    data-testid={`ug-play-btn-${post.id}`}
                    onClick={() => onPlayStreamInHub(post)}
                    className="shrink-0 whitespace-nowrap min-h-[30px] px-2.5 rounded-lg text-[11px] font-bold text-slate-950 inline-flex items-center gap-1 cursor-pointer transition hover:opacity-90"
                    style={{ backgroundColor: accentHex }}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>پخش مستقیم</span>
                  </button>

                  <span className="text-[10.5px] font-mono text-white/45 truncate inline-flex items-center gap-1" dir="ltr">
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{post.authorTelegramChannel}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenCommentsId(isCommentsOpen ? null : post.id)}
                  className="shrink-0 whitespace-nowrap text-[11px] text-white/65 hover:text-white inline-flex items-center gap-1 cursor-pointer font-mono-tabular"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.comments.length} نظر</span>
                </button>
              </div>

              {isCommentsOpen && (
                <div className="pt-2 border-t border-white/8 flex flex-col gap-2">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl bg-black/45 px-2.5 py-2 text-[11px] text-white/80 leading-relaxed"
                    >
                      <span className="font-mono text-emerald-300 ml-1.5">@{c.authorHandle}:</span>
                      <SpoilerProtectedText
                        text={c.text}
                        enabled={hub === 'cinema'}
                        itemKey={`com-${c.id}`}
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={commentDrafts[post.id] ?? ''}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      placeholder="نظر خود را بنویسید (اسپویل خودکار تار می‌شود)..."
                      className="flex-1 min-h-[32px] px-2.5 rounded-lg bg-black/50 border border-white/10 text-[11px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      aria-label="ارسال نظر"
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
};

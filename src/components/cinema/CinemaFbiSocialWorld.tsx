import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  Eye,
  Film,
  Heart,
  Image as ImageIcon,
  KeyRound,
  Link2,
  Lock,
  MessageSquare,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Unlock,
  Upload,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import type { CinemaRoomId, UndergroundStreamPost } from '../../utils/cinemaAgents';
import {
  addFbiPostComment,
  appendFbiChatMessage,
  buildFbiAgentAutoReply,
  createFbiDivisionClub,
  createFbiFeedPost,
  FBI_EVIDENCE_PRESETS,
  loadCinemaFbiState,
  postFbiClubDispatch,
  saveCinemaFbiState,
  shareFbiPostToChannel,
  toCinemaStreamPost,
  toggleFbiAgentConnection,
  toggleFbiClubMembership,
  toggleFbiCommentLike,
  toggleFbiPostBookmark,
  toggleFbiPostReaction,
  type CinemaFbiSocialState,
  type FbiChatAttachment,
  type FbiCinemaAgent,
  type FbiCinemaPost,
  type FbiSocialTabId,
} from '../../utils/cinemaFbiSocialRules';
import { FuiTypewriter } from './FuiTypewriter';
import { FuiWindowFrame } from './FuiWindowFrame';

interface CinemaFbiSocialWorldProps {
  activeRoomId: CinemaRoomId;
  onPlayStreamInHub: (post: UndergroundStreamPost) => void;
  onBack: () => void;
}

const SESSION_UNLOCK_KEY = 'aipetros_cineos_unlocked_v2';

const ROOM_LABELS: Record<CinemaRoomId, string> = {
  movie: 'فیلم سینمایی',
  series: 'سریال',
  anime: 'انیمه',
  documentary: 'مستند',
  'tv-climax': 'تلویزیون و کلایمکس',
};

const WINDOW_CODES: Record<FbiSocialTabId, { code: string; title: string; sub: string }> = {
  feed: {
    code: 'FEED_01.WIN',
    title: 'فید پست‌ها و فیلم‌ها',
    sub: 'پست‌های سینمایی، لایک، کامنت و پخش مستقیم',
  },
  chat: {
    code: 'DIRECT_02.WIN',
    title: 'چت و دایرکت خصوصی',
    sub: 'گفتگو، ارسال مستقیم فیلم و لینک استریم',
  },
  friends: {
    code: 'PEOPLE_03.WIN',
    title: 'دوستان و کاربران سینما',
    sub: 'جستجو، افزودن دوست و پروفایل‌ها',
  },
  clubs: {
    code: 'CLUBS_04.WIN',
    title: 'کلاب‌ها و گروه‌های فیلم',
    sub: 'عضویت در کلاب و اشتراک فیلم داخل گروه',
  },
};

export const CinemaFbiSocialWorld: React.FC<CinemaFbiSocialWorldProps> = ({
  activeRoomId,
  onPlayStreamInHub,
  onBack,
}) => {
  const [fbiState, setFbiState] = useState<CinemaFbiSocialState>(() => loadCinemaFbiState());

  // Secret OS Lock Gate State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (window.location.search.includes('autostart=1')) return true;
    return window.sessionStorage.getItem(SESSION_UNLOCK_KEY) === '1';
  });
  const [passcodeInput, setPasscodeInput] = useState<string>('4091');
  const [isDecodingBoot, setIsDecodingBoot] = useState<boolean>(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // Desktop Multi-Window OS State
  const [focusedWindow, setFocusedWindow] = useState<'main' | 'chat'>('main');
  const [maximizedWindow, setMaximizedWindow] = useState<'main' | 'chat' | null>(null);
  const [companionChatOpen, setCompanionChatOpen] = useState<boolean>(true);
  const [bootAnnouncementKey, setBootAnnouncementKey] = useState<number>(1);

  // Feed Filters & Search
  const [feedFilter, setFeedFilter] = useState<'all' | 'movie-doc' | 'series-anime' | 'vault'>('all');
  const [feedSearch, setFeedSearch] = useState('');
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [openCommentsMap, setOpenCommentsMap] = useState<Record<string, boolean>>({
    'fbi-post-1': true,
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openSharePostId, setOpenSharePostId] = useState<string | null>(null);
  const [dmShareTargetByPost, setDmShareTargetByPost] = useState<Record<string, string>>({});
  const [actionToastByPost, setActionToastByPost] = useState<Record<string, string>>({});

  // Create Post OS Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newFilmTitle, setNewFilmTitle] = useState('');
  const [newClubName, setNewClubName] = useState('کلاب سینمای ۴K');
  const [newRoomId, setNewRoomId] = useState<CinemaRoomId>(activeRoomId);
  const [newStreamUrl, setNewStreamUrl] = useState('');
  const [newTelegramChannel, setNewTelegramChannel] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState(FBI_EVIDENCE_PRESETS[1].url);
  const [newVideoPreviewUrl, setNewVideoPreviewUrl] = useState('');
  const [newForceSpoiler, setNewForceSpoiler] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Chat & Direct Messages State
  const [activeChannelId, setActiveChannelId] = useState<string>('dm-ag-2');
  const [chatInput, setChatInput] = useState('');
  const [chatConfidential, setChatConfidential] = useState(true);
  const [chatFilmDrawerOpen, setChatFilmDrawerOpen] = useState(false);
  const [chatFilmTitle, setChatFilmTitle] = useState('');
  const [chatFilmUrl, setChatFilmUrl] = useState('');
  const [chatFilmRoomId, setChatFilmRoomId] = useState<CinemaRoomId>(activeRoomId);
  const [chatPendingAttachment, setChatPendingAttachment] = useState<FbiChatAttachment | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [latestTypedMsgId, setLatestTypedMsgId] = useState<string>('fmsg-3');

  // Friends State & Profile Window
  const [friendSearch, setFriendSearch] = useState('');
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'friends'>('all');
  const [selectedProfileAgent, setSelectedProfileAgent] = useState<FbiCinemaAgent | null>(null);

  // Clubs State
  const [clubDispatchDrafts, setClubDispatchDrafts] = useState<Record<string, string>>({});
  const [clubFilmUrlDrafts, setClubFilmUrlDrafts] = useState<Record<string, string>>({});
  const [clubFilmTitleDrafts, setClubFilmTitleDrafts] = useState<Record<string, string>>({});
  const [openClubFilmBar, setOpenClubFilmBar] = useState<Record<string, boolean>>({});
  const [clubErrorById, setClubErrorById] = useState<Record<string, string>>({});
  const [showCreateClubForm, setShowCreateClubForm] = useState(false);
  const [createClubName, setCreateClubName] = useState('');
  const [createClubTag, setCreateClubTag] = useState('');
  const [createClubMotto, setCreateClubMotto] = useState('');

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const postFileInputRef = useRef<HTMLInputElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const rootScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveCinemaFbiState(fbiState);
  }, [fbiState]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [fbiState.messages.length, activeChannelId, fbiState.activeTab, companionChatOpen]);

  const friendsCount = useMemo(
    () => fbiState.agents.filter((a) => a.isFriend).length,
    [fbiState.agents]
  );

  const savedPostsCount = useMemo(
    () => fbiState.posts.filter((p) => p.bookmarkedByMe).length,
    [fbiState.posts]
  );

  const joinedClubs = useMemo(
    () => fbiState.clubs.filter((c) => c.isJoined),
    [fbiState.clubs]
  );

  const filteredPosts = useMemo(() => {
    const q = feedSearch.trim().toLowerCase();
    return fbiState.posts.filter((p) => {
      if (feedFilter === 'movie-doc' && p.roomId !== 'movie' && p.roomId !== 'documentary') {
        return false;
      }
      if (
        feedFilter === 'series-anime' &&
        p.roomId !== 'series' &&
        p.roomId !== 'anime' &&
        p.roomId !== 'tv-climax'
      ) {
        return false;
      }
      if (feedFilter === 'vault' && !p.bookmarkedByMe) {
        return false;
      }
      if (!q) return true;
      return (
        p.authorDisplayNameFa.toLowerCase().includes(q) ||
        p.filmTitleTag.toLowerCase().includes(q) ||
        p.divisionFa.toLowerCase().includes(q) ||
        p.captionFa.toLowerCase().includes(q)
      );
    });
  }, [fbiState.posts, feedFilter, feedSearch]);

  const filteredAgents = useMemo(() => {
    const q = friendSearch.trim().toLowerCase();
    return fbiState.agents.filter((ag) => {
      if (friendFilter === 'online' && ag.onlineStatus !== 'ACTIVE' && ag.onlineStatus !== 'FIELD') {
        return false;
      }
      if (friendFilter === 'friends' && !ag.isFriend) return false;
      if (!q) return true;
      return (
        ag.displayNameFa.toLowerCase().includes(q) ||
        ag.handle.toLowerCase().includes(q) ||
        ag.divisionFa.toLowerCase().includes(q) ||
        ag.favoriteFilmFa.toLowerCase().includes(q)
      );
    });
  }, [fbiState.agents, friendFilter, friendSearch]);

  const activeChannelMeta = useMemo(() => {
    if (activeChannelId === 'bureau-global') {
      return {
        title: 'چت عمومی سینما',
        subtitle: 'همه اعضای آنلاین · گفتگو و اشتراک لینک فیلم',
        isDm: false,
      };
    }
    if (activeChannelId.startsWith('club-')) {
      const clubId = activeChannelId.replace('club-', '');
      const club = fbiState.clubs.find((c) => c.id === clubId);
      return {
        title: club ? club.name : 'چت کلاب',
        subtitle: club ? `${club.membersCount} عضو · ${club.divisionFa}` : 'چت گروهی کلاب',
        isDm: false,
      };
    }
    if (activeChannelId.startsWith('dm-')) {
      const agId = activeChannelId.replace('dm-', '');
      const ag = fbiState.agents.find((a) => a.id === agId);
      return {
        title: ag ? `دایرکت با ${ag.displayNameFa}` : 'چت خصوصی',
        subtitle: ag ? `@${ag.handle} · ${ag.divisionFa}` : 'پیام خصوصی امن',
        isDm: true,
      };
    }
    return {
      title: 'چت عمومی',
      subtitle: 'ارسال متن، عکس و لینک مستقیم فیلم',
      isDm: false,
    };
  }, [activeChannelId, fbiState.clubs, fbiState.agents]);

  const visibleMessages = useMemo(
    () => fbiState.messages.filter((m) => m.channelId === activeChannelId),
    [fbiState.messages, activeChannelId]
  );

  // Unlock sequence handler
  const handleUnlockSystem = (quickCode?: string) => {
    const code = (quickCode ?? passcodeInput).trim();
    if (code.length < 3) {
      setLockError('حداقل ۴ کاراکتر یا عدد وارد کنید یا ورود سریع را بزنید.');
      return;
    }
    setLockError(null);
    setIsDecodingBoot(true);
    window.setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_UNLOCK_KEY, '1');
      }
      setIsDecodingBoot(false);
      setIsUnlocked(true);
      setBootAnnouncementKey((k) => k + 1);
    }, 320);
  };

  const handleLockSystem = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    }
    setIsUnlocked(false);
    setPasscodeInput('4091');
  };

  const showToast = (postId: string, text: string) => {
    setActionToastByPost((prev) => ({ ...prev, [postId]: text }));
    window.setTimeout(() => {
      setActionToastByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }, 2600);
  };

  const switchMainTab = (tab: FbiSocialTabId) => {
    setFbiState((prev) => ({ ...prev, activeTab: tab }));
    if (tab === 'chat') {
      setCompanionChatOpen(true);
      setFocusedWindow('chat');
      setMaximizedWindow(null);
    } else {
      setFocusedWindow('main');
      if (maximizedWindow === 'chat') setMaximizedWindow(null);
    }
    if (rootScrollRef.current) {
      rootScrollRef.current.scrollTop = 0;
    }
  };

  const openPrivateDmWithAgent = (agent: FbiCinemaAgent) => {
    setActiveChannelId(`dm-${agent.id}`);
    setChatConfidential(true);
    setCompanionChatOpen(true);
    setFocusedWindow('chat');
    setSelectedProfileAgent(null);
    // On mobile (< lg), switch active tab to chat so user sees the DM window immediately
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setFbiState((prev) => ({ ...prev, activeTab: 'chat' }));
    }
  };

  const handleCommentSubmit = (postId: string) => {
    const draft = (commentInputs[postId] ?? '').trim();
    if (!draft) return;
    setFbiState((prev) => addFbiPostComment(prev, postId, draft));
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setOpenCommentsMap((prev) => ({ ...prev, [postId]: true }));
  };

  const handleShareCopy = (post: FbiCinemaPost) => {
    const shareText = `${post.filmTitleTag} | ${post.streamUrl ?? 'cine-os://post/' + post.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setFbiState((prev) => shareFbiPostToChannel(prev, post.id, 'bureau-global'));
    showToast(post.id, 'لینک فیلم کپی و در چت عمومی منتشر شد.');
    setOpenSharePostId(null);
  };

  const handleShareToChannel = (post: FbiCinemaPost, channelId: string, label: string) => {
    setFbiState((prev) =>
      shareFbiPostToChannel(prev, post.id, channelId, {
        isConfidential: channelId.startsWith('dm-'),
      })
    );
    showToast(post.id, label);
    setOpenSharePostId(null);
    if (channelId.startsWith('dm-') || channelId === 'bureau-global') {
      setActiveChannelId(channelId);
      setCompanionChatOpen(true);
      setFocusedWindow('chat');
    }
  };

  const handleSendChat = (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    setChatError(null);
    const text = typeof overrideText === 'string' ? overrideText : chatInput;

    let attachmentToSend = chatPendingAttachment ?? undefined;
    if (!attachmentToSend && chatFilmDrawerOpen && chatFilmUrl.trim()) {
      attachmentToSend = {
        kind: 'film_stream',
        titleFa: chatFilmTitle.trim() || 'لینک مستقیم فیلم',
        url: chatFilmUrl.trim(),
        streamUrl: chatFilmUrl.trim(),
        roomId: chatFilmRoomId,
      };
    }

    const res = appendFbiChatMessage(fbiState, {
      channelId: activeChannelId,
      text,
      isSelf: true,
      isConfidential: chatConfidential || activeChannelId.startsWith('dm-'),
      attachment: attachmentToSend,
    });

    if (!res.ok) {
      setChatError(res.error ?? 'ارسال پیام انجام نشد.');
      return;
    }

    const lastSentId = res.state.messages[res.state.messages.length - 1]?.id;
    if (lastSentId) setLatestTypedMsgId(lastSentId);

    setFbiState(res.state);
    if (typeof overrideText !== 'string') setChatInput('');
    setChatPendingAttachment(null);
    setChatFilmTitle('');
    setChatFilmUrl('');
    setChatFilmDrawerOpen(false);

    const chanSnapshot = activeChannelId;
    const hadFilm = Boolean(attachmentToSend);
    window.setTimeout(() => {
      setFbiState((curr) => {
        const reply = buildFbiAgentAutoReply(curr, text, chanSnapshot, hadFilm);
        setLatestTypedMsgId(reply.id);
        return { ...curr, messages: [...curr.messages, reply].slice(-60) };
      });
    }, 340);
  };

  const handleUploadChatMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      const objectUrl = URL.createObjectURL(file);
      setChatPendingAttachment({
        kind: 'video_file',
        titleFa: file.name,
        url: objectUrl,
        streamUrl: objectUrl,
        format: 'MP4',
        roomId: activeRoomId,
      });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setChatPendingAttachment({
            kind: 'photo_file',
            titleFa: file.name,
            url: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleUploadPostMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      const objectUrl = URL.createObjectURL(file);
      setNewVideoPreviewUrl(objectUrl);
      if (!newStreamUrl.trim()) setNewStreamUrl(objectUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewMediaUrl(reader.result);
          setNewVideoPreviewUrl('');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSubmitNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const res = createFbiFeedPost(fbiState, {
      captionFa: newCaption,
      filmTitleTag: newFilmTitle || `${ROOM_LABELS[newRoomId]} · پخش مستقیم`,
      divisionFa: newClubName,
      roomId: newRoomId,
      mediaUrl: newMediaUrl,
      videoPreviewUrl: newVideoPreviewUrl || undefined,
      streamUrl: newStreamUrl || undefined,
      telegramChannel: newTelegramChannel || undefined,
      forceSpoiler: newForceSpoiler,
    });
    if (!res.ok) {
      setCreateError(res.error ?? 'اطلاعات پست را بررسی کنید.');
      return;
    }
    setFbiState(res.state);
    setIsCreateModalOpen(false);
    setNewCaption('');
    setNewFilmTitle('');
    setNewStreamUrl('');
    setNewTelegramChannel('');
    setNewVideoPreviewUrl('');
    setNewForceSpoiler(false);
    switchMainTab('feed');
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (createClubName.trim().length < 2 || createClubTag.trim().length < 2) return;
    setFbiState((prev) =>
      createFbiDivisionClub(prev, {
        name: createClubName,
        tag: createClubTag,
        mottoFa: createClubMotto,
      })
    );
    setCreateClubName('');
    setCreateClubTag('');
    setCreateClubMotto('');
    setShowCreateClubForm(false);
  };

  const handleClubDispatchSubmit = (clubId: string) => {
    const text = (clubDispatchDrafts[clubId] ?? '').trim();
    const streamUrl = (clubFilmUrlDrafts[clubId] ?? '').trim();
    const filmTitleFa = (clubFilmTitleDrafts[clubId] ?? '').trim();
    setClubErrorById((prev) => {
      const next = { ...prev };
      delete next[clubId];
      return next;
    });

    const res = postFbiClubDispatch(fbiState, clubId, {
      text,
      streamUrl: streamUrl || undefined,
      filmTitleFa: filmTitleFa || undefined,
      roomId: activeRoomId,
    });

    if (!res.ok) {
      setClubErrorById((prev) => ({ ...prev, [clubId]: res.error ?? 'خطا در ارسال پیام کلاب' }));
      return;
    }

    setFbiState(res.state);
    setClubDispatchDrafts((prev) => ({ ...prev, [clubId]: '' }));
    setClubFilmUrlDrafts((prev) => ({ ...prev, [clubId]: '' }));
    setClubFilmTitleDrafts((prev) => ({ ...prev, [clubId]: '' }));
    setOpenClubFilmBar((prev) => ({ ...prev, [clubId]: false }));
  };

  const tabItems: Array<{ id: FbiSocialTabId; label: string; count?: number }> = [
    { id: 'feed', label: 'پست‌ها و فیلم‌ها', count: fbiState.posts.length },
    { id: 'chat', label: 'چت و دایرکت', count: fbiState.messages.length },
    { id: 'friends', label: 'دوستان', count: friendsCount },
    { id: 'clubs', label: 'کلاب‌ها', count: fbiState.clubs.length },
  ];

  // Reusable Live Chat & Directs Panel Renderer (renders inside Desktop Companion Window OR Full Chat Window)
  const renderChatWindowBody = (compact = false) => (
    <div className="flex flex-col h-full min-h-0">
      {/* Active Conversation Bar */}
      <div className="px-3.5 py-2.5 border-b border-[#16273B] bg-[#08101C] flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold text-white truncate">
            <FuiTypewriter key={activeChannelId} text={activeChannelMeta.title} speedMs={18} showCursor={false} />
          </p>
          <p className="text-[11px] text-[#8FA8C8] truncate">{activeChannelMeta.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setChatConfidential((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold transition cursor-pointer shrink-0 ${
            chatConfidential || activeChannelMeta.isDm
              ? 'border-[#F59E0B]/55 bg-[#F59E0B]/12 text-[#FDE68A]'
              : 'border-[#1E334D] bg-[#0B1422] text-[#9CB2CE]'
          }`}
        >
          <Lock className="w-3 h-3" />
          <span>{chatConfidential || activeChannelMeta.isDm ? 'چت رمزنگاری‌شده' : 'چت عادی'}</span>
        </button>
      </div>

      {/* Wrapped Channels: Public + Clubs + Friends DM */}
      <div className="px-3 py-2 border-b border-[#16273B] bg-[#050A12] flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          data-testid="cinema-chat-channel-global"
          onClick={() => setActiveChannelId('bureau-global')}
          className={`px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap transition cursor-pointer border ${
            activeChannelId === 'bureau-global'
              ? 'bg-[#38BDF8] text-slate-950 border-[#38BDF8]'
              : 'bg-[#0C1625] border-[#1B2D44] text-[#9CB2CE] hover:text-white'
          }`}
        >
          چت عمومی
        </button>

        {fbiState.clubs.map((c) => {
          const chId = `club-${c.id}`;
          const active = activeChannelId === chId;
          return (
            <button
              key={c.id}
              type="button"
              data-testid={`cinema-chat-channel-club-${c.id}`}
              onClick={() => setActiveChannelId(chId)}
              className={`px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap transition cursor-pointer border ${
                active
                  ? 'bg-[#F59E0B] text-slate-950 border-[#F59E0B]'
                  : 'bg-[#0C1625] border-[#1B2D44] text-[#9CB2CE] hover:text-white'
              }`}
            >
              کلاب {c.tag}
            </button>
          );
        })}

        {fbiState.agents.map((ag) => {
          const chId = `dm-${ag.id}`;
          const active = activeChannelId === chId;
          return (
            <button
              key={ag.id}
              type="button"
              data-testid={`cinema-chat-channel-dm-${ag.id}`}
              onClick={() => setActiveChannelId(chId)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap transition cursor-pointer border ${
                active
                  ? 'bg-emerald-400 text-slate-950 border-emerald-400'
                  : 'bg-[#0C1625] border-[#1B2D44] text-[#9CB2CE] hover:text-white'
              }`}
            >
              <img
                src={ag.avatarUrl}
                alt={ag.displayNameFa}
                referrerPolicy="no-referrer"
                className="w-4 h-4 object-cover"
              />
              <span>{ag.displayNameFa.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Feed */}
      <div
        ref={chatScrollRef}
        className={`${
          compact ? 'h-[330px] xl:h-[395px]' : 'h-[360px] sm:h-[430px]'
        } overflow-y-auto p-3.5 space-y-3`}
      >
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#8FA8C8] space-y-1.5">
            <MessageSquare className="w-6 h-6 text-[#38BDF8]" />
            <p className="text-[13px] font-bold text-white">هنوز پیامی ارسال نشده</p>
            <p className="text-[11.5px] max-w-xs">
              یک پیام بنویسید یا از پایین مستقیم لینک فیلم، عکس یا ویدیو بفرستید.
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const shouldType = msg.id === latestTypedMsgId && !msg.isSelf;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isSelf ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[88%] p-3 border ${
                    msg.isSelf
                      ? 'bg-[#0B2036]/90 border-[#38BDF8]/40 text-white'
                      : 'bg-[#0B131F]/95 border-[#1D314A] text-slate-100'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-1.5">
                    <span className="font-bold text-[#F59E0B]">@{msg.senderHandle}</span>
                    <span className="text-[#6F88A8]">·</span>
                    <span className="font-mono-tabular text-[#8FA8C8]">{msg.senderTag}</span>
                    {msg.isConfidential && (
                      <>
                        <span className="text-[#6F88A8]">·</span>
                        <span className="text-amber-300">خصوصی</span>
                      </>
                    )}
                    <span className="text-[#6F88A8]">·</span>
                    <span className="font-mono-tabular text-[#7A92B2]">{msg.timestamp}</span>
                  </div>

                  <p className="text-[13px] leading-relaxed text-slate-100">
                    {shouldType ? (
                      <FuiTypewriter key={msg.id} text={msg.text} speedMs={15} />
                    ) : (
                      msg.text
                    )}
                  </p>

                  {msg.attachment && (
                    <div className="mt-2.5 border border-[#1E334D] bg-[#050A12] overflow-hidden">
                      {msg.attachment.kind === 'photo_file' && (
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.titleFa}
                          referrerPolicy="no-referrer"
                          className="w-full max-h-48 object-cover"
                        />
                      )}
                      {msg.attachment.kind === 'video_file' && (
                        <video
                          src={msg.attachment.url}
                          controls
                          playsInline
                          className="w-full max-h-48 object-contain bg-black"
                        />
                      )}
                      {msg.attachment.kind !== 'photo_file' && msg.attachment.kind !== 'video_file' && (
                        <div className="p-2.5 flex items-center justify-between gap-2.5">
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-white flex items-center gap-1.5 truncate">
                              <Film className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                              <span className="truncate">{msg.attachment.titleFa}</span>
                            </p>
                            <p dir="ltr" className="font-mono-tabular text-[10.5px] text-[#7DD3FC] truncate">
                              {msg.attachment.format ?? 'STREAM'} · {msg.attachment.url}
                            </p>
                          </div>
                          {msg.attachment.kind !== 'dossier_ref' && (
                            <button
                              type="button"
                              onClick={() =>
                                onPlayStreamInHub(
                                  toCinemaStreamPost({
                                    id: msg.id,
                                    roomId: msg.attachment?.roomId ?? activeRoomId,
                                    titleFa: msg.attachment?.titleFa ?? 'فیلم ارسال‌شده در چت',
                                    captionFa: msg.text,
                                    streamUrl:
                                      msg.attachment?.streamUrl ?? msg.attachment?.url ?? '',
                                    streamFormat: msg.attachment?.format,
                                    authorHandle: msg.senderHandle,
                                    authorTag: msg.senderTag,
                                  })
                                )
                              }
                              className="inline-flex items-center gap-1 h-8 px-2.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[11px] font-extrabold cursor-pointer shrink-0"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>پخش در سالن</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chat Attachment Toolbar & Film Sender */}
      <div className="border-t border-[#16273B] bg-[#08101C] p-3 space-y-2.5 mt-auto">
        {chatPendingAttachment && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0C1829] border border-[#38BDF8]/40 text-[11.5px]">
            <span className="text-[#7DD3FC] truncate">
              پیوست آماده ارسال: {chatPendingAttachment.titleFa}
            </span>
            <button
              type="button"
              onClick={() => setChatPendingAttachment(null)}
              className="text-rose-300 hover:text-rose-200 font-bold cursor-pointer"
            >
              حذف
            </button>
          </div>
        )}

        {chatFilmDrawerOpen && (
          <div className="p-2.5 border border-[#1E334D] bg-[#050A12] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#F59E0B]">
                ارسال مستقیم لینک فیلم در {activeChannelMeta.isDm ? 'دایرکت خصوصی' : 'چت'}
              </span>
              <button
                type="button"
                onClick={() => setChatFilmDrawerOpen(false)}
                className="text-[11px] text-[#8FA8C8] hover:text-white cursor-pointer"
              >
                بستن
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                data-testid="cinema-chat-film-title-input"
                value={chatFilmTitle}
                onChange={(e) => setChatFilmTitle(e.target.value)}
                placeholder="اسم فیلم یا ویدیو (مثلاً Heat 4K)"
                className="h-9 px-2.5 bg-[#0A1320] border border-[#1E334D] text-[12px] text-white outline-none focus:border-[#F59E0B]"
              />
              <input
                type="text"
                dir="ltr"
                data-testid="cinema-chat-film-url-input"
                value={chatFilmUrl}
                onChange={(e) => setChatFilmUrl(e.target.value)}
                placeholder="https://...m3u8 یا .mp4 یا لینک تلگرام"
                className="h-9 px-2.5 bg-[#0A1320] border border-[#1E334D] font-mono-tabular text-[11.5px] text-[#7DD3FC] outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-[#8FA8C8]">دسته سالن:</span>
              <select
                value={chatFilmRoomId}
                onChange={(e) => setChatFilmRoomId(e.target.value as CinemaRoomId)}
                className="h-7 px-2 bg-[#0A1320] border border-[#1E334D] text-white text-[11px]"
              >
                {Object.entries(ROOM_LABELS).map(([rid, rlabel]) => (
                  <option key={rid} value={rid}>
                    {rlabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {chatError && (
          <p className="text-[11.5px] text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5">
            {chatError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="cinema-chat-attach-film-btn"
            onClick={() => setChatFilmDrawerOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 border text-[11.5px] font-bold transition cursor-pointer ${
              chatFilmDrawerOpen
                ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                : 'border-[#1E334D] bg-[#0B1422] text-slate-200 hover:border-[#38BDF8]/50'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>ارسال لینک فیلم</span>
          </button>

          <input
            ref={chatFileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleUploadChatMedia}
            className="hidden"
          />
          <button
            type="button"
            data-testid="cinema-chat-attach-media-btn"
            onClick={() => chatFileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 border border-[#1E334D] bg-[#0B1422] hover:border-[#38BDF8]/50 text-[11.5px] font-bold text-slate-200 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>آپلود عکس یا ویدیو</span>
          </button>
        </div>

        <form onSubmit={(e) => handleSendChat(e)} className="flex items-center gap-2">
          <input
            type="text"
            data-testid="cinema-social-chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              activeChannelMeta.isDm
                ? 'پیام خصوصی یا لینک فیلم را بنویسید...'
                : 'پیام خود را بنویسید...'
            }
            className="flex-1 h-10 px-3 bg-[#050A12] border border-[#1E334D] text-[13px] text-white placeholder:text-[#6B84A5] outline-none focus:border-[#38BDF8]"
          />
          <button
            type="submit"
            data-testid="cinema-social-chat-send-btn"
            className="inline-flex items-center gap-1.5 h-10 px-4 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[12.5px] font-extrabold transition cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ارسال</span>
          </button>
        </form>
      </div>
    </div>
  );

  // ============================================================================
  // GATE 1: SECRET HOLLYWOOD OS PASSCODE LOCK SCREEN
  // ============================================================================
  if (!isUnlocked) {
    return (
      <div
        data-testid="cinema-os-lock-screen"
        dir="rtl"
        style={{ fontFamily: "'Vazirmatn', var(--font-sans)" }}
        className="relative w-full h-dvh overflow-y-auto bg-[#03070D] text-slate-100 flex items-center justify-center p-4"
      >
        <div className="fixed inset-0 pointer-events-none">
          <img
            src="/src/assets/images/fbi_command_backdrop_1795259261383.jpg"
            alt="ورود به شبکه سینمایی CINE-OS"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-20"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(14,34,60,0.45) 0%, rgba(3,7,13,0.96) 72%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(rgba(56,189,248,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.09) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <FuiWindowFrame
            windowCode="AUTH_GATE.OS"
            titleFa="ورود به شبکه اجتماعی سینما (CINE-OS)"
            subtitleFa="سیستم اختصاصی چت، ارسال فیلم و کلاب‌ها"
            accentColor="cyan"
            headerRight={
              <button
                type="button"
                onClick={onBack}
                className="text-[11px] font-bold text-[#9CB2CE] hover:text-white px-2 py-1 border border-[#1E334D] cursor-pointer"
              >
                بازگشت
              </button>
            }
          >
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#38BDF8] text-[12px] font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>احراز هویت سیستم</span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-slate-200 min-h-[2.6rem]">
                  <FuiTypewriter
                    text={
                      isDecodingBoot
                        ? 'کد تایید شد — در حال باز کردن پنجره‌های چت، پست‌ها و کلاب‌های سینما...'
                        : 'برای ورود به سیستم مخفی سینما رمز دسترسی را وارد کنید یا مستقیم ورود سریع را بزنید.'
                    }
                    speedMs={16}
                  />
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[11.5px] text-[#8FA8C8]">
                  رمز عبور سیستم (کد پیش‌فرض: <span dir="ltr" className="font-mono-tabular text-[#F59E0B]">4091</span>)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    dir="ltr"
                    data-testid="cinema-os-passcode-input"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUnlockSystem();
                    }}
                    placeholder="4091"
                    className="flex-1 h-11 px-3.5 bg-[#040911] border border-[#244060] text-center font-mono-tabular text-[18px] tracking-[0.45em] text-[#38BDF8] outline-none focus:border-[#F59E0B]"
                  />
                  <button
                    type="button"
                    onClick={() => setPasscodeInput('')}
                    className="h-11 px-3 border border-[#1E334D] bg-[#0B1422] text-[12px] font-bold text-[#9CB2CE] hover:text-white cursor-pointer"
                  >
                    پاک
                  </button>
                </div>

                {/* Numeric Keypad for authentic spy-computer feel */}
                <div className="grid grid-cols-5 gap-1.5 pt-1" dir="ltr">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() =>
                        setPasscodeInput((prev) => (prev.length >= 6 ? digit : prev + digit))
                      }
                      className="h-9 border border-[#1B2F48] bg-[#0A1320] hover:border-[#38BDF8] hover:bg-[#102035] font-mono-tabular text-[13px] font-bold text-slate-100 transition cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              </div>

              {lockError && (
                <p className="text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/35 px-3 py-2">
                  {lockError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  data-testid="cinema-os-unlock-btn"
                  disabled={isDecodingBoot}
                  onClick={() => handleUnlockSystem()}
                  className="flex-1 h-11 px-4 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[13px] font-extrabold inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isDecodingBoot ? 'در حال باز کردن سیستم...' : 'باز کردن سیستم و ورود'}</span>
                </button>
                <button
                  type="button"
                  disabled={isDecodingBoot}
                  onClick={() => handleUnlockSystem('4091')}
                  className="h-11 px-4 border border-[#38BDF8]/50 bg-[#38BDF8]/12 hover:bg-[#38BDF8]/20 text-[#7DD3FC] text-[12.5px] font-bold cursor-pointer whitespace-nowrap"
                >
                  ورود سریع
                </button>
              </div>
            </div>
          </FuiWindowFrame>
        </div>
      </div>
    );
  }

  // ============================================================================
  // GATE 2: HOLLYWOOD MULTI-WINDOW SECRET OS DESKTOP (CINE-OS)
  // ============================================================================
  const activeWinMeta = WINDOW_CODES[fbiState.activeTab];
  const isFullChatTab = fbiState.activeTab === 'chat';
  const showDesktopSideChat = companionChatOpen && !isFullChatTab && maximizedWindow !== 'main';

  return (
    <div
      ref={rootScrollRef}
      data-testid="cinema-fbi-social-world"
      dir="rtl"
      style={{ fontFamily: "'Vazirmatn', var(--font-sans)" }}
      className="relative w-full h-dvh overflow-y-auto overflow-x-hidden scroll-pt-28 bg-[#03070D] text-slate-100 select-text"
    >
      {/* Tactical FUI Grid & Backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/src/assets/images/fbi_command_backdrop_1795259261383.jpg"
          alt="پس‌زمینه سیستم CINE-OS"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-18"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(3,7,13,0.92) 0%, rgba(3,7,13,0.8) 45%, rgba(3,7,13,0.97) 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-22"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      {/* Top OS Bar — Clean 3-zone desktop + 2x2 non-clipping mobile taskbar */}
      <header className="sticky top-0 z-30 border-b border-[#16273B] bg-[#040911]/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto pl-14 sm:pl-16 pr-3 sm:pr-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Back + Brand Wordmark */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              data-testid="cinema-social-back-btn"
              onClick={onBack}
              aria-label="بازگشت به سالن سینما"
              className="w-9 h-9 border border-[#1E334D] bg-[#0A1320] hover:border-[#38BDF8] flex items-center justify-center text-white transition cursor-pointer shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[15px] sm:text-[17px] font-black tracking-tight text-white whitespace-nowrap shrink-0">
              CINE-OS
            </span>
            <span className="hidden sm:inline text-[12px] text-[#8FA8C8] truncate">
              · شبکه اجتماعی و چت سینما
            </span>
          </div>

          {/* Zone 2: Desktop Window Switcher */}
          <nav
            aria-label="پنجره‌های سیستم"
            className="hidden md:flex items-center gap-1 p-1 bg-[#08101C] border border-[#1A2D45]"
          >
            {tabItems.map((tab) => {
              const active = fbiState.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`cinema-social-tab-${tab.id}`}
                  onClick={() => switchMainTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    active
                      ? 'bg-[#38BDF8] text-slate-950'
                      : 'text-[#9CB2CE] hover:text-white hover:bg-[#0E1A2C]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`font-mono-tabular text-[11px] ${
                        active ? 'text-slate-900' : 'text-[#6F88A8]'
                      }`}
                    >
                      ({tab.count})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Lock Toggle + Primary Post/Film Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLockSystem}
              aria-label="قفل کردن صفحه رمز سیستم"
              className="hidden sm:inline-flex items-center gap-1 h-9 px-2.5 border border-[#1E334D] bg-[#0A1320] hover:border-[#38BDF8]/50 text-[#9CB2CE] hover:text-white text-[11.5px] font-bold transition cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>قفل</span>
            </button>

            <button
              type="button"
              data-testid="cinema-social-new-post-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[12.5px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>پست / ارسال فیلم</span>
            </button>
          </div>
        </div>

        {/* Mobile 2x2 Non-Clipping Window Switcher (< md) */}
        <div className="md:hidden grid grid-cols-2 gap-1.5 px-3 pb-2.5">
          {tabItems.map((tab) => {
            const active = fbiState.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`cinema-social-mobile-tab-${tab.id}`}
                onClick={() => switchMainTab(tab.id)}
                className={`h-9 px-2.5 text-[11.5px] font-bold border flex items-center justify-between transition cursor-pointer ${
                  active
                    ? 'bg-[#38BDF8] text-slate-950 border-[#38BDF8]'
                    : 'bg-[#09121F] text-[#9CB2CE] border-[#1A2D45]'
                }`}
              >
                <span className="truncate">{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className="font-mono-tabular text-[10.5px] opacity-80">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Secret OS Workspace */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 pt-3 pb-12 space-y-4">
        {/* Live System Banner with Character-by-Character Decoding Text */}
        <div className="border border-[#16273B] bg-[#060C15]/88 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 text-[12px] sm:text-[12.5px] text-[#7DD3FC]">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span className="truncate">
              <FuiTypewriter
                key={`${bootAnnouncementKey}-${fbiState.activeTab}`}
                text={`سیستم آماده است · خوش آمدی ${fbiState.userDisplayNameFa} — می‌توانید پست بگذارید، فیلم بفرستید یا در دایرکت خصوصی چت کنید.`}
                speedMs={16}
              />
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11.5px] text-[#8FA8C8] shrink-0">
            <span>
              امتیاز: <strong data-testid="cinema-social-rep" className="font-mono-tabular text-[#F59E0B]">{fbiState.userRep.toLocaleString('fa-IR')}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              دوستان: <strong className="font-mono-tabular text-white">{friendsCount}</strong>
            </span>
            {!companionChatOpen && !isFullChatTab && (
              <button
                type="button"
                onClick={() => setCompanionChatOpen(true)}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 border border-[#38BDF8]/50 bg-[#38BDF8]/12 text-[#7DD3FC] text-[11px] font-bold cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" />
                <span>باز کردن پنجره چت</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Window OS Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* PRIMARY OS WINDOW (Feed OR Friends OR Clubs OR Full Chat) */}
          {isFullChatTab ? (
            <div className="lg:col-span-12">
              <FuiWindowFrame
                testId="cinema-social-panel-chat"
                windowCode="DIRECT_02.WIN"
                titleFa="چت و دایرکت خصوصی"
                subtitleFa="گفتگوی گروهی، کلاب‌ها و ارسال مستقیم فیلم در دایرکت"
                accentColor="cyan"
                isActive={true}
              >
                {renderChatWindowBody(false)}
              </FuiWindowFrame>
            </div>
          ) : (
            <div
              className={
                showDesktopSideChat ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-12'
              }
            >
              <FuiWindowFrame
                windowCode={activeWinMeta.code}
                titleFa={activeWinMeta.title}
                subtitleFa={activeWinMeta.sub}
                accentColor={fbiState.activeTab === 'feed' ? 'amber' : 'cyan'}
                isActive={focusedWindow === 'main'}
                isMaximized={maximizedWindow === 'main'}
                onFocus={() => setFocusedWindow('main')}
                onToggleMaximize={() =>
                  setMaximizedWindow((prev) => (prev === 'main' ? null : 'main'))
                }
              >
                {/* ================= WINDOW: FEED ================= */}
                {fbiState.activeTab === 'feed' && (
                  <div data-testid="cinema-social-panel-feed" className="p-3.5 sm:p-4 space-y-4">
                    {/* Quick Share Bar + Filter Controls */}
                    <div className="border border-[#1A2D45] bg-[#08111E] p-3 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src="/src/assets/images/holo_max_noir_1795172673547.jpg"
                            alt={fbiState.userDisplayNameFa}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover border border-[#38BDF8]/40 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-white truncate">
                              پست جدید، نقد فیلم یا لینک پخش بگذارید
                            </p>
                            <p className="text-[11px] text-[#8FA8C8] truncate">
                              @{fbiState.userHandle} · همراه با پشتیبانی ویدیو و لینک تلگرام
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid="cinema-feed-open-composer-btn"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="h-9 px-3.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>پست یا فیلم جدید</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-[#152438]">
                        <div className="flex flex-wrap items-center gap-1">
                          {(
                            [
                              { id: 'all', label: 'همه پست‌ها' },
                              { id: 'movie-doc', label: 'فیلم و مستند' },
                              { id: 'series-anime', label: 'سریال و انیمه' },
                              { id: 'vault', label: `ذخیره‌شده (${savedPostsCount})` },
                            ] as const
                          ).map((chip) => (
                            <button
                              key={chip.id}
                              type="button"
                              onClick={() => setFeedFilter(chip.id)}
                              className={`px-2.5 py-1 text-[11.5px] font-bold border transition cursor-pointer ${
                                feedFilter === chip.id
                                  ? 'bg-[#38BDF8] text-slate-950 border-[#38BDF8]'
                                  : 'bg-[#0C1625] border-[#1A2D45] text-[#9CB2CE] hover:text-white'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>

                        <div className="relative flex-1 min-w-0">
                          <Search className="w-3.5 h-3.5 text-[#7A92B2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={feedSearch}
                            onChange={(e) => setFeedSearch(e.target.value)}
                            placeholder="جستجو در فیلم‌ها یا متن پست‌ها..."
                            className="w-full h-8 pr-8 pl-2.5 bg-[#050A12] border border-[#1A2D45] text-[12px] text-white placeholder:text-[#6B84A5] outline-none focus:border-[#38BDF8]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Posts List */}
                    {filteredPosts.length === 0 ? (
                      <div className="border border-[#1A2D45] bg-[#08111E] p-8 text-center space-y-2">
                        <p className="text-[14px] font-bold text-white">پستی با این فیلتر پیدا نشد</p>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedFilter('all');
                            setFeedSearch('');
                          }}
                          className="h-8 px-3 border border-[#38BDF8]/50 text-[#7DD3FC] text-[12px] font-bold cursor-pointer"
                        >
                          نمایش همه پست‌ها
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredPosts.map((post) => {
                          const authorAgent = fbiState.agents.find(
                            (a) => a.handle === post.authorHandle
                          );
                          const isSpoilerLocked = post.hasSpoiler && !revealedSpoilers[post.id];
                          const selectedDmId =
                            dmShareTargetByPost[post.id] ?? fbiState.agents[1]?.id ?? 'ag-2';

                          return (
                            <article
                              key={post.id}
                              data-testid={`cinema-social-post-${post.id}`}
                              className="relative border border-[#1B2F48] bg-[#08101C] overflow-hidden"
                            >
                              {/* Post Header */}
                              <div className="p-3.5 flex items-start justify-between gap-2.5">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => authorAgent && setSelectedProfileAgent(authorAgent)}
                                    className="shrink-0 cursor-pointer"
                                    aria-label={`مشاهده پروفایل ${post.authorDisplayNameFa}`}
                                  >
                                    <img
                                      src={post.avatarUrl}
                                      alt={post.authorDisplayNameFa}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 object-cover border border-[#38BDF8]/35"
                                    />
                                  </button>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          authorAgent && setSelectedProfileAgent(authorAgent)
                                        }
                                        className="font-extrabold text-white hover:text-[#F59E0B] transition cursor-pointer"
                                      >
                                        {post.authorDisplayNameFa}
                                      </button>
                                      <span className="text-[#6F88A8]">·</span>
                                      <span className="text-[11.5px] text-[#38BDF8]">
                                        @{post.authorHandle}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8FA8C8] mt-0.5">
                                      <span>{post.divisionFa}</span>
                                      <span aria-hidden="true">·</span>
                                      <span>{ROOM_LABELS[post.roomId]}</span>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-mono-tabular">{post.timestamp}</span>
                                    </div>
                                  </div>
                                </div>

                                {authorAgent && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      data-testid={`cinema-post-dm-${post.id}`}
                                      onClick={() => openPrivateDmWithAgent(authorAgent)}
                                      aria-label={`ارسال پیام خصوصی به ${authorAgent.displayNameFa}`}
                                      className="w-8 h-8 border border-[#1E334D] bg-[#0B1422] hover:border-[#38BDF8] flex items-center justify-center text-[#7DD3FC] cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      data-testid={`cinema-post-add-friend-${post.id}`}
                                      onClick={() =>
                                        setFbiState((prev) =>
                                          toggleFbiAgentConnection(prev, authorAgent.id)
                                        )
                                      }
                                      className={`h-8 px-2.5 border text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                                        authorAgent.isFriend
                                          ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300'
                                          : 'border-[#1E334D] bg-[#0B1422] text-slate-200 hover:border-[#F59E0B]/50'
                                      }`}
                                    >
                                      {authorAgent.isFriend ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>دوست شما</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="w-3 h-3" />
                                          <span>افزودن دوست</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Caption or Click-to-Decrypt Spoiler Shield */}
                              <div className="px-3.5 pb-3">
                                {isSpoilerLocked ? (
                                  <div className="p-3 border border-rose-500/40 bg-rose-950/25 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-[12.5px] font-bold text-rose-200">
                                      این پست حاوی اسپویل داستان فیلم است
                                    </p>
                                    <button
                                      type="button"
                                      data-testid={`cinema-reveal-spoiler-${post.id}`}
                                      onClick={() =>
                                        setRevealedSpoilers((prev) => ({
                                          ...prev,
                                          [post.id]: true,
                                        }))
                                      }
                                      className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[11.5px] font-extrabold cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>نمایش متن اسپویل</span>
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[13.5px] leading-relaxed text-slate-100">
                                    {post.hasSpoiler && revealedSpoilers[post.id] ? (
                                      <FuiTypewriter text={post.captionFa} speedMs={14} />
                                    ) : (
                                      post.captionFa
                                    )}
                                  </p>
                                )}
                              </div>

                              {/* Direct Video Preview OR Cinematic Film Frame */}
                              {post.videoPreviewUrl ? (
                                <div className="relative w-full bg-black border-y border-[#16273B]">
                                  <video
                                    src={post.videoPreviewUrl}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    className="w-full max-h-[340px] object-contain bg-black"
                                  />
                                  <div className="px-3.5 py-2 bg-[#060C15] border-t border-[#16273B] flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[12px] font-bold text-[#F59E0B]">
                                      {post.filmTitleTag}
                                    </span>
                                    <button
                                      type="button"
                                      data-testid={`cinema-post-play-btn-${post.id}`}
                                      onClick={() =>
                                        onPlayStreamInHub(
                                          toCinemaStreamPost({
                                            id: post.id,
                                            roomId: post.roomId,
                                            titleFa: post.filmTitleTag,
                                            captionFa: post.captionFa,
                                            streamUrl: post.streamUrl ?? post.videoPreviewUrl ?? '',
                                            streamFormat: post.streamFormat ?? 'MP4',
                                            authorHandle: post.authorHandle,
                                            telegramChannel: post.telegramChannel,
                                            authorTag: post.authorTag,
                                            likesCount: post.likesCount,
                                            timestampLabel: post.timestamp,
                                          })
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#F59E0B] text-slate-950 text-[11.5px] font-extrabold cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                      <span>پخش در سالن</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                post.mediaUrl && (
                                  <div className="relative w-full aspect-[16/9] bg-[#04070B] border-y border-[#16273B] overflow-hidden">
                                    <img
                                      src={post.mediaUrl}
                                      alt={post.filmTitleTag}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                    <div
                                      aria-hidden="true"
                                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#04070B]/95 via-[#04070B]/45 to-transparent"
                                    />
                                    <div className="absolute bottom-3 right-3.5 left-3.5 flex flex-wrap items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-[13px] font-extrabold text-white truncate">
                                          {post.filmTitleTag}
                                        </p>
                                        {post.telegramChannel && (
                                          <p dir="ltr" className="font-mono-tabular text-[11px] text-[#7DD3FC] truncate">
                                            {post.telegramChannel}
                                          </p>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        data-testid={`cinema-post-play-btn-${post.id}`}
                                        onClick={() =>
                                          onPlayStreamInHub(
                                            toCinemaStreamPost({
                                              id: post.id,
                                              roomId: post.roomId,
                                              titleFa: post.filmTitleTag,
                                              captionFa: post.captionFa,
                                              streamUrl: post.streamUrl ?? '',
                                              streamFormat: post.streamFormat,
                                              authorHandle: post.authorHandle,
                                              telegramChannel: post.telegramChannel,
                                              authorTag: post.authorTag,
                                              likesCount: post.likesCount,
                                              timestampLabel: post.timestamp,
                                            })
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[12px] font-extrabold shadow-lg cursor-pointer whitespace-nowrap"
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        <span>پخش در سالن</span>
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}

                              {/* Social Actions Bar: Like, Dislike, Comment, Save, Share/DM */}
                              <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    data-testid={`cinema-post-like-btn-${post.id}`}
                                    onClick={() =>
                                      setFbiState((prev) =>
                                        toggleFbiPostReaction(prev, post.id, 'like')
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 h-8 px-2.5 border text-[12px] font-bold transition cursor-pointer ${
                                      post.userReaction === 'like'
                                        ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                                        : 'border-[#1A2D45] bg-[#0B1422] text-slate-200 hover:border-[#F59E0B]/40'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span className="font-mono-tabular">
                                      لایک {post.likesCount}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    data-testid={`cinema-post-dislike-btn-${post.id}`}
                                    onClick={() =>
                                      setFbiState((prev) =>
                                        toggleFbiPostReaction(prev, post.id, 'dislike')
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 h-8 px-2.5 border text-[12px] font-bold transition cursor-pointer ${
                                      post.userReaction === 'dislike'
                                        ? 'border-rose-500 bg-rose-500/15 text-rose-300'
                                        : 'border-[#1A2D45] bg-[#0B1422] text-[#9CB2CE] hover:text-white'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                    <span className="font-mono-tabular">{post.dislikesCount}</span>
                                  </button>

                                  <button
                                    type="button"
                                    data-testid={`cinema-post-comment-toggle-${post.id}`}
                                    onClick={() =>
                                      setOpenCommentsMap((prev) => ({
                                        ...prev,
                                        [post.id]: !prev[post.id],
                                      }))
                                    }
                                    className={`inline-flex items-center gap-1.5 h-8 px-2.5 border text-[12px] font-bold transition cursor-pointer ${
                                      openCommentsMap[post.id]
                                        ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#7DD3FC]'
                                        : 'border-[#1A2D45] bg-[#0B1422] text-slate-200 hover:border-[#38BDF8]/40'
                                    }`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="font-mono-tabular">
                                      کامنت {post.comments.length}
                                    </span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    data-testid={`cinema-post-bookmark-${post.id}`}
                                    onClick={() =>
                                      setFbiState((prev) => toggleFbiPostBookmark(prev, post.id))
                                    }
                                    aria-label="ذخیره پست"
                                    className={`inline-flex items-center justify-center w-8 h-8 border transition cursor-pointer ${
                                      post.bookmarkedByMe
                                        ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                                        : 'border-[#1A2D45] bg-[#0B1422] text-[#9CB2CE] hover:text-white'
                                    }`}
                                  >
                                    <Bookmark
                                      className={`w-3.5 h-3.5 ${
                                        post.bookmarkedByMe ? 'fill-current' : ''
                                      }`}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    data-testid={`cinema-post-share-btn-${post.id}`}
                                    onClick={() =>
                                      setOpenSharePostId((curr) =>
                                        curr === post.id ? null : post.id
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 h-8 px-2.5 border border-[#1A2D45] bg-[#0B1422] hover:border-[#38BDF8]/40 text-[12px] font-bold text-slate-200 transition cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>اشتراک و دایرکت</span>
                                  </button>
                                </div>
                              </div>

                              {actionToastByPost[post.id] && (
                                <div className="px-3.5 py-2 bg-emerald-500/12 border-t border-emerald-500/25 text-[12px] font-bold text-emerald-300">
                                  <FuiTypewriter text={actionToastByPost[post.id]} speedMs={15} showCursor={false} />
                                </div>
                              )}

                              {/* Share & Direct Private Send Drawer */}
                              {openSharePostId === post.id && (
                                <div className="px-3.5 py-3 bg-[#060C15] border-t border-[#16273B] space-y-2.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleShareCopy(post)}
                                      className="h-8 px-3 border border-[#1E334D] bg-[#0B1422] hover:border-[#38BDF8] text-[11.5px] font-bold text-slate-100 cursor-pointer"
                                    >
                                      کپی لینک فیلم
                                    </button>
                                    <button
                                      type="button"
                                      data-testid={`cinema-share-global-${post.id}`}
                                      onClick={() =>
                                        handleShareToChannel(
                                          post,
                                          'bureau-global',
                                          'پست به چت عمومی ارسال شد.'
                                        )
                                      }
                                      className="h-8 px-3 bg-[#38BDF8] text-slate-950 text-[11.5px] font-extrabold cursor-pointer"
                                    >
                                      ارسال در چت عمومی
                                    </button>
                                    {joinedClubs.map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() =>
                                          handleShareToChannel(
                                            post,
                                            `club-${c.id}`,
                                            `به ${c.name} ارسال شد.`
                                          )
                                        }
                                        className="h-8 px-3 border border-[#F59E0B]/40 bg-[#F59E0B]/12 text-[#FDE68A] text-[11.5px] font-bold cursor-pointer"
                                      >
                                        ارسال به کلاب {c.tag}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#132234]">
                                    <span className="text-[11.5px] font-bold text-[#9CB2CE]">
                                      ارسال خصوصی برای دوست:
                                    </span>
                                    <select
                                      data-testid={`cinema-forward-dm-select-${post.id}`}
                                      value={selectedDmId}
                                      onChange={(e) =>
                                        setDmShareTargetByPost((prev) => ({
                                          ...prev,
                                          [post.id]: e.target.value,
                                        }))
                                      }
                                      className="h-8 px-2.5 bg-[#0A1320] border border-[#1E334D] text-[12px] text-white outline-none"
                                    >
                                      {fbiState.agents.map((ag) => (
                                        <option key={ag.id} value={ag.id}>
                                          {ag.displayNameFa} (@{ag.handle})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      data-testid={`cinema-forward-dm-btn-${post.id}`}
                                      onClick={() => {
                                        const target = fbiState.agents.find(
                                          (a) => a.id === selectedDmId
                                        );
                                        handleShareToChannel(
                                          post,
                                          `dm-${selectedDmId}`,
                                          `فیلم به دایرکت خصوصی ${target?.displayNameFa ?? 'دوست شما'} ارسال شد.`
                                        );
                                      }}
                                      className="h-8 px-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[11.5px] font-extrabold cursor-pointer"
                                    >
                                      ارسال در دایرکت
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Comments Drawer */}
                              {openCommentsMap[post.id] && (
                                <div className="px-3.5 py-3 bg-[#060C15] border-t border-[#16273B] space-y-2.5">
                                  {post.comments.length > 0 && (
                                    <div className="space-y-1.5">
                                      {post.comments.map((cm) => (
                                        <div
                                          key={cm.id}
                                          className="flex items-start justify-between gap-2.5 p-2.5 bg-[#0A1320] border border-[#16273B]"
                                        >
                                          <div className="flex items-start gap-2 min-w-0">
                                            <img
                                              src={cm.avatarUrl}
                                              alt={cm.authorHandle}
                                              referrerPolicy="no-referrer"
                                              className="w-7 h-7 object-cover shrink-0"
                                            />
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5 text-[11px]">
                                                <span className="font-bold text-[#F59E0B]">
                                                  @{cm.authorHandle}
                                                </span>
                                                <span className="text-[#6F88A8]">·</span>
                                                <span className="font-mono-tabular text-[#7A92B2]">
                                                  {cm.timestamp}
                                                </span>
                                              </div>
                                              <p className="text-[12.5px] text-slate-100 mt-0.5 leading-relaxed">
                                                {cm.text}
                                              </p>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setFbiState((prev) =>
                                                toggleFbiCommentLike(prev, post.id, cm.id)
                                              )
                                            }
                                            className={`inline-flex items-center gap-1 px-2 py-1 border text-[11px] font-bold cursor-pointer shrink-0 ${
                                              cm.likedByMe
                                                ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                                                : 'border-[#1E334D] text-[#8FA8C8] hover:text-white'
                                            }`}
                                          >
                                            <Heart
                                              className={`w-3 h-3 ${
                                                cm.likedByMe ? 'fill-current' : ''
                                              }`}
                                            />
                                            <span className="font-mono-tabular">{cm.likesCount}</span>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleCommentSubmit(post.id);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      data-testid={`cinema-post-comment-input-${post.id}`}
                                      value={commentInputs[post.id] ?? ''}
                                      onChange={(e) =>
                                        setCommentInputs((prev) => ({
                                          ...prev,
                                          [post.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="نظر خود را درباره این فیلم بنویسید..."
                                      className="flex-1 h-9 px-3 bg-[#050A12] border border-[#1E334D] text-[12.5px] text-white placeholder:text-[#6B84A5] outline-none focus:border-[#38BDF8]"
                                    />
                                    <button
                                      type="submit"
                                      data-testid={`cinema-post-comment-submit-${post.id}`}
                                      className="inline-flex items-center gap-1 h-9 px-3.5 bg-[#38BDF8] hover:bg-[#7DD3FC] text-slate-950 text-[12px] font-extrabold transition cursor-pointer shrink-0"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>ارسال نظر</span>
                                    </button>
                                  </form>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ================= WINDOW: FRIENDS ================= */}
                {fbiState.activeTab === 'friends' && (
                  <div data-testid="cinema-social-panel-friends" className="p-3.5 sm:p-4 space-y-4">
                    <div className="border border-[#1A2D45] bg-[#08111E] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {(
                          [
                            { id: 'all', label: 'همه افراد' },
                            { id: 'online', label: 'آنلاین' },
                            { id: 'friends', label: `دوستان (${friendsCount})` },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFriendFilter(f.id)}
                            className={`px-3 py-1.5 text-[11.5px] font-bold border transition cursor-pointer ${
                              friendFilter === f.id
                                ? 'bg-[#38BDF8] text-slate-950 border-[#38BDF8]'
                                : 'bg-[#0C1625] border-[#1A2D45] text-[#9CB2CE] hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 text-[#7A92B2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={friendSearch}
                          onChange={(e) => setFriendSearch(e.target.value)}
                          placeholder="جستجوی نام یا فیلم محبوب..."
                          className="w-full h-9 pr-8 pl-2.5 bg-[#050A12] border border-[#1A2D45] text-[12px] text-white outline-none focus:border-[#38BDF8]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredAgents.map((agent) => (
                        <article
                          key={agent.id}
                          data-testid={`cinema-friend-card-${agent.id}`}
                          className="border border-[#1B2F48] bg-[#08101C] p-3.5 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={agent.avatarUrl}
                              alt={agent.displayNameFa}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 object-cover border border-[#38BDF8]/40 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[14px] font-extrabold text-white truncate">
                                {agent.displayNameFa}
                              </h3>
                              <p className="text-[11.5px] text-[#38BDF8] truncate">
                                @{agent.handle} · {agent.clearanceLabel}
                              </p>
                              <p className="text-[11.5px] text-[#8FA8C8] mt-1 truncate">
                                {agent.divisionFa}
                              </p>
                            </div>
                          </div>

                          <p className="text-[12.5px] leading-relaxed text-slate-200">{agent.bioFa}</p>

                          <div className="text-[11.5px] text-[#9CB2CE] border-t border-[#142337] pt-2">
                            فیلم محبوب:{' '}
                            <span dir="ltr" className="font-mono-tabular text-[#F59E0B]">
                              {agent.favoriteFilmFa}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              data-testid={`cinema-friend-toggle-${agent.id}`}
                              onClick={() =>
                                setFbiState((prev) => toggleFbiAgentConnection(prev, agent.id))
                              }
                              className={`flex-1 h-9 px-2.5 border text-[11.5px] font-bold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                                agent.isFriend
                                  ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300'
                                  : 'border-[#1E334D] bg-[#0B1422] text-white hover:border-[#F59E0B]'
                              }`}
                            >
                              {agent.isFriend ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>دوست شما</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>افزودن دوست</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openPrivateDmWithAgent(agent)}
                              className="h-9 px-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[11.5px] font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>دایرکت</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedProfileAgent(agent)}
                              className="h-9 px-2.5 border border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#7DD3FC] text-[11.5px] font-bold cursor-pointer shrink-0"
                            >
                              پروفایل
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= WINDOW: CLUBS ================= */}
                {fbiState.activeTab === 'clubs' && (
                  <div data-testid="cinema-social-panel-clubs" className="p-3.5 sm:p-4 space-y-4">
                    <div className="border border-[#1A2D45] bg-[#08111E] p-3 flex flex-wrap items-center justify-between gap-2.5">
                      <div>
                        <h3 className="text-[14px] font-extrabold text-white">
                          کلاب‌های فیلم، انیمه و سریال
                        </h3>
                        <p className="text-[11.5px] text-[#8FA8C8]">
                          عضو کلاب دلخواه شوید، مستقیم داخلش فیلم بفرستید و با بقیه گپ بزنید
                        </p>
                      </div>

                      <button
                        type="button"
                        data-testid="cinema-create-club-toggle"
                        onClick={() => setShowCreateClubForm((v) => !v)}
                        className="h-9 px-3.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>ساخت کلاب جدید</span>
                      </button>
                    </div>

                    {showCreateClubForm && (
                      <form
                        onSubmit={handleCreateClub}
                        className="border border-[#F59E0B]/45 bg-[#08111E] p-3.5 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <input
                            type="text"
                            required
                            value={createClubName}
                            onChange={(e) => setCreateClubName(e.target.value)}
                            placeholder="نام کلاب (مثلاً کلاب فیلم‌های نولان)"
                            className="sm:col-span-2 h-9 px-3 bg-[#050A12] border border-[#1E334D] text-[12.5px] text-white outline-none focus:border-[#F59E0B]"
                          />
                          <input
                            type="text"
                            required
                            maxLength={5}
                            dir="ltr"
                            value={createClubTag}
                            onChange={(e) => setCreateClubTag(e.target.value.toUpperCase())}
                            placeholder="تگ (NOLAN)"
                            className="h-9 px-3 bg-[#050A12] border border-[#1E334D] font-mono-tabular text-[12.5px] text-[#F59E0B] uppercase outline-none focus:border-[#F59E0B]"
                          />
                        </div>
                        <input
                          type="text"
                          value={createClubMotto}
                          onChange={(e) => setCreateClubMotto(e.target.value)}
                          placeholder="توضیح کوتاه کلاب..."
                          className="w-full h-9 px-3 bg-[#050A12] border border-[#1E334D] text-[12.5px] text-white outline-none focus:border-[#F59E0B]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCreateClubForm(false)}
                            className="h-8 px-3 border border-[#1E334D] text-[11.5px] text-[#9CB2CE] cursor-pointer"
                          >
                            انصراف
                          </button>
                          <button
                            type="submit"
                            className="h-8 px-4 bg-[#F59E0B] text-slate-950 text-[12px] font-extrabold cursor-pointer"
                          >
                            ایجاد کلاب
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-4">
                      {fbiState.clubs.map((club) => (
                        <article
                          key={club.id}
                          data-testid={`cinema-club-card-${club.id}`}
                          className="border border-[#1B2F48] bg-[#08101C] overflow-hidden"
                        >
                          <div className="relative h-32 w-full bg-[#04070B] overflow-hidden">
                            <img
                              src={club.bannerUrl}
                              alt={club.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover opacity-80"
                            />
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 bg-gradient-to-t from-[#08101C] via-[#08101C]/45 to-transparent"
                            />
                            <div className="absolute bottom-3 right-3.5 left-3.5 flex flex-wrap items-end justify-between gap-2">
                              <div>
                                <p className="text-[11px] font-bold text-[#F59E0B]">
                                  {club.tag} · {club.membersCount} عضو
                                </p>
                                <h3 className="text-[15px] font-black text-white">{club.name}</h3>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveChannelId(`club-${club.id}`);
                                    setCompanionChatOpen(true);
                                    setFocusedWindow('chat');
                                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                      setFbiState((prev) => ({ ...prev, activeTab: 'chat' }));
                                    }
                                  }}
                                  className="h-8 px-2.5 border border-[#38BDF8]/45 bg-[#08101C]/90 text-[#7DD3FC] text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>چت کلاب</span>
                                </button>

                                <button
                                  type="button"
                                  data-testid={`cinema-club-join-${club.id}`}
                                  onClick={() =>
                                    setFbiState((prev) => toggleFbiClubMembership(prev, club.id))
                                  }
                                  className={`h-8 px-3 text-[11.5px] font-extrabold transition cursor-pointer ${
                                    club.isJoined
                                      ? 'border border-emerald-500/45 bg-emerald-500/15 text-emerald-300'
                                      : 'bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950'
                                  }`}
                                >
                                  {club.isJoined ? 'عضو هستید' : 'عضویت در کلاب'}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-3.5 space-y-3">
                            <p className="text-[12.5px] text-slate-200 leading-relaxed">{club.mottoFa}</p>

                            {club.dispatches.length > 0 && (
                              <div className="space-y-2 border-t border-[#142337] pt-2.5">
                                {club.dispatches.slice(0, 3).map((disp) => (
                                  <div
                                    key={disp.id}
                                    className="p-2.5 bg-[#050A12] border border-[#16273B] space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-bold text-[#38BDF8]">
                                        @{disp.authorHandle}
                                      </span>
                                      <span className="font-mono-tabular text-[#7A92B2]">
                                        {disp.timestamp}
                                      </span>
                                    </div>
                                    <p className="text-[12.5px] text-slate-100">{disp.text}</p>
                                    {disp.streamUrl && (
                                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-[11.5px] font-bold text-[#F59E0B]">
                                          {disp.filmTitleFa ?? 'فیلم کلاب'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onPlayStreamInHub(
                                              toCinemaStreamPost({
                                                id: disp.id,
                                                roomId: disp.roomId ?? activeRoomId,
                                                titleFa: disp.filmTitleFa ?? club.name,
                                                captionFa: disp.text,
                                                streamUrl: disp.streamUrl ?? '',
                                                streamFormat: disp.streamFormat,
                                                authorHandle: disp.authorHandle,
                                                authorTag: club.tag,
                                              })
                                            )
                                          }
                                          className="inline-flex items-center gap-1 h-7 px-2.5 bg-[#F59E0B] text-slate-950 text-[11px] font-extrabold cursor-pointer"
                                        >
                                          <Play className="w-3 h-3 fill-current" />
                                          <span>پخش در سالن</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Send message / movie directly inside club */}
                            <div className="pt-2 border-t border-[#142337] space-y-2">
                              {openClubFilmBar[club.id] && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-[#050A12] border border-[#1E334D]">
                                  <input
                                    type="text"
                                    value={clubFilmTitleDrafts[club.id] ?? ''}
                                    onChange={(e) =>
                                      setClubFilmTitleDrafts((prev) => ({
                                        ...prev,
                                        [club.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="نام فیلم..."
                                    className="h-8 px-2.5 bg-[#0A1320] border border-[#1E334D] text-[12px] text-white outline-none focus:border-[#F59E0B]"
                                  />
                                  <input
                                    type="text"
                                    dir="ltr"
                                    value={clubFilmUrlDrafts[club.id] ?? ''}
                                    onChange={(e) =>
                                      setClubFilmUrlDrafts((prev) => ({
                                        ...prev,
                                        [club.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="https://...m3u8 یا .mp4 یا لینک تلگرام"
                                    className="h-8 px-2.5 bg-[#0A1320] border border-[#1E334D] font-mono-tabular text-[11.5px] text-[#7DD3FC] outline-none focus:border-[#F59E0B]"
                                  />
                                </div>
                              )}

                              {clubErrorById[club.id] && (
                                <p className="text-[11.5px] text-rose-300">
                                  {clubErrorById[club.id]}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-1.5">
                                <input
                                  type="text"
                                  value={clubDispatchDrafts[club.id] ?? ''}
                                  onChange={(e) =>
                                    setClubDispatchDrafts((prev) => ({
                                      ...prev,
                                      [club.id]: e.target.value,
                                    }))
                                  }
                                  placeholder={`پیام یا پیشنهاد فیلم در ${club.name}...`}
                                  className="flex-1 min-w-[180px] h-9 px-3 bg-[#050A12] border border-[#1E334D] text-[12.5px] text-white outline-none focus:border-[#38BDF8]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenClubFilmBar((prev) => ({
                                      ...prev,
                                      [club.id]: !prev[club.id],
                                    }))
                                  }
                                  className="h-9 px-2.5 border border-[#1E334D] bg-[#0B1422] text-[11.5px] font-bold text-[#7DD3FC] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>لینک فیلم</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClubDispatchSubmit(club.id)}
                                  className="h-9 px-3.5 bg-[#38BDF8] hover:bg-[#7DD3FC] text-slate-950 text-[12px] font-extrabold cursor-pointer"
                                >
                                  ارسال در کلاب
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </FuiWindowFrame>
            </div>
          )}

          {/* COMPANION LIVE CHAT & DIRECTS WINDOW ON DESKTOP */}
          {showDesktopSideChat && (
            <div className="hidden lg:block lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20">
              <FuiWindowFrame
                testId="cinema-social-panel-chat"
                windowCode="DIRECT_02.WIN"
                titleFa="چت و دایرکت خصوصی"
                subtitleFa="گفتگوی زنده با دوستان و ارسال مستقیم فیلم"
                accentColor="cyan"
                isActive={focusedWindow === 'chat'}
                onFocus={() => setFocusedWindow('chat')}
                onToggleMaximize={() => switchMainTab('chat')}
                onClose={() => setCompanionChatOpen(false)}
              >
                {renderChatWindowBody(true)}
              </FuiWindowFrame>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================================== */}
      {/* POP-OUT OS WINDOW: CREATE NEW POST / FILM SHARE                         */}
      {/* ======================================================================== */}
      {isCreateModalOpen && (
        <div
          data-testid="cinema-create-post-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto">
            <FuiWindowFrame
              windowCode="NEW_POST.WIN"
              titleFa="ارسال پست، ویدیو یا لینک فیلم"
              subtitleFa="انتشار در فید سینمایی برای همه اعضا"
              accentColor="amber"
              onClose={() => setIsCreateModalOpen(false)}
            >
              <form onSubmit={handleSubmitNewPost} className="p-4 sm:p-5 space-y-3.5">
                <div>
                  <label className="block text-[12px] font-bold text-[#9CB2CE] mb-1">
                    متن پست یا نظر شما درباره فیلم *
                  </label>
                  <textarea
                    rows={3}
                    data-testid="cinema-create-post-caption"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="چرا این فیلم یا سکانس جذابه؟..."
                    className="w-full p-3 bg-[#040911] border border-[#1E334D] text-[13px] text-white outline-none focus:border-[#F59E0B] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11.5px] text-[#8FA8C8] mb-1">نام فیلم / سریال</label>
                    <input
                      type="text"
                      value={newFilmTitle}
                      onChange={(e) => setNewFilmTitle(e.target.value)}
                      placeholder="مثلاً Heat (1995) 4K"
                      className="w-full h-9 px-3 bg-[#040911] border border-[#1E334D] text-[12.5px] text-white outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] text-[#8FA8C8] mb-1">سالن پخش</label>
                    <select
                      value={newRoomId}
                      onChange={(e) => setNewRoomId(e.target.value as CinemaRoomId)}
                      className="w-full h-9 px-3 bg-[#040911] border border-[#1E334D] text-[12.5px] text-white outline-none"
                    >
                      {Object.entries(ROOM_LABELS).map(([rid, rlabel]) => (
                        <option key={rid} value={rid}>
                          {rlabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11.5px] text-[#8FA8C8] mb-1">
                      لینک مستقیم فیلم / استریم
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={newStreamUrl}
                      onChange={(e) => setNewStreamUrl(e.target.value)}
                      placeholder="https://...m3u8 یا .mp4 یا تلگرام"
                      className="w-full h-9 px-3 bg-[#040911] border border-[#1E334D] font-mono-tabular text-[11.5px] text-[#7DD3FC] outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] text-[#8FA8C8] mb-1">
                      آیدی کانال تلگرام (اختیاری)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={newTelegramChannel}
                      onChange={(e) => setNewTelegramChannel(e.target.value)}
                      placeholder="t.me/my_cinema"
                      className="w-full h-9 px-3 bg-[#040911] border border-[#1E334D] font-mono-tabular text-[11.5px] text-white outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11.5px] text-[#8FA8C8]">انتخاب تصویر یا آپلود ویدیو</span>
                    <div>
                      <input
                        ref={postFileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleUploadPostMedia}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => postFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 h-7 px-2.5 border border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#7DD3FC] text-[11px] font-bold cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>آپلود از دستگاه</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FBI_EVIDENCE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setNewMediaUrl(preset.url);
                          setNewVideoPreviewUrl('');
                        }}
                        className={`relative aspect-video overflow-hidden border-2 transition cursor-pointer ${
                          newMediaUrl === preset.url && !newVideoPreviewUrl
                            ? 'border-[#F59E0B]'
                            : 'border-[#1E334D] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[12px] text-rose-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newForceSpoiler}
                    onChange={(e) => setNewForceSpoiler(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <span>علامت‌گذاری به عنوان اسپویل (متن پست ابتدا مخفی باشد)</span>
                </label>

                {createError && (
                  <p className="text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/35 px-3 py-2">
                    {createError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-[#16273B]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="h-9 px-4 border border-[#1E334D] text-[12px] font-bold text-[#9CB2CE] hover:text-white cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    data-testid="cinema-create-post-submit"
                    className="h-9 px-5 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[12.5px] font-extrabold cursor-pointer"
                  >
                    انتشار پست
                  </button>
                </div>
              </form>
            </FuiWindowFrame>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* POP-OUT OS WINDOW: USER PROFILE MODAL                                   */}
      {/* ======================================================================== */}
      {selectedProfileAgent && (
        <div
          data-testid="cinema-fbi-agent-dossier-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md">
            <FuiWindowFrame
              windowCode="PROFILE.WIN"
              titleFa={`پروفایل ${selectedProfileAgent.displayNameFa}`}
              subtitleFa={`@${selectedProfileAgent.handle} · ${selectedProfileAgent.divisionFa}`}
              accentColor="cyan"
              onClose={() => setSelectedProfileAgent(null)}
            >
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={selectedProfileAgent.avatarUrl}
                    alt={selectedProfileAgent.displayNameFa}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover border border-[#38BDF8]/45 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[14px] font-extrabold text-white">
                      {selectedProfileAgent.displayNameFa}
                    </p>
                    <p className="text-[12px] text-[#8FA8C8]">{selectedProfileAgent.locationFa}</p>
                    <p className="text-[11.5px] text-[#38BDF8]">
                      {selectedProfileAgent.clearanceLabel}
                    </p>
                  </div>
                </div>

                <p className="text-[13px] text-slate-200 leading-relaxed">
                  <FuiTypewriter text={selectedProfileAgent.bioFa} speedMs={15} showCursor={false} />
                </p>

                <div className="border-t border-[#16273B] pt-3 space-y-1.5 text-[12px]">
                  <p className="text-[#9CB2CE]">
                    علاقه‌مندی‌ها:{' '}
                    <span className="text-white">{selectedProfileAgent.mainGenres.join(' · ')}</span>
                  </p>
                  <p className="text-[#9CB2CE]">
                    فیلم محبوب:{' '}
                    <span dir="ltr" className="font-mono-tabular text-[#F59E0B]">
                      {selectedProfileAgent.favoriteFilmFa}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openPrivateDmWithAgent(selectedProfileAgent)}
                    className="flex-1 h-10 bg-[#F59E0B] hover:bg-[#FBBF24] text-slate-950 text-[12.5px] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>ارسال پیام یا فیلم خصوصی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFbiState((prev) =>
                        toggleFbiAgentConnection(prev, selectedProfileAgent.id)
                      );
                      setSelectedProfileAgent((curr) =>
                        curr ? { ...curr, isFriend: !curr.isFriend } : null
                      );
                    }}
                    className="h-10 px-4 border border-[#38BDF8]/45 bg-[#38BDF8]/12 text-[#7DD3FC] text-[12px] font-bold cursor-pointer"
                  >
                    {selectedProfileAgent.isFriend ? 'حذف دوستی' : 'افزودن دوست'}
                  </button>
                </div>
              </div>
            </FuiWindowFrame>
          </div>
        </div>
      )}
    </div>
  );
};

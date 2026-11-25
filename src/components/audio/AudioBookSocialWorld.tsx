import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Feather,
  Headphones,
  Heart,
  Image as ImageIcon,
  Link2,
  Mail,
  MessageSquare,
  Music,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import type { AudioRoomId } from '../../utils/audioAgents';
import type { UndergroundStreamPost } from '../../utils/cinemaAgents';
import {
  addBookPostComment,
  appendBookChatMessage,
  BOOK_INK_PRESETS,
  buildBookAuthorAutoReply,
  createBookFeedPost,
  createBookLiteraryClub,
  loadAudioBookState,
  postBookClubEntry,
  saveAudioBookState,
  shareBookPostToChannel,
  toAudioStreamPost,
  toggleBookClubMembership,
  toggleBookCommentLike,
  toggleBookFriendConnection,
  toggleBookPostBookmark,
  toggleBookPostReaction,
  type AudioBookSocialState,
  type BookAudioPost,
  type BookAuthorMember,
  type BookChatAttachment,
  type BookSocialTabId,
} from '../../utils/audioBookSocialRules';
import { FuiTypewriter } from '../cinema/FuiTypewriter';

interface AudioBookSocialWorldProps {
  activeRoomId: AudioRoomId;
  onPlayStreamInHub: (post: UndergroundStreamPost) => void;
  onBack: () => void;
}

const AUDIO_ROOM_LABELS: Record<AudioRoomId, string> = {
  'westworld-cafe': 'کافه وست‌ورلد',
  'mj-concert': 'صحنه کنسرت',
  'berlin-rave': 'برلین الکترونیک',
  tomorrowland: 'فستیوال',
  meditation: 'خلوت و مدیتیشن',
  'ac-library': 'کتابخانهٔ قدیمی',
  'podcast-studio': 'استودیوی پادکست',
};

const BOOK_FONT_STYLE: React.CSSProperties = {
  fontFamily: "'Amiri', 'Noto Naskh Arabic', 'Cormorant Garamond', Georgia, serif",
};

const UI_FONT_STYLE: React.CSSProperties = {
  fontFamily: "'Vazirmatn', var(--font-sans)",
};

const LINED_PAPER_STYLE: React.CSSProperties = {
  backgroundColor: '#FAF4E4',
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(132, 99, 64, 0.14) 31px, rgba(132, 99, 64, 0.14) 32px)',
};

export const AudioBookSocialWorld: React.FC<AudioBookSocialWorldProps> = ({
  activeRoomId,
  onPlayStreamInHub,
  onBack,
}) => {
  const [bookState, setBookState] = useState<AudioBookSocialState>(() => loadAudioBookState());

  // Feed Filters
  const [feedFilter, setFeedFilter] = useState<'all' | 'library-philo' | 'music-cafe' | 'saved'>(
    'all'
  );
  const [feedSearch, setFeedSearch] = useState('');
  const [openCommentsMap, setOpenCommentsMap] = useState<Record<string, boolean>>({
    'bk-post-1': true,
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openSharePostId, setOpenSharePostId] = useState<string | null>(null);
  const [dmTargetByPost, setDmTargetByPost] = useState<Record<string, string>>({});
  const [actionToastByPost, setActionToastByPost] = useState<Record<string, string>>({});

  // Create Page / Post Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newEpigraph, setNewEpigraph] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newAudioTitle, setNewAudioTitle] = useState('');
  const [newRoomId, setNewRoomId] = useState<AudioRoomId>(activeRoomId);
  const [newStreamUrl, setNewStreamUrl] = useState('');
  const [newTelegramChannel, setNewTelegramChannel] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState(BOOK_INK_PRESETS[0].url);
  const [newAudioPreviewUrl, setNewAudioPreviewUrl] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Chat & Private Letters State
  const [activeChannelId, setActiveChannelId] = useState<string>('dm-bm-1');
  const [chatInput, setChatInput] = useState('');
  const [chatPrivateLetter, setChatPrivateLetter] = useState(true);
  const [chatAudioDrawerOpen, setChatAudioDrawerOpen] = useState(false);
  const [chatAudioTitle, setChatAudioTitle] = useState('');
  const [chatAudioUrl, setChatAudioUrl] = useState('');
  const [chatAudioRoomId, setChatAudioRoomId] = useState<AudioRoomId>(activeRoomId);
  const [chatPendingAttachment, setChatPendingAttachment] = useState<BookChatAttachment | null>(
    null
  );
  const [chatError, setChatError] = useState<string | null>(null);
  const [latestReplyId, setLatestReplyId] = useState<string>('bk-msg-3');

  // Friends / Authors State
  const [friendSearch, setFriendSearch] = useState('');
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'friends'>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<BookAuthorMember | null>(null);

  // Literary Clubs State
  const [clubDrafts, setClubDrafts] = useState<Record<string, string>>({});
  const [clubUrlDrafts, setClubUrlDrafts] = useState<Record<string, string>>({});
  const [clubTitleDrafts, setClubTitleDrafts] = useState<Record<string, string>>({});
  const [openClubAudioBar, setOpenClubAudioBar] = useState<Record<string, boolean>>({});
  const [clubErrorById, setClubErrorById] = useState<Record<string, string>>({});
  const [showNewClubForm, setShowNewClubForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubTag, setNewClubTag] = useState('');
  const [newClubMotto, setNewClubMotto] = useState('');

  const rootScrollRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const postFileInputRef = useRef<HTMLInputElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveAudioBookState(bookState);
  }, [bookState]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [bookState.messages.length, activeChannelId, bookState.activeTab]);

  const friendsCount = useMemo(
    () => bookState.members.filter((m) => m.isFriend).length,
    [bookState.members]
  );

  const savedPagesCount = useMemo(
    () => bookState.posts.filter((p) => p.bookmarkedByMe).length,
    [bookState.posts]
  );

  const joinedClubs = useMemo(
    () => bookState.clubs.filter((c) => c.isJoined),
    [bookState.clubs]
  );

  const filteredPosts = useMemo(() => {
    const q = feedSearch.trim().toLowerCase();
    return bookState.posts.filter((p) => {
      if (
        feedFilter === 'library-philo' &&
        p.roomId !== 'ac-library' &&
        p.roomId !== 'podcast-studio' &&
        p.roomId !== 'meditation'
      ) {
        return false;
      }
      if (
        feedFilter === 'music-cafe' &&
        p.roomId !== 'westworld-cafe' &&
        p.roomId !== 'mj-concert' &&
        p.roomId !== 'berlin-rave' &&
        p.roomId !== 'tomorrowland'
      ) {
        return false;
      }
      if (feedFilter === 'saved' && !p.bookmarkedByMe) return false;
      if (!q) return true;
      return (
        p.chapterTitleFa.toLowerCase().includes(q) ||
        (p.epigraphPoemFa ?? '').toLowerCase().includes(q) ||
        p.captionFa.toLowerCase().includes(q) ||
        p.authorDisplayNameFa.toLowerCase().includes(q) ||
        p.audioTitleTag.toLowerCase().includes(q)
      );
    });
  }, [bookState.posts, feedFilter, feedSearch]);

  const filteredMembers = useMemo(() => {
    const q = friendSearch.trim().toLowerCase();
    return bookState.members.filter((m) => {
      if (friendFilter === 'online' && m.onlineStatus !== 'ONLINE' && m.onlineStatus !== 'READING') {
        return false;
      }
      if (friendFilter === 'friends' && !m.isFriend) return false;
      if (!q) return true;
      return (
        m.displayNameFa.toLowerCase().includes(q) ||
        m.philosophyQuoteFa.toLowerCase().includes(q) ||
        m.favoriteWorkFa.toLowerCase().includes(q) ||
        m.circleFa.toLowerCase().includes(q)
      );
    });
  }, [bookState.members, friendFilter, friendSearch]);

  const activeChannelMeta = useMemo(() => {
    if (activeChannelId === 'book-global') {
      return {
        title: 'تالارِ گفت‌وگوی همگانی',
        subtitle: 'نامه‌ها، شعرها و قطعات صوتی مشترک',
        isDm: false,
      };
    }
    if (activeChannelId.startsWith('club-')) {
      const clubId = activeChannelId.replace('club-', '');
      const club = bookState.clubs.find((c) => c.id === clubId);
      return {
        title: club ? club.name : 'محفلِ کلاب',
        subtitle: club ? `${club.membersCount} هم‌صحبت · ${club.circleFa}` : 'گفت‌وگوی محفل',
        isDm: false,
      };
    }
    if (activeChannelId.startsWith('dm-')) {
      const mId = activeChannelId.replace('dm-', '');
      const member = bookState.members.find((m) => m.id === mId);
      return {
        title: member ? `نامهٔ خصوصی به ${member.displayNameFa}` : 'نامهٔ خصوصی',
        subtitle: member ? `${member.penNameLabel} · @${member.handle}` : 'دفتر خصوصی',
        isDm: true,
      };
    }
    return {
      title: 'دفترِ گفت‌وگو',
      subtitle: 'ارسال متن، شعر و قطعهٔ صوتی',
      isDm: false,
    };
  }, [activeChannelId, bookState.clubs, bookState.members]);

  const visibleMessages = useMemo(
    () => bookState.messages.filter((m) => m.channelId === activeChannelId),
    [bookState.messages, activeChannelId]
  );

  const switchTab = (tab: BookSocialTabId) => {
    setBookState((prev) => ({ ...prev, activeTab: tab }));
    if (rootScrollRef.current) rootScrollRef.current.scrollTop = 0;
  };

  const openPrivateLetterWith = (member: BookAuthorMember) => {
    setActiveChannelId(`dm-${member.id}`);
    setChatPrivateLetter(true);
    setSelectedAuthor(null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setBookState((prev) => ({ ...prev, activeTab: 'chat' }));
    }
  };

  const showToast = (postId: string, msg: string) => {
    setActionToastByPost((prev) => ({ ...prev, [postId]: msg }));
    window.setTimeout(() => {
      setActionToastByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }, 2600);
  };

  const handleCommentSubmit = (postId: string) => {
    const draft = (commentInputs[postId] ?? '').trim();
    if (!draft) return;
    setBookState((prev) => addBookPostComment(prev, postId, draft));
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setOpenCommentsMap((prev) => ({ ...prev, [postId]: true }));
  };

  const handleShareCopy = (post: BookAudioPost) => {
    const text = `${post.chapterTitleFa} | ${post.streamUrl ?? 'divan://page/' + post.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setBookState((prev) => shareBookPostToChannel(prev, post.id, 'book-global'));
    showToast(post.id, 'برگه کپی و در تالار همگانی نقل شد.');
    setOpenSharePostId(null);
  };

  const handleShareToChannel = (post: BookAudioPost, channelId: string, label: string) => {
    setBookState((prev) => shareBookPostToChannel(prev, post.id, channelId));
    showToast(post.id, label);
    setOpenSharePostId(null);
    setActiveChannelId(channelId);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setChatError(null);

    let attachmentToSend = chatPendingAttachment ?? undefined;
    if (!attachmentToSend && chatAudioDrawerOpen && chatAudioUrl.trim()) {
      attachmentToSend = {
        kind: 'audio_stream',
        titleFa: chatAudioTitle.trim() || 'قطعهٔ صوتی / پادکست',
        url: chatAudioUrl.trim(),
        streamUrl: chatAudioUrl.trim(),
        roomId: chatAudioRoomId,
      };
    }

    const res = appendBookChatMessage(bookState, {
      channelId: activeChannelId,
      text: chatInput,
      isPrivateLetter: chatPrivateLetter || activeChannelId.startsWith('dm-'),
      attachment: attachmentToSend,
    });

    if (!res.ok) {
      setChatError(res.error ?? 'ارسال نامه انجام نشد.');
      return;
    }

    setBookState(res.state);
    setChatInput('');
    setChatPendingAttachment(null);
    setChatAudioTitle('');
    setChatAudioUrl('');
    setChatAudioDrawerOpen(false);

    const chanSnapshot = activeChannelId;
    const hadAudio = Boolean(attachmentToSend);
    const textSnapshot = chatInput;
    window.setTimeout(() => {
      setBookState((curr) => {
        const reply = buildBookAuthorAutoReply(curr, textSnapshot, chanSnapshot, hadAudio);
        setLatestReplyId(reply.id);
        return { ...curr, messages: [...curr.messages, reply].slice(-60) };
      });
    }, 340);
  };

  const handleUploadChatMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      const objectUrl = URL.createObjectURL(file);
      setChatPendingAttachment({
        kind: 'audio_file',
        titleFa: file.name,
        url: objectUrl,
        streamUrl: objectUrl,
        format: 'MP3',
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
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      const objectUrl = URL.createObjectURL(file);
      setNewAudioPreviewUrl(objectUrl);
      if (!newStreamUrl.trim()) setNewStreamUrl(objectUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewMediaUrl(reader.result);
          setNewAudioPreviewUrl('');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const res = createBookFeedPost(bookState, {
      chapterTitleFa: newChapterTitle,
      epigraphPoemFa: newEpigraph,
      captionFa: newCaption,
      audioTitleTag: newAudioTitle || `${AUDIO_ROOM_LABELS[newRoomId]} · نغمهٔ همراه`,
      roomId: newRoomId,
      mediaUrl: newMediaUrl,
      audioPreviewUrl: newAudioPreviewUrl || undefined,
      streamUrl: newStreamUrl || undefined,
      telegramChannel: newTelegramChannel || undefined,
    });
    if (!res.ok) {
      setCreateError(res.error ?? 'لطفاً متن برگه را بنویسید.');
      return;
    }
    setBookState(res.state);
    setIsCreateOpen(false);
    setNewChapterTitle('');
    setNewEpigraph('');
    setNewCaption('');
    setNewAudioTitle('');
    setNewStreamUrl('');
    setNewTelegramChannel('');
    setNewAudioPreviewUrl('');
    switchTab('feed');
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClubName.trim().length < 2) return;
    setBookState((prev) =>
      createBookLiteraryClub(prev, {
        name: newClubName,
        tag: newClubTag || 'دیوان',
        mottoFa: newClubMotto,
      })
    );
    setNewClubName('');
    setNewClubTag('');
    setNewClubMotto('');
    setShowNewClubForm(false);
  };

  const handleClubEntrySubmit = (clubId: string) => {
    const text = (clubDrafts[clubId] ?? '').trim();
    const streamUrl = (clubUrlDrafts[clubId] ?? '').trim();
    const audioTitleFa = (clubTitleDrafts[clubId] ?? '').trim();
    setClubErrorById((prev) => {
      const next = { ...prev };
      delete next[clubId];
      return next;
    });

    const res = postBookClubEntry(bookState, clubId, {
      text,
      streamUrl: streamUrl || undefined,
      audioTitleFa: audioTitleFa || undefined,
      roomId: activeRoomId,
    });
    if (!res.ok) {
      setClubErrorById((prev) => ({ ...prev, [clubId]: res.error ?? 'خطا در ثبت نوشته' }));
      return;
    }

    setBookState(res.state);
    setClubDrafts((prev) => ({ ...prev, [clubId]: '' }));
    setClubUrlDrafts((prev) => ({ ...prev, [clubId]: '' }));
    setClubTitleDrafts((prev) => ({ ...prev, [clubId]: '' }));
    setOpenClubAudioBar((prev) => ({ ...prev, [clubId]: false }));
  };

  const chapterTabs: Array<{ id: BookSocialTabId; numFa: string; label: string; count: number }> = [
    { id: 'feed', numFa: 'فصل اول', label: 'صفحات و اشعار', count: bookState.posts.length },
    { id: 'chat', numFa: 'فصل دوم', label: 'نامه‌ها و گفت‌وگو', count: bookState.messages.length },
    { id: 'friends', numFa: 'فصل سوم', label: 'هم‌صحبتان', count: friendsCount },
    { id: 'clubs', numFa: 'فصل چهارم', label: 'محفل‌ها و کلاب', count: bookState.clubs.length },
  ];

  // Epistolary / Lined Notebook Panel (renders on Left Facing Page on Desktop & Full Spread on Chat Tab)
  const renderNotebookLettersPanel = (inFacingPage = false) => (
    <div className="flex flex-col h-full min-h-0">
      {/* Page Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-[#8C2D19]/25 bg-[#F4EAD2]/80 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-[#8C2D19] shrink-0" />
            <h2
              style={BOOK_FONT_STYLE}
              className="text-[18px] sm:text-[20px] font-bold text-[#1F1812] truncate"
            >
              {activeChannelMeta.title}
            </h2>
          </div>
          <p style={UI_FONT_STYLE} className="text-[11.5px] text-[#6A533C] truncate">
            {activeChannelMeta.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setChatPrivateLetter((v) => !v)}
          style={UI_FONT_STYLE}
          className={`px-2.5 py-1 border text-[11px] font-bold transition cursor-pointer shrink-0 ${
            chatPrivateLetter || activeChannelMeta.isDm
              ? 'border-[#8C2D19]/50 bg-[#8C2D19]/10 text-[#8C2D19]'
              : 'border-[#B8A27E] bg-[#FAF4E4] text-[#5C4B3B]'
          }`}
        >
          {chatPrivateLetter || activeChannelMeta.isDm ? 'نامهٔ محرمانه' : 'یادداشت باز'}
        </button>
      </div>

      {/* Recipient / Circle Selector Strip */}
      <div
        style={UI_FONT_STYLE}
        className="px-4 py-2.5 border-b border-[#CBB897] bg-[#F1E6CE]/80 flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          data-testid="audio-chat-channel-global"
          onClick={() => setActiveChannelId('book-global')}
          className={`px-2.5 py-1 text-[11.5px] font-bold border transition cursor-pointer ${
            activeChannelId === 'book-global'
              ? 'bg-[#8C2D19] text-[#FAF4E4] border-[#8C2D19]'
              : 'bg-[#FAF4E4] border-[#CBB897] text-[#4B3B2C] hover:border-[#8C2D19]/60'
          }`}
        >
          تالار همگانی
        </button>

        {bookState.clubs.map((c) => {
          const chId = `club-${c.id}`;
          const active = activeChannelId === chId;
          return (
            <button
              key={c.id}
              type="button"
              data-testid={`audio-chat-channel-club-${c.id}`}
              onClick={() => setActiveChannelId(chId)}
              className={`px-2.5 py-1 text-[11.5px] font-bold border transition cursor-pointer ${
                active
                  ? 'bg-[#9A6B22] text-[#FAF4E4] border-[#9A6B22]'
                  : 'bg-[#FAF4E4] border-[#CBB897] text-[#4B3B2C] hover:border-[#9A6B22]'
              }`}
            >
              محفل {c.tag}
            </button>
          );
        })}

        {bookState.members.map((m) => {
          const chId = `dm-${m.id}`;
          const active = activeChannelId === chId;
          return (
            <button
              key={m.id}
              type="button"
              data-testid={`audio-chat-channel-dm-${m.id}`}
              onClick={() => setActiveChannelId(chId)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-bold border transition cursor-pointer ${
                active
                  ? 'bg-[#1E3A5F] text-[#FAF4E4] border-[#1E3A5F]'
                  : 'bg-[#FAF4E4] border-[#CBB897] text-[#4B3B2C] hover:border-[#1E3A5F]'
              }`}
            >
              <img
                src={m.avatarUrl}
                alt={m.displayNameFa}
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-full object-cover border border-[#8C2D19]/35 sepia-[0.72] saturate-[0.75] contrast-[1.08]"
              />
              <span>{m.displayNameFa.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Ruled Letters / Messages Area */}
      <div
        ref={chatScrollRef}
        className={`${
          inFacingPage ? 'h-[360px] xl:h-[420px]' : 'h-[370px] sm:h-[440px]'
        } overflow-y-auto px-4 sm:px-6 py-4 space-y-4`}
      >
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#6A533C] space-y-2">
            <BookOpen className="w-7 h-7 text-[#8C2D19]" />
            <p style={BOOK_FONT_STYLE} className="text-[18px] font-bold text-[#1F1812]">
              این صفحه هنوز سپید و نانوشته است
            </p>
            <p style={UI_FONT_STYLE} className="text-[12px] max-w-xs">
              نخستین سطر، شعر یا قطعهٔ صوتی خود را با قلم در پایین بنویسید.
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isRecentReply = msg.id === latestReplyId && !msg.isSelf;
            return (
              <div
                key={msg.id}
                className={`border-b border-[#8C2D19]/15 pb-3 ${
                  msg.isSelf ? 'pr-3 border-r-2 border-r-[#1E3A5F]' : 'pl-2'
                }`}
              >
                <div
                  style={UI_FONT_STYLE}
                  className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6A533C] mb-1"
                >
                  <span
                    className={`font-bold ${
                      msg.isSelf ? 'text-[#1E3A5F]' : 'text-[#8C2D19]'
                    }`}
                  >
                    {msg.senderDisplayNameFa}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span dir="ltr" className="inline-block">@{msg.senderHandle}</span>
                  {msg.isPrivateLetter && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#8C2D19]">نامهٔ خصوصی</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{msg.timestamp}</span>
                </div>

                <p
                  style={BOOK_FONT_STYLE}
                  className={`text-[16px] sm:text-[17px] leading-[1.95] ${
                    msg.isSelf ? 'text-[#1E3A5F]' : 'text-[#1F1812]'
                  }`}
                >
                  {isRecentReply ? (
                    <FuiTypewriter key={msg.id} text={msg.text} speedMs={16} showCursor={false} />
                  ) : (
                    msg.text
                  )}
                </p>

                {msg.attachment && (
                  <div className="mt-2.5 border border-[#C5B18C] bg-[#F3EBD6] p-2.5">
                    {msg.attachment.kind === 'photo_file' && (
                      <img
                        src={msg.attachment.url}
                        alt={msg.attachment.titleFa}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-48 object-cover border border-[#8C2D19]/20"
                      />
                    )}
                    {msg.attachment.kind === 'audio_file' && (
                      <audio
                        src={msg.attachment.url}
                        controls
                        className="w-full h-9"
                      />
                    )}
                    {msg.attachment.kind !== 'photo_file' && msg.attachment.kind !== 'audio_file' && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            style={BOOK_FONT_STYLE}
                            className="text-[15px] font-bold text-[#1F1812] flex items-center gap-1.5 truncate"
                          >
                            <Music className="w-3.5 h-3.5 text-[#8C2D19] shrink-0" />
                            <span className="truncate">{msg.attachment.titleFa}</span>
                          </p>
                          <p
                            dir="ltr"
                            className="font-mono-tabular text-[10.5px] text-[#6A533C] truncate"
                          >
                            {msg.attachment.format ?? 'AUDIO'} · {msg.attachment.url}
                          </p>
                        </div>

                        {msg.attachment.kind !== 'page_ref' && (
                          <button
                            type="button"
                            onClick={() =>
                              onPlayStreamInHub(
                                toAudioStreamPost({
                                  id: msg.id,
                                  roomId: msg.attachment?.roomId ?? activeRoomId,
                                  titleFa: msg.attachment?.titleFa ?? 'نغمهٔ پیوستی',
                                  captionFa: msg.text,
                                  streamUrl:
                                    msg.attachment?.streamUrl ?? msg.attachment?.url ?? '',
                                  streamFormat: msg.attachment?.format,
                                  authorHandle: msg.senderHandle,
                                  authorTag: msg.senderTag,
                                })
                              )
                            }
                            style={UI_FONT_STYLE}
                            className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#8C2D19] hover:bg-[#732312] text-[#FAF4E4] text-[11.5px] font-bold cursor-pointer shrink-0"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>شنیدن در تالار</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Fountain Pen Composer Bar */}
      <div
        style={UI_FONT_STYLE}
        className="mt-auto border-t border-[#8C2D19]/25 bg-[#F2E8D0] p-3.5 space-y-2.5"
      >
        {chatPendingAttachment && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#FAF4E4] border border-[#9A6B22]/50 text-[11.5px]">
            <span className="text-[#1F1812] truncate">
              پیوست آمادهٔ ارسال: {chatPendingAttachment.titleFa}
            </span>
            <button
              type="button"
              onClick={() => setChatPendingAttachment(null)}
              className="text-[#8C2D19] font-bold cursor-pointer"
            >
              حذف
            </button>
          </div>
        )}

        {chatAudioDrawerOpen && (
          <div className="p-3 border border-[#C5B18C] bg-[#FAF4E4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#8C2D19]">
                پیوستِ قطعهٔ موسیقی، پادکست یا کتاب صوتی
              </span>
              <button
                type="button"
                onClick={() => setChatAudioDrawerOpen(false)}
                className="text-[11px] text-[#6A533C] cursor-pointer"
              >
                بستن
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                data-testid="audio-chat-stream-title-input"
                value={chatAudioTitle}
                onChange={(e) => setChatAudioTitle(e.target.value)}
                placeholder="عنوان قطعه یا کتاب صوتی..."
                className="h-9 px-2.5 bg-white/80 border border-[#C5B18C] text-[12px] text-[#1F1812] outline-none focus:border-[#8C2D19]"
              />
              <input
                type="text"
                dir="ltr"
                data-testid="audio-chat-stream-url-input"
                value={chatAudioUrl}
                onChange={(e) => setChatAudioUrl(e.target.value)}
                placeholder="https://...mp3 یا .m3u8 یا لینک تلگرام"
                className="h-9 px-2.5 bg-white/80 border border-[#C5B18C] font-mono-tabular text-[11.5px] text-[#1E3A5F] outline-none focus:border-[#8C2D19]"
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6A533C]">تالار پخش:</span>
              <select
                value={chatAudioRoomId}
                onChange={(e) => setChatAudioRoomId(e.target.value as AudioRoomId)}
                className="h-7 px-2 bg-[#FAF4E4] border border-[#C5B18C] text-[#1F1812]"
              >
                {Object.entries(AUDIO_ROOM_LABELS).map(([rid, lbl]) => (
                  <option key={rid} value={rid}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {chatError && (
          <p className="text-[11.5px] text-[#8C2D19] bg-[#8C2D19]/10 border border-[#8C2D19]/30 px-2.5 py-1.5">
            {chatError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="audio-chat-attach-stream-btn"
            onClick={() => setChatAudioDrawerOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 border text-[11.5px] font-bold transition cursor-pointer ${
              chatAudioDrawerOpen
                ? 'border-[#8C2D19] bg-[#8C2D19] text-[#FAF4E4]'
                : 'border-[#C5B18C] bg-[#FAF4E4] text-[#3E2F23] hover:border-[#8C2D19]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>ارسال لینک صدا / پادکست</span>
          </button>

          <input
            ref={chatFileInputRef}
            type="file"
            accept="audio/*,image/*,video/*"
            onChange={handleUploadChatMedia}
            className="hidden"
          />
          <button
            type="button"
            data-testid="audio-chat-attach-media-btn"
            onClick={() => chatFileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 border border-[#C5B18C] bg-[#FAF4E4] hover:border-[#8C2D19] text-[11.5px] font-bold text-[#3E2F23] transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>آپلود صوت یا تصویر</span>
          </button>
        </div>

        <form onSubmit={handleSendChat} className="flex items-center gap-2">
          <input
            type="text"
            data-testid="audio-social-chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              activeChannelMeta.isDm
                ? 'نامهٔ خصوصی، بیت شعر یا نظر خود را بنویسید...'
                : 'در تالار بنویسید...'
            }
            className="flex-1 h-10 px-3 bg-[#FAF4E4] border border-[#B8A27E] text-[13px] text-[#1F1812] placeholder:text-[#7B6650] outline-none focus:border-[#8C2D19]"
          />
          <button
            type="submit"
            data-testid="audio-social-chat-send-btn"
            className="inline-flex items-center gap-1.5 h-10 px-4 bg-[#8C2D19] hover:bg-[#732312] text-[#FAF4E4] text-[12.5px] font-bold transition cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>نگارش و ارسال</span>
          </button>
        </form>
      </div>
    </div>
  );

  const isFullChatTab = bookState.activeTab === 'chat';

  return (
    <div
      ref={rootScrollRef}
      data-testid="audio-book-social-world"
      dir="rtl"
      style={UI_FONT_STYLE}
      className="relative w-full h-dvh overflow-y-auto overflow-x-hidden scroll-pt-28 bg-[#17110C] text-[#1F1812] select-text"
    >
      {/* Candlelit Library Wooden Desk Backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/src/assets/images/book_ink_desk_backdrop_1795260959397.jpg"
          alt="میز کتابخانه و دفتر شعر"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(28,19,12,0.55) 0%, rgba(16,11,7,0.92) 85%)',
          }}
        />
      </div>

      {/* Physical Bound Open-Book Wrapper */}
      <div className="relative z-10 max-w-[1380px] mx-auto px-2.5 sm:px-6 py-3 sm:py-6">
        <div className="border-[5px] sm:border-[7px] border-[#3B2619] shadow-[0_26px_80px_rgba(0,0,0,0.85)] bg-[#FAF4E4]">
          {/* Illuminated Top Book Header (سرصفحهٔ کتاب) */}
          <header className="sticky top-0 z-30 border-b-2 border-[#8C2D19]/30 bg-[#F4EBD5]/95 backdrop-blur-md">
            <div className="pl-14 sm:pl-16 pr-3.5 sm:pr-6 h-16 flex items-center justify-between gap-4">
              {/* Zone 1: Back & Manuscript Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  data-testid="audio-social-back-btn"
                  onClick={onBack}
                  aria-label="بازگشت به تالار صدا"
                  className="w-9 h-9 border border-[#B8A27E] bg-[#FAF4E4] hover:border-[#8C2D19] flex items-center justify-center text-[#1F1812] transition cursor-pointer shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1
                    style={BOOK_FONT_STYLE}
                    className="text-[17px] sm:text-[22px] font-bold text-[#1F1812] whitespace-nowrap truncate"
                  >
                    دیوانِ صدا، شعر و فلسفه
                  </h1>
                </div>
              </div>

              {/* Zone 2: Desktop Chapter Navigation */}
              <nav
                aria-label="فصل‌های کتاب"
                className="hidden md:flex items-center gap-5"
              >
                {chapterTabs.map((tab) => {
                  const active = bookState.activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`audio-social-tab-${tab.id}`}
                      onClick={() => switchTab(tab.id)}
                      className={`py-2 text-[13.5px] font-bold whitespace-nowrap shrink-0 border-b-2 transition cursor-pointer ${
                        active
                          ? 'border-[#8C2D19] text-[#8C2D19]'
                          : 'border-transparent text-[#5C4B3B] hover:text-[#1F1812]'
                      }`}
                    >
                      <span>{tab.label}</span>{' '}
                      <span className="font-mono-tabular text-[11px] opacity-75">
                        ({tab.count})
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Zone 3: Single Primary Action CTA */}
              <button
                type="button"
                data-testid="audio-social-new-post-btn"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-4 bg-[#8C2D19] hover:bg-[#732312] text-[#FAF4E4] text-[12px] sm:text-[12.5px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Feather className="w-3.5 h-3.5" />
                <span className="sm:hidden">نگارش برگه</span>
                <span className="hidden sm:inline">نگارش برگهٔ تازه</span>
              </button>
            </div>

            {/* Mobile 2x2 Chapter Bar (zero clipping on 390px) */}
            <div className="md:hidden grid grid-cols-2 gap-1.5 px-3 pb-2.5">
              {chapterTabs.map((tab) => {
                const active = bookState.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`audio-social-mobile-tab-${tab.id}`}
                    onClick={() => switchTab(tab.id)}
                    className={`h-9 px-2.5 border text-[11.5px] font-bold flex items-center justify-between transition cursor-pointer ${
                      active
                        ? 'bg-[#8C2D19] text-[#FAF4E4] border-[#8C2D19]'
                        : 'bg-[#FAF4E4] text-[#4B3B2C] border-[#C5B18C]'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    <span className="font-mono-tabular text-[10.5px] opacity-80">{tab.count}</span>
                  </button>
                );
              })}
            </div>
          </header>

          {/* Opening Epigraph Strip */}
          <div className="px-4 sm:px-7 py-2.5 border-b border-[#C5B18C] bg-[#F6EED9] flex flex-wrap items-center justify-between gap-2 text-[#4B3B2C]">
            <p style={BOOK_FONT_STYLE} className="text-[15.5px] italic text-[#3E2F23]">
              «<FuiTypewriter text={bookState.userExLibrisQuoteFa} speedMs={22} showCursor={false} />»
              <span className="not-italic text-[12px] text-[#8C2D19] mr-2">
                — دفترِ {bookState.userDisplayNameFa}
              </span>
            </p>
            <div className="flex items-center gap-3 text-[11.5px]">
              <span>
                نشان‌های قلم:{' '}
                <strong data-testid="audio-social-rep" className="font-mono-tabular text-[#8C2D19]">
                  {bookState.userRep.toLocaleString('fa-IR')}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                هم‌صحبتان: <strong className="font-mono-tabular">{friendsCount}</strong>
              </span>
            </div>
          </div>

          {/* TWO-PAGE OPEN-BOOK SPREAD (Desktop: Right Page + Central Book Spine + Left Epistolary Page) */}
          <div style={LINED_PAPER_STYLE} className="relative">
            {/* Desktop Central Book Spine Crease */}
            {!isFullChatTab && (
              <div
                aria-hidden="true"
                className="hidden lg:block pointer-events-none absolute top-0 bottom-0 left-[41.6666%] w-8 -translate-x-1/2 z-10"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(60,39,25,0) 0%, rgba(60,39,25,0.11) 48%, rgba(60,39,25,0.22) 50%, rgba(60,39,25,0.11) 52%, rgba(60,39,25,0) 100%)',
                }}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 items-start">
              {/* FULL SPREAD WHEN CHAT TAB IS CHOSEN */}
              {isFullChatTab ? (
                <div data-testid="audio-social-panel-chat" className="lg:col-span-12">
                  {renderNotebookLettersPanel(false)}
                </div>
              ) : (
                <>
                  {/* RIGHT BOOK PAGE (Main Chapter Content: Pages / Authors / Clubs) */}
                  <div className="lg:col-span-7 border-b lg:border-b-0 border-[#C5B18C]">
                    {/* ================= CHAPTER 1: LITERARY FEED PAGES ================= */}
                    {bookState.activeTab === 'feed' && (
                      <div
                        data-testid="audio-social-panel-feed"
                        className="p-4 sm:p-7 space-y-6"
                      >
                        {/* Chapter Intro & Filters */}
                        <div className="border-b-2 border-[#8C2D19]/25 pb-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-bold text-[#8C2D19]">
                                فصل اول · دیوانِ نوشته‌ها و آواها
                              </span>
                              <h2
                                style={BOOK_FONT_STYLE}
                                className="text-[22px] sm:text-[26px] font-bold text-[#1F1812]"
                              >
                                برگه‌های تازهٔ شعر، فلسفه و موسیقی
                              </h2>
                            </div>
                            <button
                              type="button"
                              data-testid="audio-feed-open-composer-btn"
                              onClick={() => setIsCreateOpen(true)}
                              className="h-9 px-3.5 border border-[#8C2D19] bg-[#FAF4E4] hover:bg-[#8C2D19] text-[#8C2D19] hover:text-[#FAF4E4] text-[12px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>افزودن برگه</span>
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex flex-wrap items-center gap-1">
                              {(
                                [
                                  { id: 'all', label: 'همهٔ برگه‌ها' },
                                  { id: 'library-philo', label: 'کتاب و فلسفه' },
                                  { id: 'music-cafe', label: 'موسیقی و کافه' },
                                  { id: 'saved', label: `نشانک‌ها (${savedPagesCount})` },
                                ] as const
                              ).map((chip) => (
                                <button
                                  key={chip.id}
                                  type="button"
                                  onClick={() => setFeedFilter(chip.id)}
                                  className={`px-2.5 py-1 text-[11.5px] font-bold border transition cursor-pointer ${
                                    feedFilter === chip.id
                                      ? 'bg-[#8C2D19] text-[#FAF4E4] border-[#8C2D19]'
                                      : 'bg-[#FAF4E4]/90 border-[#C5B18C] text-[#4B3B2C] hover:border-[#8C2D19]'
                                  }`}
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>

                            <div className="relative flex-1 min-w-0">
                              <Search className="w-3.5 h-3.5 text-[#7B6650] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={feedSearch}
                                onChange={(e) => setFeedSearch(e.target.value)}
                                placeholder="جستجو در سطرها، شعرها یا نام نویسنده..."
                                className="w-full h-8 pr-8 pl-2.5 bg-white/75 border border-[#C5B18C] text-[12px] text-[#1F1812] placeholder:text-[#7B6650] outline-none focus:border-[#8C2D19]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Numbered Literary Book Pages */}
                        {filteredPosts.length === 0 ? (
                          <div className="py-10 text-center space-y-2 border border-[#C5B18C] bg-[#F5EDD8]/70">
                            <p style={BOOK_FONT_STYLE} className="text-[19px] font-bold">
                              برگه‌ای با این نشانی یافت نشد
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setFeedFilter('all');
                                setFeedSearch('');
                              }}
                              className="h-8 px-3.5 bg-[#8C2D19] text-[#FAF4E4] text-[12px] font-bold cursor-pointer"
                            >
                              نمایش همهٔ صفحات
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {filteredPosts.map((post) => {
                              const authorMember = bookState.members.find(
                                (m) => m.handle === post.authorHandle
                              );
                              const selectedDmId =
                                dmTargetByPost[post.id] ?? bookState.members[0]?.id ?? 'bm-1';

                              return (
                                <article
                                  key={post.id}
                                  data-testid={`audio-social-post-${post.id}`}
                                  className="relative border-b-2 border-[#8C2D19]/20 pb-7 space-y-4"
                                >
                                  {/* Folio Running Header & Author */}
                                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          authorMember && setSelectedAuthor(authorMember)
                                        }
                                        className="shrink-0 cursor-pointer"
                                        aria-label={`مشاهده شناسنامه ${post.authorDisplayNameFa}`}
                                      >
                                        <img
                                          src={post.avatarUrl}
                                          alt={post.authorDisplayNameFa}
                                          referrerPolicy="no-referrer"
                                          className="w-11 h-11 object-cover rounded-full border-2 border-[#8C2D19]/45 sepia-[0.72] saturate-[0.75] contrast-[1.08]"
                                        />
                                      </button>

                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#6A533C]">
                                          <span className="font-bold text-[#8C2D19]">
                                            {post.pageNumberFa}
                                          </span>
                                          <span aria-hidden="true">·</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              authorMember && setSelectedAuthor(authorMember)
                                            }
                                            className="font-extrabold text-[#1F1812] hover:text-[#8C2D19] transition cursor-pointer"
                                          >
                                            {post.authorDisplayNameFa}
                                          </button>
                                          <span aria-hidden="true">·</span>
                                          <span dir="ltr" className="inline-block">@{post.authorHandle}</span>
                                        </div>
                                        <div className="text-[11px] text-[#7B6650] mt-0.5">
                                          {post.circleFa} · {AUDIO_ROOM_LABELS[post.roomId]} ·{' '}
                                          {post.timestamp}
                                        </div>
                                      </div>
                                    </div>

                                    {authorMember && (
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => openPrivateLetterWith(authorMember)}
                                          aria-label={`نامه خصوصی به ${authorMember.displayNameFa}`}
                                          className="w-8 h-8 border border-[#C5B18C] bg-[#FAF4E4] hover:border-[#1E3A5F] flex items-center justify-center text-[#1E3A5F] cursor-pointer"
                                        >
                                          <Mail className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setBookState((prev) =>
                                              toggleBookFriendConnection(prev, authorMember.id)
                                            )
                                          }
                                          className={`h-8 px-2.5 border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                            authorMember.isFriend
                                              ? 'border-[#1E3A5F]/40 bg-[#1E3A5F]/10 text-[#1E3A5F]'
                                              : 'border-[#C5B18C] bg-[#FAF4E4] text-[#3E2F23] hover:border-[#8C2D19]'
                                          }`}
                                        >
                                          {authorMember.isFriend ? (
                                            <>
                                              <Check className="w-3 h-3" />
                                              <span>هم‌صحبت</span>
                                            </>
                                          ) : (
                                            <>
                                              <UserPlus className="w-3 h-3" />
                                              <span>افزودن</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Literary Chapter Heading */}
                                  <h3
                                    style={BOOK_FONT_STYLE}
                                    className="text-[21px] sm:text-[24px] font-bold text-[#1F1812] leading-snug"
                                  >
                                    {post.chapterTitleFa}
                                  </h3>

                                  {/* Optional Philosophical / Poetic Epigraph */}
                                  {post.epigraphPoemFa && (
                                    <blockquote
                                      style={BOOK_FONT_STYLE}
                                      className="py-2.5 px-4 border-y border-[#8C2D19]/25 bg-[#F4EAD2]/55 text-[17px] italic text-[#6A2416] text-center leading-relaxed"
                                    >
                                      «{post.epigraphPoemFa}»
                                    </blockquote>
                                  )}

                                  {/* Flowing Lined-Paper Book Prose */}
                                  <p
                                    style={BOOK_FONT_STYLE}
                                    className="text-[17.5px] sm:text-[18.5px] leading-[1.98] text-[#231B14]"
                                  >
                                    {post.captionFa}
                                  </p>

                                  {/* Handwritten-Style Illustration + Audio Play Ribbon */}
                                  {post.audioPreviewUrl ? (
                                    <div className="p-3 border border-[#C5B18C] bg-[#F3EBD6] space-y-2">
                                      <audio
                                        src={post.audioPreviewUrl}
                                        controls
                                        className="w-full h-10"
                                      />
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-[12px] font-bold text-[#8C2D19]">
                                          {post.audioTitleTag}
                                        </span>
                                        <button
                                          type="button"
                                          data-testid={`audio-post-play-btn-${post.id}`}
                                          onClick={() =>
                                            onPlayStreamInHub(
                                              toAudioStreamPost({
                                                id: post.id,
                                                roomId: post.roomId,
                                                titleFa: post.audioTitleTag,
                                                captionFa: post.captionFa,
                                                streamUrl:
                                                  post.streamUrl ?? post.audioPreviewUrl ?? '',
                                                streamFormat: post.streamFormat ?? 'MP3',
                                                authorHandle: post.authorHandle,
                                                telegramChannel: post.telegramChannel,
                                                authorTag: post.authorTag,
                                                likesCount: post.likesCount,
                                                timestampLabel: post.timestamp,
                                              })
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#8C2D19] text-[#FAF4E4] text-[11.5px] font-bold cursor-pointer"
                                        >
                                          <Headphones className="w-3.5 h-3.5" />
                                          <span>شنیدن در تالار</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    post.mediaUrl && (
                                      <figure className="border border-[#B8A27E] bg-[#F4EAD2] p-2">
                                        <div className="relative aspect-[16/9] overflow-hidden border border-[#8C2D19]/15">
                                          <img
                                            src={post.mediaUrl}
                                            alt={post.audioTitleTag}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <figcaption className="pt-2 px-1 flex flex-wrap items-center justify-between gap-2">
                                          <div className="min-w-0">
                                            <p
                                              style={BOOK_FONT_STYLE}
                                              className="text-[15.5px] font-bold text-[#1F1812] truncate"
                                            >
                                              {post.audioTitleTag}
                                            </p>
                                            {post.telegramChannel && (
                                              <p
                                                dir="ltr"
                                                className="font-mono-tabular text-[11px] text-[#6A533C] truncate"
                                              >
                                                {post.telegramChannel}
                                              </p>
                                            )}
                                          </div>

                                          <button
                                            type="button"
                                            data-testid={`audio-post-play-btn-${post.id}`}
                                            onClick={() =>
                                              onPlayStreamInHub(
                                                toAudioStreamPost({
                                                  id: post.id,
                                                  roomId: post.roomId,
                                                  titleFa: post.audioTitleTag,
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
                                            className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#8C2D19] hover:bg-[#732312] text-[#FAF4E4] text-[12px] font-bold cursor-pointer whitespace-nowrap"
                                          >
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>شنیدن در تالار صدا</span>
                                          </button>
                                        </figcaption>
                                      </figure>
                                    )
                                  )}

                                  {/* Literary Social Actions Row */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <button
                                        type="button"
                                        data-testid={`audio-post-like-btn-${post.id}`}
                                        onClick={() =>
                                          setBookState((prev) =>
                                            toggleBookPostReaction(prev, post.id, 'like')
                                          )
                                        }
                                        className={`inline-flex items-center gap-1.5 h-8 px-2.5 border text-[12px] font-bold transition cursor-pointer ${
                                          post.userReaction === 'like'
                                            ? 'border-[#8C2D19] bg-[#8C2D19] text-[#FAF4E4]'
                                            : 'border-[#C5B18C] bg-[#FAF4E4] text-[#3E2F23] hover:border-[#8C2D19]'
                                        }`}
                                      >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        <span className="font-mono-tabular">
                                          پسندیدم {post.likesCount}
                                        </span>
                                      </button>

                                      <button
                                        type="button"
                                        data-testid={`audio-post-dislike-btn-${post.id}`}
                                        onClick={() =>
                                          setBookState((prev) =>
                                            toggleBookPostReaction(prev, post.id, 'dislike')
                                          )
                                        }
                                        className={`inline-flex items-center gap-1 h-8 px-2.5 border text-[12px] font-bold transition cursor-pointer ${
                                          post.userReaction === 'dislike'
                                            ? 'border-[#1E3A5F] bg-[#1E3A5F] text-[#FAF4E4]'
                                            : 'border-[#C5B18C] bg-[#FAF4E4] text-[#6A533C] hover:text-[#1F1812]'
                                        }`}
                                      >
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                        <span className="font-mono-tabular">
                                          {post.dislikesCount}
                                        </span>
                                      </button>

                                      <button
                                        type="button"
                                        data-testid={`audio-post-comment-toggle-${post.id}`}
                                        onClick={() =>
                                          setOpenCommentsMap((prev) => ({
                                            ...prev,
                                            [post.id]: !prev[post.id],
                                          }))
                                        }
                                        className={`inline-flex items-center gap-1.5 h-8 px-2.5 border text-[12px] font-bold transition cursor-pointer ${
                                          openCommentsMap[post.id]
                                            ? 'border-[#1E3A5F] bg-[#1E3A5F]/12 text-[#1E3A5F]'
                                            : 'border-[#C5B18C] bg-[#FAF4E4] text-[#3E2F23] hover:border-[#1E3A5F]'
                                        }`}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span className="font-mono-tabular">
                                          حاشیه {post.comments.length}
                                        </span>
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        data-testid={`audio-post-bookmark-${post.id}`}
                                        onClick={() =>
                                          setBookState((prev) =>
                                            toggleBookPostBookmark(prev, post.id)
                                          )
                                        }
                                        aria-label="نشانک صفحه"
                                        className={`inline-flex items-center justify-center w-8 h-8 border transition cursor-pointer ${
                                          post.bookmarkedByMe
                                            ? 'border-[#8C2D19] bg-[#8C2D19] text-[#FAF4E4]'
                                            : 'border-[#C5B18C] bg-[#FAF4E4] text-[#6A533C] hover:border-[#8C2D19]'
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
                                        data-testid={`audio-post-share-btn-${post.id}`}
                                        onClick={() =>
                                          setOpenSharePostId((curr) =>
                                            curr === post.id ? null : post.id
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 h-8 px-2.5 border border-[#C5B18C] bg-[#FAF4E4] hover:border-[#8C2D19] text-[12px] font-bold text-[#3E2F23] transition cursor-pointer"
                                      >
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span>نقل و ارسال خصوصی</span>
                                      </button>
                                    </div>
                                  </div>

                                  {actionToastByPost[post.id] && (
                                    <div className="px-3 py-2 bg-[#1E3A5F]/10 border border-[#1E3A5F]/30 text-[12px] font-bold text-[#1E3A5F]">
                                      {actionToastByPost[post.id]}
                                    </div>
                                  )}

                                  {/* Share / Private Letter Forward Drawer */}
                                  {openSharePostId === post.id && (
                                    <div className="p-3 bg-[#F3EBD6] border border-[#C5B18C] space-y-2.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleShareCopy(post)}
                                          className="h-8 px-3 border border-[#B8A27E] bg-[#FAF4E4] text-[11.5px] font-bold text-[#1F1812] cursor-pointer"
                                        >
                                          کپی نشانی برگه
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleShareToChannel(
                                              post,
                                              'book-global',
                                              'در تالار همگانی نقل شد.'
                                            )
                                          }
                                          className="h-8 px-3 bg-[#8C2D19] text-[#FAF4E4] text-[11.5px] font-bold cursor-pointer"
                                        >
                                          نقل در تالار همگانی
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
                                            className="h-8 px-3 border border-[#9A6B22]/50 bg-[#FAF4E4] text-[#7A5114] text-[11.5px] font-bold cursor-pointer"
                                          >
                                            ارسال به محفل {c.tag}
                                          </button>
                                        ))}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D3C19F]">
                                        <span className="text-[11.5px] font-bold text-[#5C4B3B]">
                                          ارسال به نامهٔ خصوصی برای:
                                        </span>
                                        <select
                                          data-testid={`audio-forward-dm-select-${post.id}`}
                                          value={selectedDmId}
                                          onChange={(e) =>
                                            setDmTargetByPost((prev) => ({
                                              ...prev,
                                              [post.id]: e.target.value,
                                            }))
                                          }
                                          className="h-8 px-2.5 bg-[#FAF4E4] border border-[#B8A27E] text-[12px] text-[#1F1812]"
                                        >
                                          {bookState.members.map((m) => (
                                            <option key={m.id} value={m.id}>
                                              {m.displayNameFa}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          data-testid={`audio-forward-dm-btn-${post.id}`}
                                          onClick={() => {
                                            const target = bookState.members.find(
                                              (m) => m.id === selectedDmId
                                            );
                                            handleShareToChannel(
                                              post,
                                              `dm-${selectedDmId}`,
                                              `برگه به نامهٔ خصوصی ${target?.displayNameFa ?? 'دوست شما'} فرستاده شد.`
                                            );
                                          }}
                                          className="h-8 px-3 bg-[#1E3A5F] text-[#FAF4E4] text-[11.5px] font-bold cursor-pointer"
                                        >
                                          ارسال نامهٔ خصوصی
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Marginalia Comments Section */}
                                  {openCommentsMap[post.id] && (
                                    <div className="pt-2 pr-4 border-r-2 border-[#8C2D19]/30 space-y-2.5">
                                      {post.comments.length > 0 && (
                                        <div className="space-y-2">
                                          {post.comments.map((cm) => (
                                            <div
                                              key={cm.id}
                                              className="flex items-start justify-between gap-2.5 p-2.5 bg-[#F4EAD2]/70 border border-[#D4C2A0]"
                                            >
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 text-[11px] text-[#6A533C]">
                                                  <span dir="ltr" className="inline-block font-bold text-[#8C2D19]">
                                                    @{cm.authorHandle}
                                                  </span>
                                                  <span aria-hidden="true">·</span>
                                                  <span>{cm.timestamp}</span>
                                                </div>
                                                <p
                                                  style={BOOK_FONT_STYLE}
                                                  className="text-[15.5px] text-[#1F1812] mt-0.5 leading-relaxed"
                                                >
                                                  {cm.text}
                                                </p>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setBookState((prev) =>
                                                    toggleBookCommentLike(prev, post.id, cm.id)
                                                  )
                                                }
                                                className={`inline-flex items-center gap-1 px-2 py-1 border text-[11px] font-bold cursor-pointer shrink-0 ${
                                                  cm.likedByMe
                                                    ? 'border-[#8C2D19] bg-[#8C2D19] text-[#FAF4E4]'
                                                    : 'border-[#C5B18C] text-[#5C4B3B]'
                                                }`}
                                              >
                                                <Heart
                                                  className={`w-3 h-3 ${
                                                    cm.likedByMe ? 'fill-current' : ''
                                                  }`}
                                                />
                                                <span className="font-mono-tabular">
                                                  {cm.likesCount}
                                                </span>
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
                                          data-testid={`audio-post-comment-input-${post.id}`}
                                          value={commentInputs[post.id] ?? ''}
                                          onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                              ...prev,
                                              [post.id]: e.target.value,
                                            }))
                                          }
                                          placeholder="حاشیه یا نظر خود را بر این صفحه بنویسید..."
                                          className="flex-1 h-9 px-3 bg-white/80 border border-[#C5B18C] text-[12.5px] text-[#1F1812] outline-none focus:border-[#8C2D19]"
                                        />
                                        <button
                                          type="submit"
                                          data-testid={`audio-post-comment-submit-${post.id}`}
                                          className="h-9 px-3.5 bg-[#1E3A5F] text-[#FAF4E4] text-[12px] font-bold cursor-pointer shrink-0"
                                        >
                                          ثبت حاشیه
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

                    {/* ================= CHAPTER 3: AUTHORS & FRIENDS ================= */}
                    {bookState.activeTab === 'friends' && (
                      <div
                        data-testid="audio-social-panel-friends"
                        className="p-4 sm:p-7 space-y-5"
                      >
                        <div className="border-b-2 border-[#8C2D19]/25 pb-4 space-y-3">
                          <div>
                            <span className="text-[11px] font-bold text-[#8C2D19]">
                              فصل سوم · تذکرهٔ هم‌صحبتان
                            </span>
                            <h2
                              style={BOOK_FONT_STYLE}
                              className="text-[22px] sm:text-[26px] font-bold text-[#1F1812]"
                            >
                              شاعران، فیلسوفان و دوستانِ اهلِ صدا
                            </h2>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1">
                              {(
                                [
                                  { id: 'all', label: 'همهٔ نویسندگان' },
                                  { id: 'online', label: 'در حال مطالعه / آنلاین' },
                                  { id: 'friends', label: `دوستان من (${friendsCount})` },
                                ] as const
                              ).map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => setFriendFilter(f.id)}
                                  className={`px-3 py-1.5 text-[11.5px] font-bold border transition cursor-pointer ${
                                    friendFilter === f.id
                                      ? 'bg-[#8C2D19] text-[#FAF4E4] border-[#8C2D19]'
                                      : 'bg-[#FAF4E4] border-[#C5B18C] text-[#4B3B2C]'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>

                            <div className="relative flex-1 max-w-xs">
                              <Search className="w-3.5 h-3.5 text-[#7B6650] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={friendSearch}
                                onChange={(e) => setFriendSearch(e.target.value)}
                                placeholder="جستجوی نام یا جملهٔ فلسفی..."
                                className="w-full h-9 pr-8 pl-2.5 bg-white/80 border border-[#C5B18C] text-[12px] text-[#1F1812] outline-none focus:border-[#8C2D19]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredMembers.map((member) => (
                            <article
                              key={member.id}
                              data-testid={`audio-friend-card-${member.id}`}
                              className="border border-[#B8A27E] bg-[#FAF4E4]/95 p-4 flex flex-col justify-between gap-3"
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={member.avatarUrl}
                                  alt={member.displayNameFa}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-full object-cover border-2 border-[#8C2D19]/45 sepia-[0.72] saturate-[0.75] contrast-[1.08] shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <h3
                                    style={BOOK_FONT_STYLE}
                                    className="text-[18px] font-bold text-[#1F1812] truncate"
                                  >
                                    {member.displayNameFa}
                                  </h3>
                                  <p className="text-[11.5px] text-[#8C2D19] truncate flex items-center gap-1">
                                    <span>{member.penNameLabel}</span>
                                    <span aria-hidden="true">·</span>
                                    <span dir="ltr" className="inline-block">@{member.handle}</span>
                                  </p>
                                  <p className="text-[11px] text-[#6A533C] mt-0.5 truncate">
                                    {member.circleFa}
                                  </p>
                                </div>
                              </div>

                              <blockquote
                                style={BOOK_FONT_STYLE}
                                className="text-[15.5px] italic text-[#4B3B2C] border-y border-[#8C2D19]/15 py-2 leading-relaxed"
                              >
                                «{member.philosophyQuoteFa}»
                              </blockquote>

                              <p className="text-[11.5px] text-[#5C4B3B]">
                                اثر محبوب:{' '}
                                <span className="font-bold text-[#1F1812]">
                                  {member.favoriteWorkFa}
                                </span>
                              </p>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  data-testid={`audio-friend-toggle-${member.id}`}
                                  onClick={() =>
                                    setBookState((prev) =>
                                      toggleBookFriendConnection(prev, member.id)
                                    )
                                  }
                                  className={`flex-1 h-9 px-2.5 border text-[11.5px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer ${
                                    member.isFriend
                                      ? 'border-[#1E3A5F] bg-[#1E3A5F] text-[#FAF4E4]'
                                      : 'border-[#C5B18C] bg-[#FAF4E4] text-[#1F1812] hover:border-[#8C2D19]'
                                  }`}
                                >
                                  {member.isFriend ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>هم‌صحبت شما</span>
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
                                  onClick={() => openPrivateLetterWith(member)}
                                  className="h-9 px-3 bg-[#8C2D19] text-[#FAF4E4] text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>نامه</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedAuthor(member)}
                                  className="h-9 px-2.5 border border-[#B8A27E] bg-[#F3EBD6] text-[#1F1812] text-[11.5px] font-bold cursor-pointer shrink-0"
                                >
                                  تذکره
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ================= CHAPTER 4: LITERARY & MUSIC CLUBS ================= */}
                    {bookState.activeTab === 'clubs' && (
                      <div
                        data-testid="audio-social-panel-clubs"
                        className="p-4 sm:p-7 space-y-5"
                      >
                        <div className="border-b-2 border-[#8C2D19]/25 pb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-bold text-[#8C2D19]">
                              فصل چهارم · محفل‌های ادب و نغمه
                            </span>
                            <h2
                              style={BOOK_FONT_STYLE}
                              className="text-[22px] sm:text-[26px] font-bold text-[#1F1812]"
                            >
                              انجمن‌ها و کلاب‌های کتاب، شعر و موسیقی
                            </h2>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowNewClubForm((v) => !v)}
                            className="h-9 px-3.5 bg-[#8C2D19] text-[#FAF4E4] text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>گشودن محفل جدید</span>
                          </button>
                        </div>

                        {showNewClubForm && (
                          <form
                            onSubmit={handleCreateClub}
                            className="p-4 border border-[#8C2D19]/40 bg-[#F4EAD2] space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <input
                                type="text"
                                required
                                value={newClubName}
                                onChange={(e) => setNewClubName(e.target.value)}
                                placeholder="نام محفل یا کلاب..."
                                className="sm:col-span-2 h-9 px-3 bg-[#FAF4E4] border border-[#B8A27E] text-[12.5px] text-[#1F1812] outline-none"
                              />
                              <input
                                type="text"
                                value={newClubTag}
                                onChange={(e) => setNewClubTag(e.target.value)}
                                placeholder="نشان (مثلاً حافظ)"
                                className="h-9 px-3 bg-[#FAF4E4] border border-[#B8A27E] text-[12.5px] text-[#8C2D19] outline-none"
                              />
                            </div>
                            <input
                              type="text"
                              value={newClubMotto}
                              onChange={(e) => setNewClubMotto(e.target.value)}
                              placeholder="توضیح و مرام‌نامهٔ محفل..."
                              className="w-full h-9 px-3 bg-[#FAF4E4] border border-[#B8A27E] text-[12.5px] text-[#1F1812] outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowNewClubForm(false)}
                                className="h-8 px-3 border border-[#B8A27E] text-[11.5px] cursor-pointer"
                              >
                                انصراف
                              </button>
                              <button
                                type="submit"
                                className="h-8 px-4 bg-[#8C2D19] text-[#FAF4E4] text-[12px] font-bold cursor-pointer"
                              >
                                ثبت محفل
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-6">
                          {bookState.clubs.map((club) => (
                            <article
                              key={club.id}
                              data-testid={`audio-club-card-${club.id}`}
                              className="border border-[#B8A27E] bg-[#FAF4E4]/95 overflow-hidden"
                            >
                              <div className="relative h-36 bg-[#2A1D14] overflow-hidden">
                                <img
                                  src={club.bannerUrl}
                                  alt={club.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover opacity-80"
                                />
                                <div
                                  aria-hidden="true"
                                  className="absolute inset-0 bg-gradient-to-t from-[#140D08]/95 via-[#140D08]/65 to-[#140D08]/15"
                                />
                                <div className="absolute bottom-3 right-4 left-4 flex flex-wrap items-end justify-between gap-2 text-[#FAF4E4]">
                                  <div className="drop-shadow-[0_1px_5px_rgba(0,0,0,0.85)]">
                                    <p className="text-[11px] font-semibold text-[#F6DAA4]">
                                      {club.tag} · {club.membersCount} عضو
                                    </p>
                                    <h3
                                      style={BOOK_FONT_STYLE}
                                      className="text-[20px] font-bold text-[#FAF4E4]"
                                    >
                                      {club.name}
                                    </h3>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveChannelId(`club-${club.id}`);
                                        if (
                                          typeof window !== 'undefined' &&
                                          window.innerWidth < 1024
                                        ) {
                                          switchTab('chat');
                                        }
                                      }}
                                      className="h-8 px-2.5 border border-[#FAF4E4]/45 bg-[#1D130C]/80 text-[#FAF4E4] text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>گفت‌وگوی محفل</span>
                                    </button>

                                    <button
                                      type="button"
                                      data-testid={`audio-club-join-${club.id}`}
                                      onClick={() =>
                                        setBookState((prev) =>
                                          toggleBookClubMembership(prev, club.id)
                                        )
                                      }
                                      className={`h-8 px-3 text-[11.5px] font-bold cursor-pointer ${
                                        club.isJoined
                                          ? 'bg-[#1E3A5F] text-[#FAF4E4]'
                                          : 'bg-[#8C2D19] text-[#FAF4E4]'
                                      }`}
                                    >
                                      {club.isJoined ? 'عضو هستید' : 'پیوستن به محفل'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 space-y-3">
                                <p
                                  style={BOOK_FONT_STYLE}
                                  className="text-[16.5px] text-[#231B14] leading-relaxed"
                                >
                                  {club.mottoFa}
                                </p>

                                {club.entries.length > 0 && (
                                  <div className="space-y-2 border-t border-[#C5B18C] pt-3">
                                    {club.entries.slice(0, 3).map((ent) => (
                                      <div
                                        key={ent.id}
                                        className="p-2.5 bg-[#F4EAD2]/75 border border-[#D4C2A0] space-y-1.5"
                                      >
                                        <div className="flex items-center justify-between text-[11px] text-[#6A533C]">
                                          <span dir="ltr" className="inline-block font-bold text-[#8C2D19]">
                                            @{ent.authorHandle}
                                          </span>
                                          <span>{ent.timestamp}</span>
                                        </div>
                                        <p
                                          style={BOOK_FONT_STYLE}
                                          className="text-[15.5px] text-[#1F1812]"
                                        >
                                          {ent.text}
                                        </p>
                                        {ent.streamUrl && (
                                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-[11.5px] font-bold text-[#1E3A5F]">
                                              {ent.audioTitleFa ?? 'نغمهٔ محفل'}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                onPlayStreamInHub(
                                                  toAudioStreamPost({
                                                    id: ent.id,
                                                    roomId: ent.roomId ?? activeRoomId,
                                                    titleFa: ent.audioTitleFa ?? club.name,
                                                    captionFa: ent.text,
                                                    streamUrl: ent.streamUrl ?? '',
                                                    streamFormat: ent.streamFormat,
                                                    authorHandle: ent.authorHandle,
                                                    authorTag: club.tag,
                                                  })
                                                )
                                              }
                                              className="inline-flex items-center gap-1 h-7 px-2.5 bg-[#8C2D19] text-[#FAF4E4] text-[11px] font-bold cursor-pointer"
                                            >
                                              <Play className="w-3 h-3 fill-current" />
                                              <span>شنیدن در تالار</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="pt-2 border-t border-[#C5B18C] space-y-2">
                                  {openClubAudioBar[club.id] && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-[#F4EAD2] border border-[#C5B18C]">
                                      <input
                                        type="text"
                                        value={clubTitleDrafts[club.id] ?? ''}
                                        onChange={(e) =>
                                          setClubTitleDrafts((prev) => ({
                                            ...prev,
                                            [club.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="عنوان قطعهٔ صوتی..."
                                        className="h-8 px-2.5 bg-white/80 border border-[#B8A27E] text-[12px] text-[#1F1812]"
                                      />
                                      <input
                                        type="text"
                                        dir="ltr"
                                        value={clubUrlDrafts[club.id] ?? ''}
                                        onChange={(e) =>
                                          setClubUrlDrafts((prev) => ({
                                            ...prev,
                                            [club.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="https://...mp3 یا .m3u8 یا تلگرام"
                                        className="h-8 px-2.5 bg-white/80 border border-[#B8A27E] font-mono-tabular text-[11.5px] text-[#1E3A5F]"
                                      />
                                    </div>
                                  )}

                                  {clubErrorById[club.id] && (
                                    <p className="text-[11.5px] text-[#8C2D19]">
                                      {clubErrorById[club.id]}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={clubDrafts[club.id] ?? ''}
                                      onChange={(e) =>
                                        setClubDrafts((prev) => ({
                                          ...prev,
                                          [club.id]: e.target.value,
                                        }))
                                      }
                                      placeholder={`یادداشت یا پیشنهاد قطعه برای ${club.name}...`}
                                      className="flex-1 min-w-[180px] h-9 px-3 bg-white/80 border border-[#C5B18C] text-[12.5px] text-[#1F1812] outline-none focus:border-[#8C2D19]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenClubAudioBar((prev) => ({
                                          ...prev,
                                          [club.id]: !prev[club.id],
                                        }))
                                      }
                                      className="h-9 px-2.5 border border-[#C5B18C] bg-[#FAF4E4] text-[11.5px] font-bold text-[#1E3A5F] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Music className="w-3.5 h-3.5" />
                                      <span>لینک صدا</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleClubEntrySubmit(club.id)}
                                      className="h-9 px-3.5 bg-[#8C2D19] text-[#FAF4E4] text-[12px] font-bold cursor-pointer"
                                    >
                                      ثبت در محفل
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FACING LEFT PAGE: EPISTOLARY NOTEBOOK (Live Chat & Private Letters on Desktop) */}
                  <aside
                    data-testid="audio-social-panel-chat"
                    className="hidden lg:flex lg:col-span-5 flex-col lg:sticky lg:top-16 border-r border-[#C5B18C]"
                  >
                    {renderNotebookLettersPanel(true)}
                  </aside>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================== */}
      {/* POP-OUT LITERARY PAGE COMPOSER MODAL                                    */}
      {/* ======================================================================== */}
      {isCreateOpen && (
        <div
          data-testid="audio-create-post-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto border-4 border-[#3B2619] bg-[#FAF4E4] text-[#1F1812] shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#C5B18C] bg-[#F2E8D0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-[#8C2D19]" />
                <h2 style={BOOK_FONT_STYLE} className="text-[20px] font-bold">
                  نگارش برگهٔ تازه در دیوانِ صدا
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="بستن"
                className="w-8 h-8 border border-[#B8A27E] flex items-center justify-center text-[#1F1812] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#5C4B3B] mb-1">
                    عنوان برگه یا فصل
                  </label>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="مثلاً در ستایشِ سکوتِ شب..."
                    className="w-full h-9 px-3 bg-white/85 border border-[#C5B18C] text-[12.5px] text-[#1F1812] outline-none focus:border-[#8C2D19]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#5C4B3B] mb-1">
                    تالار پخش همراه
                  </label>
                  <select
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value as AudioRoomId)}
                    className="w-full h-9 px-3 bg-white/85 border border-[#C5B18C] text-[12.5px] text-[#1F1812]"
                  >
                    {Object.entries(AUDIO_ROOM_LABELS).map(([rid, lbl]) => (
                      <option key={rid} value={rid}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#5C4B3B] mb-1">
                  بیتِ شعر یا جملهٔ فلسفیِ آغازین (اختیاری)
                </label>
                <input
                  type="text"
                  value={newEpigraph}
                  onChange={(e) => setNewEpigraph(e.target.value)}
                  placeholder="جمله‌ای کوتاه برای سرلوحهٔ صفحه..."
                  className="w-full h-9 px-3 bg-white/85 border border-[#C5B18C] text-[12.5px] text-[#8C2D19] outline-none focus:border-[#8C2D19]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#5C4B3B] mb-1">
                  متن نوشته یا معرفی قطعه *
                </label>
                <textarea
                  rows={3}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="تأملات، شعر یا حس‌وحال این موسیقی و کتاب صوتی را بنویسید..."
                  className="w-full p-3 bg-white/85 border border-[#C5B18C] text-[13px] text-[#1F1812] outline-none focus:border-[#8C2D19] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11.5px] text-[#6A533C] mb-1">
                    نام اثر / قطعه / کتاب
                  </label>
                  <input
                    type="text"
                    value={newAudioTitle}
                    onChange={(e) => setNewAudioTitle(e.target.value)}
                    placeholder="مثلاً Nocturne in C Minor"
                    className="w-full h-9 px-3 bg-white/85 border border-[#C5B18C] text-[12px] text-[#1F1812]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-[#6A533C] mb-1">
                    لینک مستقیم صوت / تلگرام / MP3
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newStreamUrl}
                    onChange={(e) => setNewStreamUrl(e.target.value)}
                    placeholder="https://...mp3 یا .m3u8"
                    className="w-full h-9 px-3 bg-white/85 border border-[#C5B18C] font-mono-tabular text-[11.5px] text-[#1E3A5F]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[#5C4B3B]">طرحِ قلمی برگه یا آپلود از دستگاه</span>
                  <div>
                    <input
                      ref={postFileInputRef}
                      type="file"
                      accept="audio/*,image/*,video/*"
                      onChange={handleUploadPostMedia}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => postFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 h-7 px-2.5 border border-[#8C2D19] text-[#8C2D19] text-[11px] font-bold cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>آپلود صوت یا تصویر</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BOOK_INK_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setNewMediaUrl(preset.url);
                        setNewAudioPreviewUrl('');
                      }}
                      className={`aspect-video overflow-hidden border-2 transition cursor-pointer ${
                        newMediaUrl === preset.url && !newAudioPreviewUrl
                          ? 'border-[#8C2D19]'
                          : 'border-[#C5B18C] opacity-75 hover:opacity-100'
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

              {createError && (
                <p className="text-[12px] text-[#8C2D19] bg-[#8C2D19]/10 border border-[#8C2D19]/30 px-3 py-2">
                  {createError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#C5B18C]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-9 px-4 border border-[#B8A27E] text-[12px] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#8C2D19] text-[#FAF4E4] text-[12.5px] font-bold cursor-pointer"
                >
                  ثبت در دیوان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* EX-LIBRIS AUTHOR DOSSIER MODAL                                          */}
      {/* ======================================================================== */}
      {selectedAuthor && (
        <div
          data-testid="audio-author-exlibris-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md border-4 border-[#3B2619] bg-[#FAF4E4] text-[#1F1812] shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#C5B18C] bg-[#F2E8D0] flex items-center justify-between">
              <span style={BOOK_FONT_STYLE} className="text-[18px] font-bold text-[#8C2D19]">
                تذکرهٔ هم‌صحبت
              </span>
              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                aria-label="بستن شناسنامه"
                className="w-8 h-8 border border-[#B8A27E] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <img
                  src={selectedAuthor.avatarUrl}
                  alt={selectedAuthor.displayNameFa}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#8C2D19]/45 sepia-[0.72] saturate-[0.75] contrast-[1.08] shrink-0"
                />
                <div>
                  <h3 style={BOOK_FONT_STYLE} className="text-[20px] font-bold">
                    {selectedAuthor.displayNameFa}
                  </h3>
                  <p className="text-[12px] text-[#8C2D19]">{selectedAuthor.penNameLabel}</p>
                  <p className="text-[11.5px] text-[#6A533C]">{selectedAuthor.cityLocationFa}</p>
                </div>
              </div>

              <blockquote
                style={BOOK_FONT_STYLE}
                className="py-2.5 px-3 border-y border-[#8C2D19]/25 bg-[#F4EAD2]/70 text-[16px] italic text-[#6A2416] text-center"
              >
                «{selectedAuthor.philosophyQuoteFa}»
              </blockquote>

              <p style={BOOK_FONT_STYLE} className="text-[16px] leading-relaxed text-[#231B14]">
                {selectedAuthor.bioFa}
              </p>

              <p className="text-[12px] text-[#5C4B3B]">
                علاقه‌مندی‌ها:{' '}
                <strong className="text-[#1F1812]">{selectedAuthor.interests.join(' · ')}</strong>
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => openPrivateLetterWith(selectedAuthor)}
                  className="flex-1 h-10 bg-[#8C2D19] text-[#FAF4E4] text-[12.5px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>نگارش نامهٔ خصوصی و ارسال صدا</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBookState((prev) =>
                      toggleBookFriendConnection(prev, selectedAuthor.id)
                    );
                    setSelectedAuthor((curr) =>
                      curr ? { ...curr, isFriend: !curr.isFriend } : null
                    );
                  }}
                  className="h-10 px-4 border border-[#B8A27E] bg-[#F3EBD6] text-[12px] font-bold cursor-pointer"
                >
                  {selectedAuthor.isFriend ? 'حذف دوستی' : 'افزودن دوست'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

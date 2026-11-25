import React, { useState } from 'react';
import {
  Crown,
  Flame,
  MessageSquare,
  Send,
  Shield,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { GtaGamerProfile } from '../../utils/gtaSocialRules';

interface PlayerProfileModalProps {
  gamer: GtaGamerProfile;
  allGamers: GtaGamerProfile[];
  onClose: () => void;
  onToggleFriend: (gamerId: string) => void;
  onOpenDirectChat: (gamerId: string) => void;
  onPostFanClubMessage?: (gamerId: string, text: string) => void;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

function computePlayerOvr(gamer: GtaGamerProfile): number {
  const base = gamer.winRatePct ?? 80;
  return Math.min(99, Math.max(82, Math.round(base + 12)));
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  gamer,
  allGamers,
  onClose,
  onToggleFriend,
  onOpenDirectChat,
  onPostFanClubMessage,
}) => {
  const [isFanClubDrawerOpen, setIsFanClubDrawerOpen] = useState<boolean>(false);
  const [fanClubInput, setFanClubInput] = useState<string>('');
  const [joinedFanClub, setJoinedFanClub] = useState<boolean>(false);

  const winsCount = gamer.winsCount ?? 142;
  const lossesCount = gamer.lossesCount ?? 28;
  const championshipsCount = gamer.championshipsCount ?? 7;
  const seasonBadgeFa = gamer.seasonBadgeFa ?? 'قهرمان فصل';
  const firstNameFa = gamer.displayNameFa.split('·')[0].trim();
  const fanClubTitleFa =
    gamer.fanClubTitleFa ?? `کلوپ هواداران ${firstNameFa}`;
  const fanClubMembersCount =
    (gamer.fanClubMembersCount ?? 1240) + (joinedFanClub ? 1 : 0);
  const fanClubPosts = gamer.fanClubPosts ?? [
    {
      id: 'fc-default-1',
      authorHandle: gamer.handle,
      text: `دم همه بچه‌های ${fanClubTitleFa} گرم! امشب در فینال جام پایتخت منتظرتونم.`,
      timestamp: '22:30',
    },
  ];
  const ovrRating = computePlayerOvr(gamer);
  const clanTag = gamer.clanTag ?? 'SAS';

  const handleFanClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fanClubInput.trim()) return;
    onPostFanClubMessage?.(gamer.id, fanClubInput);
    setFanClubInput('');
    setJoinedFanClub(true);
  };

  return (
    <div
      data-testid="modal-player-profile"
      dir="rtl"
      style={{ fontFamily: "'Vazirmatn', var(--font-sans)" }}
      className="fixed inset-0 z-50 bg-[#04060A]/82 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm fc27-panel p-4 space-y-3 shadow-[0_24px_64px_rgba(0,0,0,0.92)] overflow-hidden">
        {/* Top Modal Header Bar */}
        <div className="flex items-center justify-between border-b border-white/12 pb-2.5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-xs font-black text-white">
              کارت بازیکن و کلوپ هواداران
            </span>
          </div>
          <button
            type="button"
            data-testid="close-player-profile-btn"
            aria-label="بستن پروفایل بازیکن"
            onClick={onClose}
            className="w-7 h-7 fc27-btn-dark flex items-center justify-center text-white/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Iconic FC 27 Ultimate Team Rare Gold Player Card Hero */}
        <section className="fc27-card-gold p-3.5 space-y-3">
          <div className="flex items-center gap-3">
            {/* FUT Left OVR + Club Strip */}
            <div className="flex flex-col items-center justify-center shrink-0 pl-2.5 border-l border-[#F5C542]/35 leading-none">
              <span
                dir="ltr"
                className="font-display text-4xl font-black italic text-[#F5C542] tracking-tight"
              >
                {ovrRating}
              </span>
              <span
                dir="ltr"
                className="font-mono-tabular text-[10px] font-black text-white/90 tracking-widest mt-1"
              >
                {clanTag}
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#F5C542] text-[#05070B] text-[9px] font-black">
                <Crown className="w-2.5 h-2.5" />
                <span>FUT</span>
              </span>
            </div>

            {/* FUT Shield Portrait */}
            <div className="relative shrink-0">
              <img
                src={gamer.avatarUrl}
                alt={gamer.displayNameFa}
                referrerPolicy="no-referrer"
                className="w-16 h-[72px] fc27-fut-shield object-cover ring-2 ring-[#F5C542] shadow-[0_0_20px_rgba(245,197,66,0.35)]"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#CCFF00] ring-2 ring-[#070B10]"
              />
            </div>

            {/* Identity & Season Ribbon */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div>
                <span
                  dir="ltr"
                  data-testid="profile-modal-handle"
                  className="font-mono-tabular text-sm font-black text-[#F5C542] block truncate"
                >
                  @{gamer.handle.toUpperCase()}
                </span>
                <p className="text-xs font-extrabold text-white mt-0.5 truncate">
                  {gamer.displayNameFa}
                </p>
              </div>

              <div className="inline-flex items-center gap-1 px-2 py-0.5 fc27-chamfer-sm bg-[#F5C542]/20 border border-[#F5C542]/60 text-[#F5C542] text-[10px] font-black">
                <Crown className="w-3 h-3 text-[#F5C542]" />
                <span data-testid="profile-season-badge">{seasonBadgeFa}</span>
              </div>
            </div>
          </div>

          {/* 2. FUT 3-Column Attribute Bar: برد | باخت | قهرمانی */}
          <div
            data-testid="profile-stats-grid"
            className="grid grid-cols-3 divide-x divide-x-reverse divide-[#F5C542]/25 bg-[#080B10]/85 border border-[#F5C542]/30 py-2"
          >
            <div className="text-center px-1">
              <span className="text-[10px] font-extrabold text-white/65 block">برد</span>
              <span
                data-testid="profile-stat-wins"
                className="text-base font-black text-[#CCFF00] mt-0.5 block"
              >
                {toPersianDigits(winsCount)}
              </span>
            </div>

            <div className="text-center px-1">
              <span className="text-[10px] font-extrabold text-white/65 block">باخت</span>
              <span
                data-testid="profile-stat-losses"
                className="text-base font-black text-[#FF2E54] mt-0.5 block"
              >
                {toPersianDigits(lossesCount)}
              </span>
            </div>

            <div className="text-center px-1">
              <span className="text-[10px] font-extrabold text-[#F5C542] flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-[#F5C542]" />
                <span>قهرمانی</span>
              </span>
              <span
                data-testid="profile-stat-championships"
                className="text-base font-black text-[#F5C542] mt-0.5 block"
              >
                {toPersianDigits(championshipsCount)}
              </span>
            </div>
          </div>

          {/* Interactive افزودن دوست / ارسال شد ✓ + REP Badge */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              data-testid="modal-profile-friend-btn"
              onClick={() => onToggleFriend(gamer.id)}
              className={`flex-1 min-h-[34px] px-3 py-1 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                gamer.isFriend
                  ? 'fc27-chamfer-sm bg-[#CCFF00]/20 border border-[#CCFF00]/75 text-[#CCFF00]'
                  : 'fc27-btn-volt'
              }`}
            >
              {gamer.isFriend ? (
                <span>ارسال شد ✓</span>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-[#05070B]" />
                  <span>افزودن دوست</span>
                </>
              )}
            </button>

            <div className="px-3 min-h-[34px] fc27-chamfer-sm bg-[#090D14]/90 border border-[#F5C542]/45 text-[#F5C542] text-xs font-black flex items-center gap-1 shrink-0">
              <Flame className="w-3.5 h-3.5 text-[#F5C542]" />
              <span>{toPersianDigits(gamer.repScore.toLocaleString())} REP</span>
            </div>
          </div>
        </section>

        {/* 3. FC 27 Club Card (کلوپ هواداران) */}
        <section
          data-testid="profile-fan-club-card"
          className="fc27-card-volt p-3 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-black text-[#CCFF00] tracking-wider block">
                کلوپ هواداران
              </span>
              <h4
                data-testid="fan-club-title"
                className="text-sm font-black text-white mt-0.5 truncate"
              >
                {fanClubTitleFa}
              </h4>
            </div>

            {/* Overlapping Mini Avatars + Active Member Count */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {allGamers.slice(0, 3).map((g) => (
                  <img
                    key={g.id}
                    src={g.avatarUrl}
                    alt={g.handle}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 fc27-fut-shield object-cover ring-1 ring-[#CCFF00]/60"
                  />
                ))}
              </div>
              <span
                data-testid="fan-club-members-count"
                className="text-[11px] font-black text-[#F5C542]"
              >
                {toPersianDigits(fanClubMembersCount.toLocaleString())} عضو فعال
              </span>
            </div>
          </div>

          <button
            type="button"
            data-testid="enter-fan-club-btn"
            onClick={() => setIsFanClubDrawerOpen((v) => !v)}
            className="w-full min-h-[36px] fc27-btn-volt text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#05070B]" />
            <span>
              {isFanClubDrawerOpen
                ? 'بستن فید کلوپ طرفداران'
                : 'ورود به کلوپ طرفداران'}
            </span>
          </button>

          {/* Dedicated Fan Club Feed / Chat Drawer */}
          {isFanClubDrawerOpen && (
            <div
              data-testid="fan-club-drawer"
              className="pt-2 border-t border-white/12 space-y-2"
            >
              <div className="max-h-28 overflow-y-auto no-scrollbar space-y-1.5">
                {fanClubPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-[#070A10]/90 border border-white/12 border-r-2 border-r-[#CCFF00] p-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        dir="ltr"
                        className="font-mono-tabular font-black text-[#CCFF00]"
                      >
                        @{post.authorHandle.toUpperCase()}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono-tabular text-white/45"
                      >
                        {post.timestamp}
                      </span>
                    </div>
                    <p className="text-white/90 mt-0.5 leading-snug">
                      {post.text}
                    </p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleFanClubSubmit}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  dir="rtl"
                  data-testid="fan-club-chat-input"
                  value={fanClubInput}
                  onChange={(e) => setFanClubInput(e.target.value)}
                  placeholder="پیام حمایت در کلوپ طرفداران..."
                  className="flex-1 min-w-0 bg-[#070B11] border border-white/15 fc27-chamfer-sm px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#CCFF00]"
                />
                <button
                  type="submit"
                  data-testid="fan-club-chat-send-btn"
                  className="px-3 py-1.5 fc27-btn-volt text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3 h-3 text-[#05070B]" />
                  <span>ارسال</span>
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Footer Quick Action: Direct Chat */}
        <button
          type="button"
          data-testid="modal-profile-chat-btn"
          onClick={() => onOpenDirectChat(gamer.id)}
          className="w-full min-h-[38px] fc27-btn-dark text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#CCFF00]" />
          <span>چت خصوصی با بازیکن</span>
        </button>
      </div>
    </div>
  );
};

export default PlayerProfileModal;

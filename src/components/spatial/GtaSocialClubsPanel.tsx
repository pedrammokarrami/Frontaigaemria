import React, { useState } from 'react';
import { Check, Crown, MapPin, Plus, Send, Shield, Users, X } from 'lucide-react';
import type { GtaClub } from '../../utils/gtaSocialRules';

interface GtaSocialClubsPanelProps {
  clubs: GtaClub[];
  userCrewTag: string;
  onToggleClubJoin: (clubId: string) => void;
  onCreateClub: (input: {
    name: string;
    tag: string;
    districtFa?: string;
    mottoFa?: string;
    gameFocus?: string;
  }) => void;
  onPostClubAnnouncement: (clubId: string, text: string) => void;
  onOpenProfileByHandle: (handle: string) => void;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export const GtaSocialClubsPanel: React.FC<GtaSocialClubsPanelProps> = ({
  clubs,
  userCrewTag,
  onToggleClubJoin,
  onCreateClub,
  onPostClubAnnouncement,
  onOpenProfileByHandle,
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id ?? '');
  const [announcementDraft, setAnnouncementDraft] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Create Club Form State
  const [clubName, setClubName] = useState<string>('');
  const [clubTag, setClubTag] = useState<string>('');
  const [clubDistrict, setClubDistrict] = useState<string>('بلوار اوشن درایو · وایس‌سیتی');
  const [clubMotto, setClubMotto] = useState<string>('');
  const [clubGameFocus, setClubGameFocus] = useState<string>('GTA VI · FC 27 · CS2');
  const [createError, setCreateError] = useState<string | null>(null);

  const activeClub = clubs.find((c) => c.id === selectedClubId) ?? clubs[0] ?? null;

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const cleanedName = clubName.trim();
    const cleanedTag = clubTag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanedName.length < 3) {
      setCreateError('نام کلاب باید حداقل ۳ کاراکتر باشد.');
      return;
    }
    if (cleanedTag.length < 2 || cleanedTag.length > 4) {
      setCreateError('تگ کلاب باید بین ۲ تا ۴ حرف انگلیسی (مثلاً VICE) باشد.');
      return;
    }

    onCreateClub({
      name: cleanedName,
      tag: cleanedTag,
      districtFa: clubDistrict,
      mottoFa: clubMotto,
      gameFocus: clubGameFocus,
    });
    setClubName('');
    setClubTag('');
    setClubMotto('');
    setIsCreateOpen(false);
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClub || !announcementDraft.trim()) return;
    onPostClubAnnouncement(activeClub.id, announcementDraft);
    setAnnouncementDraft('');
  };

  return (
    <div data-testid="gta-panel-clubs" className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl border border-white/12 bg-[#130E1D]/90 overflow-hidden">
        <div className="relative h-40 sm:h-48 overflow-hidden bg-[#0B0814]">
          <img
            src="/src/assets/images/gta6_club_penthouse_hq_1795183788895.jpg"
            alt="مقر کلاب‌های وایس‌سیتی در پنت‌هاوس استارفیش"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#130E1D] via-[#130E1D]/55 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-[#FF944D]">
                کلاب فعال شما: <span dir="ltr" className="font-mono-tabular">[{userCrewTag}]</span> · {faNum(clubs.length)} کلاب ثبت‌شده در وایس‌سیتی
              </p>
              <h2 className="text-[22px] font-bold text-white mt-0.5">
                کلاب‌ها و سندیکاهای GTA VI
              </h2>
            </div>

            <button
              type="button"
              data-testid="open-create-club-btn"
              onClick={() => setIsCreateOpen((v) => !v)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>ساخت کلاب جدید</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Create Club Drawer */}
      {isCreateOpen && (
        <form
          data-testid="create-club-form"
          onSubmit={handleSubmitCreate}
          className="rounded-xl border border-[#FF3B8B]/40 bg-[#150E21]/95 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-white">تأسیس کلاب جدید در وایس‌سیتی</h3>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              aria-label="بستن فرم ساخت کلاب"
              className="w-8 h-8 rounded-lg hover:bg-white/10 text-[#C5B9D6] hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="club-name-input" className="block text-[12px] font-medium text-[#D6CBE6] mb-1.5">
                نام کلاب
              </label>
              <input
                id="club-name-input"
                data-testid="club-name-input"
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="مثلاً Vice Midnight Riders"
                className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white placeholder:text-[#8E7FA6] focus:outline-none focus:border-[#FF3B8B]"
              />
            </div>

            <div>
              <label htmlFor="club-tag-input" className="block text-[12px] font-medium text-[#D6CBE6] mb-1.5">
                تگ کلاب (۲ تا ۴ حرف انگلیسی)
              </label>
              <input
                id="club-tag-input"
                data-testid="club-tag-input"
                type="text"
                dir="ltr"
                maxLength={4}
                value={clubTag}
                onChange={(e) => setClubTag(e.target.value.toUpperCase())}
                placeholder="VMR"
                className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] font-mono-tabular uppercase text-white placeholder:text-[#8E7FA6] focus:outline-none focus:border-[#FF3B8B]"
              />
            </div>

            <div>
              <label htmlFor="club-district-input" className="block text-[12px] font-medium text-[#D6CBE6] mb-1.5">
                منطقه قلمرو در وایس‌سیتی
              </label>
              <input
                id="club-district-input"
                type="text"
                value={clubDistrict}
                onChange={(e) => setClubDistrict(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white focus:outline-none focus:border-[#FF3B8B]"
              />
            </div>

            <div>
              <label htmlFor="club-game-input" className="block text-[12px] font-medium text-[#D6CBE6] mb-1.5">
                تمرکز بازی‌ها
              </label>
              <input
                id="club-game-input"
                type="text"
                value={clubGameFocus}
                onChange={(e) => setClubGameFocus(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white focus:outline-none focus:border-[#FF3B8B]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="club-motto-input" className="block text-[12px] font-medium text-[#D6CBE6] mb-1.5">
              شعار کلاب
            </label>
            <input
              id="club-motto-input"
              data-testid="club-motto-input"
              type="text"
              value={clubMotto}
              onChange={(e) => setClubMotto(e.target.value)}
              placeholder="قوانین و سبک کلاب خود را بنویسید..."
              className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white placeholder:text-[#8E7FA6] focus:outline-none focus:border-[#FF3B8B]"
            />
          </div>

          {createError && (
            <p className="text-[12.5px] text-rose-300">{createError}</p>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="submit"
              data-testid="submit-create-club-btn"
              className="h-10 px-5 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer"
            >
              ثبت و تأسیس کلاب
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="h-10 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[#D6CBE6] text-[13px] font-medium transition cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {/* Clubs Directory Cards */}
      <div className="space-y-4">
        {clubs.map((club) => {
          const isSelected = activeClub?.id === club.id;
          return (
            <article
              key={club.id}
              data-testid={`club-card-${club.id}`}
              data-club-joined={club.isJoined ? 'true' : 'false'}
              className={`rounded-xl border overflow-hidden transition ${
                isSelected
                  ? 'border-[#FF3B8B]/55 bg-[#161024]/95'
                  : 'border-white/12 bg-[#130E1D]/88 hover:border-white/25'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Club Visual Banner */}
                <div className="md:col-span-4 relative min-h-[150px] bg-[#0B0814]">
                  <img
                    src={club.bannerUrl}
                    alt={club.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                  />
                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[12px] text-white">
                    <span dir="ltr" className="font-mono-tabular font-bold text-[#FF944D]">
                      RANK #{faNum(club.turfRank)}
                    </span>
                    <span dir="ltr" className="font-mono-tabular font-bold text-[#38E8FF]">
                      [{club.tag}]
                    </span>
                  </div>
                </div>

                {/* Club Info & Actions */}
                <div className="md:col-span-8 p-4 sm:p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[17px] font-bold text-white flex items-center gap-2">
                          <Shield className="w-4 h-4 shrink-0" style={{ color: club.accentHex }} />
                          <span>{club.name}</span>
                        </h3>
                        <p className="text-[12px] text-[#B8ABC9] mt-1 flex flex-wrap items-center gap-x-2">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#FF944D]" />
                            {club.districtFa}
                          </span>
                          <span>·</span>
                          <span dir="ltr" className="font-mono-tabular">
                            {club.gameFocus}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        data-testid={`club-join-btn-${club.id}`}
                        onClick={() => onToggleClubJoin(club.id)}
                        className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          club.isJoined
                            ? 'border border-[#38E8FF]/55 bg-[#38E8FF]/15 text-[#9EF5FF] hover:bg-[#38E8FF]/22'
                            : 'bg-[#FF3B8B] hover:brightness-110 text-white'
                        }`}
                      >
                        {club.isJoined ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>عضو کلاب هستید</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>عضویت در کلاب</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[13.5px] text-[#E6DCF2] leading-relaxed">
                      {club.mottoFa}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-[12.5px] text-[#C5B9D6]">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Users className="w-3.5 h-3.5 text-[#38E8FF]" />
                        {faNum(club.membersCount)} عضو
                      </span>
                      <span className="font-mono-tabular tabular-nums text-[#FF944D]">
                        {faNum(club.repTotal.toLocaleString())} REP
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenProfileByHandle(club.bossHandle)}
                        className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5 text-[#FF944D]" />
                        <span>لیدر:</span>
                        <span dir="ltr" className="font-mono-tabular text-white">
                          @{club.bossHandle}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedClubId(club.id)}
                      className="text-[12.5px] font-semibold text-[#FF8EC2] hover:text-white transition cursor-pointer whitespace-nowrap"
                    >
                      {isSelected ? 'دیوار کلاب باز است' : 'مشاهده دیوار کلاب'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Club Wall Announcements */}
              {isSelected && (
                <div className="px-4 sm:px-5 py-4 bg-[#0D0916]/90 border-t border-white/10 space-y-3.5">
                  <h4 className="text-[13.5px] font-bold text-white">
                    دیوار اطلاعیه‌های کلاب {club.name}
                  </h4>

                  <div className="space-y-2.5">
                    {club.announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-white/8 last:border-b-0 last:pb-0 text-[13px]"
                      >
                        <p className="text-[#EDE6F7] leading-relaxed">
                          <span dir="ltr" className="font-mono-tabular font-bold text-[#FF944D] ml-2">
                            @{ann.authorHandle}
                          </span>
                          {ann.text}
                        </p>
                        <span dir="ltr" className="font-mono-tabular text-[11.5px] text-[#9E90B5] shrink-0">
                          {ann.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handlePostAnnouncement} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      dir="rtl"
                      data-testid={`club-wall-input-${club.id}`}
                      value={announcementDraft}
                      onChange={(e) => setAnnouncementDraft(e.target.value)}
                      placeholder="اطلاعیه یا پیام جدید روی دیوار کلاب بنویسید..."
                      aria-label="پیام جدید روی دیوار کلاب"
                      className="flex-1 min-w-0 h-10 px-3.5 rounded-lg border border-white/15 bg-[#171124] text-[13px] text-white placeholder:text-[#9E90B5] focus:outline-none focus:border-[#FF3B8B]"
                    />
                    <button
                      type="submit"
                      data-testid={`club-wall-submit-${club.id}`}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ثبت در دیوار</span>
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

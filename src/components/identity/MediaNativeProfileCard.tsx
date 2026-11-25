import React from 'react';
import { Award, Disc3, Film, Headphones, Sparkles, Tv } from 'lucide-react';
import type { IconicMediaCharacter, MediaHubKind } from '../../data/iconicMediaCharacters';
import type { MediaProfileThemeConfig } from './mediaProfileThemes';
import { HOLOGRAM_PLATE_URLS } from './hologramPlateAssets';

interface MediaNativeProfileCardProps {
  hub: MediaHubKind;
  theme: MediaProfileThemeConfig;
  displayName: string;
  userAge: number;
  userGender: 'male' | 'female';
  matchedCharacter: IconicMediaCharacter;
  similarityPct: number;
  userTraitsFa: string[];
  linkedCount: number;
  roomSubtitleFa: string;
  metricPrimaryLabel: string;
  metricPrimaryValue: string;
  metricSecondaryLabel: string;
  metricSecondaryValue: string;
}

export const MediaNativeProfileCard: React.FC<MediaNativeProfileCardProps> = ({
  hub,
  theme,
  displayName,
  userAge,
  userGender,
  matchedCharacter,
  similarityPct,
  userTraitsFa,
  linkedCount,
  roomSubtitleFa,
  metricPrimaryLabel,
  metricPrimaryValue,
  metricSecondaryLabel,
  metricSecondaryValue,
}) => {
  const plateUrl = HOLOGRAM_PLATE_URLS[matchedCharacter.plateKey];
  const mergedTraits = Array.from(
    new Set([...userTraitsFa, ...matchedCharacter.traitsFa])
  ).slice(0, 4);

  const genderLabelFa = userGender === 'female' ? 'کاراکتر زن' : 'کاراکتر مرد';

  return (
    <section
      data-testid="media-native-profile-card"
      data-media-theme={theme.key}
      dir="rtl"
      aria-label={
        hub === 'cinema'
          ? 'کارت پروفایل تخصصی سینما و تلویزیون'
          : 'کارت پروفایل تخصصی موزیک و پادکست'
      }
      className={`relative w-full transition-colors duration-300 ${theme.outerClass}`}
    >
      {/* Top Room Dossier Banner */}
      <div className={`px-5 py-3.5 flex items-center justify-between gap-3 ${theme.headerBgClass}`}>
        <div className="flex items-center gap-2 min-w-0">
          {hub === 'cinema' ? (
            <Film className="w-4 h-4 shrink-0" style={{ color: theme.accentHex }} />
          ) : (
            <Headphones className="w-4 h-4 shrink-0" style={{ color: theme.accentHex }} />
          )}
          <div className="min-w-0">
            <p className={`text-[10.5px] font-extrabold tracking-[0.14em] uppercase truncate ${theme.titleColorClass}`}>
              {theme.badgeLabel}
            </p>
            <p className={`text-[11.5px] font-bold truncate ${theme.subtitleColorClass}`}>
              {theme.shortLabel} · {roomSubtitleFa}
            </p>
          </div>
        </div>

        <span
          dir="ltr"
          data-testid="media-character-similarity"
          className="px-2.5 py-1 rounded-lg font-mono-tabular text-[11.5px] font-black shrink-0"
          style={{
            backgroundColor: `${theme.accentHex}24`,
            color: theme.accentHex,
            border: `1px solid ${theme.accentHex}55`,
          }}
        >
          {similarityPct}% FIT
        </span>
      </div>

      {/* Main Character & Identity Body */}
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          {/* Hologram Plate Thumbnail */}
          <div
            className="relative w-24 h-28 rounded-2xl overflow-hidden shrink-0 border-2 bg-[#060912]"
            style={{ borderColor: `${theme.accentHex}75` }}
          >
            <img
              src={plateUrl}
              alt={matchedCharacter.nameEn}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <span
              dir="ltr"
              className="absolute bottom-1 right-1 left-1 text-center py-0.5 rounded bg-black/75 font-mono-tabular text-[9.5px] font-bold text-white truncate px-1"
            >
              {matchedCharacter.badgeCode}
            </span>
          </div>

          {/* Identity Meta */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                data-testid="media-profile-display-name"
                className="text-[18px] font-black text-white truncate"
              >
                {displayName}
              </h2>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-white/10 text-white/90"
              >
                {genderLabelFa} · {userAge} سال
              </span>
            </div>

            <p
              data-testid="media-matched-legend-name"
              className="text-[13.5px] font-extrabold truncate"
              style={{ color: theme.accentHex }}
            >
              {matchedCharacter.nameFa} ({matchedCharacter.nameEn})
            </p>
            <p className="text-[11.5px] text-slate-300 truncate">
              {matchedCharacter.franchise} · {matchedCharacter.archetypeFa}
            </p>

            <p className="text-[12px] text-white/85 leading-relaxed pt-1 border-t border-white/10">
              «{matchedCharacter.quoteFa}»
            </p>
          </div>
        </div>

        {/* Matched Trait Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {mergedTraits.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/6 border border-white/12 text-slate-100"
            >
              <Sparkles className="w-3 h-3 shrink-0" style={{ color: theme.accentHex }} />
              <span>{trait}</span>
            </span>
          ))}
        </div>

        {/* 3-Column Domain Telemetry Ledger */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-xl bg-black/35 border border-white/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10.5px] text-slate-400">
              {hub === 'cinema' ? <Tv className="w-3 h-3" /> : <Disc3 className="w-3 h-3" />}
              <span>{metricPrimaryLabel}</span>
            </div>
            <p
              dir="ltr"
              className="font-mono-tabular text-[13.5px] font-black text-white mt-1 truncate"
            >
              {metricPrimaryValue}
            </p>
          </div>

          <div className="rounded-xl bg-black/35 border border-white/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10.5px] text-slate-400">
              <Award className="w-3 h-3" />
              <span>{metricSecondaryLabel}</span>
            </div>
            <p
              dir="ltr"
              className="font-mono-tabular text-[13.5px] font-black mt-1 truncate"
              style={{ color: theme.accentHex }}
            >
              {metricSecondaryValue}
            </p>
          </div>

          <div className="rounded-xl bg-black/35 border border-white/10 p-2.5 text-center">
            <span className="text-[10.5px] text-slate-400 block">اکانت متصل</span>
            <p className="font-mono-tabular text-[13.5px] font-black text-emerald-300 mt-1">
              {linkedCount} شبکه
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  GAMEPAD_BUTTONS,
  GAMEPAD_PLATFORMS,
  activeGamepadButtons,
  type GamepadDeviceId,
} from '../../data/gamepadDevices';

/**
 * Bottom-of-page controller button tutorial dock — themed after the user's
 * Petros-gamepad repo (آسترو ترینر سه‌بعدی): per-platform grouped button
 * reference with the buttons used by the current coach combo highlighted.
 * Language follows the app UI (zero-Persian-in-English mandate).
 */
export const GamepadTutorialDock: React.FC<{
  comboTokens: string[];
  accentHex: string;
}> = ({ comboTokens, accentHex }) => {
  const { languageCode } = useLanguage();
  const isFa = languageCode.toLowerCase().startsWith('fa');
  const [deviceId, setDeviceId] = useState<GamepadDeviceId>('ps5');

  const platform = GAMEPAD_PLATFORMS.find((p) => p.id === deviceId) ?? GAMEPAD_PLATFORMS[0];
  const buttons = GAMEPAD_BUTTONS[deviceId];
  const activeIds = useMemo(() => activeGamepadButtons(comboTokens), [comboTokens]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof buttons>();
    for (const btn of buttons) {
      const key = isFa ? btn.groupFa : btn.groupEn;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(btn);
    }
    return [...map.entries()];
  }, [buttons, isFa]);

  return (
    <section
      data-testid="gamepad-tutorial-dock"
      className="rounded-2xl bg-slate-950/60 border border-white/15 px-3 py-2.5 flex flex-col gap-2"
      style={{ boxShadow: `inset 0 0 22px ${platform.accentHex}14` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-black text-white flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: platform.accentHex, boxShadow: `0 0 8px ${platform.accentHex}` }}
            aria-hidden="true"
          />
          <span className="truncate">
            {isFa ? `آموزش دکمه‌های دسته — ${platform.subtitleFa}` : `Controller button guide — ${platform.subtitleEn}`}
          </span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {GAMEPAD_PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              data-testid={`gamepad-platform-${p.id}`}
              onClick={() => setDeviceId(p.id)}
              className="px-2 py-0.5 rounded-full text-[10.5px] font-black transition cursor-pointer"
              style={{
                backgroundColor: p.id === deviceId ? `${p.accentHex}30` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${p.id === deviceId ? p.accentHex : 'rgba(255,255,255,0.18)'}`,
                color: p.id === deviceId ? '#FFFFFF' : '#CBD5E1',
              }}
            >
              {p.brandName}
            </button>
          ))}
        </div>
      </div>

      {activeIds.size > 0 && (
        <p className="text-[10.5px] font-bold" style={{ color: accentHex }}>
          {isFa ? '★ دکمه‌های کمبوی فعلی' : '★ Buttons in your current combo'}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {groups.map(([group, groupButtons]) => (
          <div key={group} className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-black text-white/45 w-[86px] shrink-0 truncate">{group}</span>
            {groupButtons.map((btn) => {
              const active = activeIds.has(btn.id);
              return (
                <span
                  key={btn.id}
                  data-testid={`gamepad-btn-${btn.id}`}
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
                  style={{
                    backgroundColor: active ? `${accentHex}26` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? accentHex : 'rgba(255,255,255,0.12)'}`,
                    color: active ? '#FFFFFF' : '#94A3B8',
                    boxShadow: active ? `0 0 10px ${accentHex}40` : 'none',
                  }}
                >
                  {isFa ? btn.labelFa : btn.labelEn}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};

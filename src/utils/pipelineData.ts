import React, { useEffect, useState } from 'react';

/**
 * Frontend access to the pipeline content bundle:
 *  - canonical English core:  /data/api-data.json
 *  - cached locale bundles:   /data/i18n/api-data.<lang>.json
 *    (built by pipeline/translator_agent.py; served statically, zero CPU at
 *    request time). Falls back to the English core if a locale file is missing.
 */

export interface PipelineCard {
  id: string;
  category: string;
  source_tag: string;
  title: string;
  summary: string;
  language: string;
  url?: string;
}
export interface PipelineCoachSession {
  title: string;
  ovr: number;
  metrics: Record<string, number>;
  suggested_questions: string[];
  tactical_tips: string[];
}
export interface PipelineFormationBoard {
  team: string;
  formation: string;
  style: string;
  description: string;
  players: Array<{ name: string; number: number; role?: string; x: number; y: number }>;
  tactical_arrows: Array<Record<string, unknown>>;
}
export interface PipelineControllerCombos {
  game: string;
  drill_name: string;
  duration_ms: number;
  platforms: string[];
  timeline_inputs: Array<{ t_ms: number; buttons: string[]; note?: string }>;
}
export interface PipelineBundle {
  generated_at?: string;
  language?: string;
  rtl?: boolean;
  translation?: string;
  games: Record<
    string,
    {
      cards: PipelineCard[];
      coach_session: PipelineCoachSession;
      formation_board: PipelineFormationBoard;
      controller_combos: PipelineControllerCombos;
    }
  >;
}

const cache = new Map<string, PipelineBundle>();

export async function loadPipelineBundle(lang = 'en'): Promise<PipelineBundle | null> {
  const key = lang.toLowerCase().slice(0, 2);
  const hit = cache.get(key);
  if (hit) return hit;
  const url = key === 'en' ? '/data/api-data.json' : `/data/i18n/api-data.${key}.json`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as PipelineBundle;
    cache.set(key, json);
    return json;
  } catch {
    if (key !== 'en') return loadPipelineBundle('en'); // graceful fallback to core
    return null;
  }
}

/** React hook for any UI section driven by the pipeline bundle. */
export function usePipelineBundle(lang = 'en'): PipelineBundle | null {
  const [bundle, setBundle] = useState<PipelineBundle | null>(null);
  useEffect(() => {
    let alive = true;
    loadPipelineBundle(lang).then((b) => {
      if (alive) setBundle(b);
    });
    return () => {
      alive = false;
    };
  }, [lang]);
  return bundle;
}

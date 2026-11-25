/**
 * AIPETROS Cinematic Media & 3D Asset Configuration
 * ---------------------------------------------------------------------------
 * Place your looping Blender lobby render at `public/media/lobby-bg.mp4`
 * and your 3D athlete model at `public/media/avatar.glb`.
 * The runtime checks `/api/media/manifest` and activates them automatically
 * whenever present, falling back cleanly to photorealistic key-art otherwise.
 */

export interface MediaAssetSlot {
  /** Path to looping .mp4 / .webm Blender render (e.g. /media/lobby-bg.mp4) */
  videoUrl: string | null;
  /** Photorealistic dark fallback / poster image */
  posterUrl: string;
  /** Path to custom .glb 3D character model (e.g. /media/avatar.glb) */
  glbModelUrl?: string | null;
  alt: string;
}

export const MEDIA_ASSETS = {
  lobbyHero: {
    videoUrl: '/media/lobby-bg.mp4',
    posterUrl: '/src/assets/images/hero_lobby_character_1794943634489.jpg',
    glbModelUrl: '/media/avatar.glb',
    alt: 'Tactical esports athlete standing in dark stadium tunnel hangar',
  } satisfies MediaAssetSlot,

  coachHangarBackdrop: {
    videoUrl: null,
    posterUrl: '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
    alt: 'Dark tactical briefing hangar with volumetric overhead light',
  } satisfies MediaAssetSlot,

  playerAvatar: '/src/assets/images/athlete_avatar_1794943635940.jpg',
  clubCrest: '/src/assets/images/club_crest_lvfc_1794943635823.jpg',
  sampleMatchCapture: '/src/assets/images/sample_eafc_scoreboard_1794941278189.jpg',
} as const;

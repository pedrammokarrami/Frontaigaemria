import type { HologramPlateKey } from '../../data/iconicGameCharacters';

/**
 * Client-only registry mapping each iconic archetype plateKey to its local
 * Unreal Engine 5.8 photorealistic holographic portrait asset served from /src/assets/images.
 */
export const HOLOGRAM_PLATE_URLS: Record<HologramPlateKey, string> = {
  boy_prodigy: '/src/assets/images/holo_boy_prodigy_1795172646040.jpg',
  girl_prodigy: '/src/assets/images/holo_girl_prodigy_1795172645438.jpg',
  male_prime: '/src/assets/images/holo_male_prime_1795172645988.jpg',
  female_prime: '/src/assets/images/holo_female_prime_1795172675312.jpg',
  male_outlaw: '/src/assets/images/holo_male_outlaw_1795172645500.jpg',
  female_commander: '/src/assets/images/holo_female_commander_1795172646701.jpg',
  male_elder: '/src/assets/images/holo_male_elder_1795172645312.jpg',
  female_elder: '/src/assets/images/holo_female_elder_1795172646769.jpg',
  arthur_gunslinger: '/src/assets/images/holo_arthur_gunslinger_1795172673423.jpg',
  max_noir: '/src/assets/images/holo_max_noir_1795172673547.jpg',
  geralt_warrior: '/src/assets/images/holo_geralt_warrior_1795172673666.jpg',
  female_cyber: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
};

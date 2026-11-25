/**
 * Typed re-export of motion's frameloop internals (also exported publicly by
 * motion/react): the render-step pipeline used to drive the frameloop
 * manually when native rAF is frozen (see utils/rafFallback.ts).
 * Imported from motion/react — the same package the app already bundles —
 * so the frameSteps/frameData singletons are guaranteed to be shared.
 */
export { frameData, frameSteps } from 'motion/react';

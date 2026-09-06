/**
 * Ryokai — Shared Avatar Utilities
 *
 * Deterministic hue hashing and flat avatar color generation.
 * Used by both the Crew and Directory modules for member avatars.
 */

/**
 * Hash a string to a hue value (0–359) for consistent avatar coloring.
 * The same input always produces the same hue.
 */
export function hashHue(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/**
 * Generate a flat HSL avatar color from a name/email string.
 * Returns a muted, accessible tone suitable for avatar backgrounds with white text.
 */
export function avatarColor(str = '') {
  return `hsl(${hashHue(str)} 42% 45%)`;
}

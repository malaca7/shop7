import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gera um UUID v4 no padrão RFC4122 compatível com o PostgreSQL (Supabase).
 * Se fornecida uma semente (como e-mail ou google sub), gera um UUID determinístico idêntico.
 */
export function generateValidUuid(seed?: string): string {
  if (seed) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < seed.length; i++) {
      const ch = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
    const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
    const hex3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
    const hex4 = ((h1 + h2) >>> 0).toString(16).padStart(8, "0");
    const raw32 = (hex1 + hex2 + hex3 + hex4).slice(0, 32);

    return `${raw32.slice(0, 8)}-${raw32.slice(8, 12)}-4${raw32.slice(13, 16)}-8${raw32.slice(17, 20)}-${raw32.slice(20, 32)}`;
  }

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

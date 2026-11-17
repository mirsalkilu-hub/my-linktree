export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "threads", label: "Threads" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "snapchat", label: "Snapchat" },
  { id: "pinterest", label: "Pinterest" },
  { id: "reddit", label: "Reddit" },
  { id: "twitch", label: "Twitch" },
  { id: "discord", label: "Discord" },
  { id: "spotify", label: "Spotify" },
  { id: "github", label: "GitHub" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["id"];

export interface BioSocialLink {
  platform: SocialPlatform;
  url: string;
}

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return (
    typeof value === "string" &&
    SOCIAL_PLATFORMS.some((platform) => platform.id === value)
  );
}

export function normalizeSocialLinks(value: unknown): BioSocialLink[] {
  if (!Array.isArray(value)) return [];

  const candidates: unknown[] = value;
  const socialLinks: BioSocialLink[] = [];

  for (const candidate of candidates) {
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      !("platform" in candidate) ||
      !("url" in candidate)
    ) {
      continue;
    }

    const platform = candidate.platform;
    const url = candidate.url;
    if (!isSocialPlatform(platform) || typeof url !== "string") {
      continue;
    }

    try {
      const parsedUrl = new URL(url);
      if (
        (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") &&
        parsedUrl.hostname
      ) {
        socialLinks.push({
          platform,
          url: parsedUrl.toString(),
        });
      }
    } catch {
      continue;
    }
  }

  return socialLinks;
}

import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaReddit,
  FaSnapchat,
  FaSpotify,
  FaTelegram,
  FaThreads,
  FaTiktok,
  FaTwitch,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { SocialPlatform } from "@/lib/social-platforms";

const SOCIAL_ICONS: Record<SocialPlatform, IconType> = {
  instagram: FaInstagram,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  facebook: FaFacebook,
  x: FaXTwitter,
  threads: FaThreads,
  linkedin: FaLinkedin,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  snapchat: FaSnapchat,
  pinterest: FaPinterest,
  reddit: FaReddit,
  twitch: FaTwitch,
  discord: FaDiscord,
  spotify: FaSpotify,
  github: FaGithub,
};

export default function SocialIcon({
  platform,
  className = "h-5 w-5",
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const Icon = SOCIAL_ICONS[platform];
  return <Icon aria-hidden="true" className={className} />;
}

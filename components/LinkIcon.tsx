import {
  FaLink,
  FaWhatsapp,
  FaInstagram,
  FaYoutube,
  FaGoogleDrive,
  FaGlobe,
  FaEnvelope,
  FaTiktok,
  FaDropbox,
} from "react-icons/fa6";

interface LinkIconProps {
  type?: string;
  className?: string;
}

export default function LinkIcon({ type, className = "w-5 h-5" }: LinkIconProps) {
  switch (type) {
    case "whatsapp":
      return <FaWhatsapp className={`${className} text-emerald-500`} />;
    case "instagram":
      return <FaInstagram className={`${className} text-pink-500`} />;
    case "youtube":
      return <FaYoutube className={`${className} text-red-500`} />;
    case "drive":
      return <FaGoogleDrive className={`${className} text-amber-500`} />;
    case "dropbox":
      return <FaDropbox className={`${className} text-blue-500`} />;
    case "globe":
      return <FaGlobe className={`${className} text-blue-400`} />;
    case "email":
      return <FaEnvelope className={`${className} text-indigo-400`} />;
    case "tiktok":
      return <FaTiktok className={`${className} text-slate-100`} />;
    default:
      return <FaLink className={`${className} text-slate-400`} />;
  }
}
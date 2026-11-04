export type BioTemplateLayout =
  | "classic"
  | "creator"
  | "business"
  | "music"
  | "shop"
  | "editorial"
  | "streamer"
  | "education"
  | "nonprofit";

export interface BioTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  accent: string;
  background: string;
  cardBackground: string;
  layout: BioTemplateLayout;
  isLight?: boolean;
}

export const BIO_TEMPLATES: BioTemplate[] = [
  {
    id: "blank",
    name: "Blank page",
    category: "Minimal",
    description: "Start with a clean canvas and build your page from scratch.",
    accent: "#c026d3",
    background: "#070913",
    cardBackground: "linear-gradient(145deg, rgba(15, 23, 42, .94), rgba(15, 23, 42, .72))",
    layout: "classic",
    isLight: true,
  },
  {
    id: "flash-sale",
    name: "Flash Sale",
    category: "E-commerce",
    description: "A bright promotional layout for launches and special offers.",
    accent: "#ff4f8b",
    background: "radial-gradient(ellipse at top, #fff4e8 0%, #ffe1d7 55%, #ffcce3 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,255,255,.97), rgba(255,248,241,.96))",
    layout: "shop",
    isLight: true,
  },
  {
    id: "indie-tour",
    name: "Indie Tour",
    category: "Event",
    description: "A bold artist page for new releases, shows, and socials.",
    accent: "#d946ef",
    background: "radial-gradient(ellipse at top, #522063 0%, #1c1028 48%, #090812 100%)",
    cardBackground: "linear-gradient(180deg, rgba(42,19,53,.96), rgba(10,10,19,.97))",
    layout: "music",
  },
  {
    id: "sugar-atelier",
    name: "Sugar Atelier",
    category: "Restaurant",
    description: "A sweet, warm showcase for cafes, bakers, and menus.",
    accent: "#e97883",
    background: "radial-gradient(ellipse at top, #fff4ef 0%, #f8dedb 52%, #edc9d1 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,250,247,.97), rgba(255,239,236,.96))",
    layout: "shop",
    isLight: true,
  },
  {
    id: "olivia-bloom",
    name: "Olivia Bloom",
    category: "Creator",
    description: "An elegant, floral-inspired look for beauty and lifestyle.",
    accent: "#dd8f9a",
    background: "radial-gradient(ellipse at top, #fff1ed 0%, #f3d9d7 50%, #e8c9d2 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,249,246,.97), rgba(255,239,238,.96))",
    layout: "creator",
    isLight: true,
  },
  {
    id: "newsroom",
    name: "Daily Brief",
    category: "Business",
    description: "A crisp editorial layout for publications and news.",
    accent: "#ef4444",
    background: "radial-gradient(ellipse at top, #e8eef5 0%, #dce5ef 54%, #cbd9e8 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,255,255,.98), rgba(245,248,252,.97))",
    layout: "editorial",
    isLight: true,
  },
  {
    id: "learning-hub",
    name: "Learning Hub",
    category: "Education",
    description: "Organize courses, resources, and student links.",
    accent: "#38bdf8",
    background: "radial-gradient(ellipse at top, #dff4ff 0%, #dbeafe 52%, #c7d2fe 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,255,255,.98), rgba(239,248,255,.97))",
    layout: "education",
    isLight: true,
  },
  {
    id: "good-cause",
    name: "Good Cause",
    category: "Non-profit",
    description: "Share your mission, community, and ways to help.",
    accent: "#34d399",
    background: "radial-gradient(ellipse at top, #e7f8e9 0%, #d8f1e4 52%, #c5e7db 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,255,255,.98), rgba(240,252,245,.97))",
    layout: "nonprofit",
    isLight: true,
  },
  {
    id: "business",
    name: "Business Studio",
    category: "Business",
    description: "A polished, structured page for professional brands.",
    accent: "#38bdf8",
    background: "radial-gradient(ellipse at top right, #112c45 0%, #081321 45%, #070b13 100%)",
    cardBackground: "linear-gradient(145deg, rgba(12, 26, 42, .98), rgba(10, 17, 29, .96))",
    layout: "business",
  },
  {
    id: "creator",
    name: "Creator Glow",
    category: "Creator",
    description: "A bold, colorful style for creators and portfolios.",
    accent: "#f472b6",
    background: "radial-gradient(ellipse at top, #3b1234 0%, #160e24 48%, #080914 100%)",
    cardBackground: "linear-gradient(155deg, rgba(53, 24, 53, .94), rgba(17, 15, 31, .9))",
    layout: "creator",
  },
  {
    id: "matcha-studio",
    name: "Matcha Studio",
    category: "Lifestyle",
    description: "A calm, nature-inspired palette for wellness and lifestyle brands.",
    accent: "#668b68",
    background: "radial-gradient(ellipse at top, #f3f5e8 0%, #dce8d4 52%, #c4d6c1 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,255,249,.98), rgba(238,245,230,.97))",
    layout: "creator",
    isLight: true,
  },
  {
    id: "coastal-notes",
    name: "Coastal Notes",
    category: "Travel",
    description: "A breezy, ocean-inspired look for travel stories and local guides.",
    accent: "#237e91",
    background: "radial-gradient(ellipse at top, #eaf8f6 0%, #cce9e7 52%, #b4d7e2 100%)",
    cardBackground: "linear-gradient(145deg, rgba(250,255,254,.98), rgba(230,246,246,.97))",
    layout: "editorial",
    isLight: true,
  },
  {
    id: "pixel-arcade",
    name: "Pixel Arcade",
    category: "Gaming",
    description: "A high-energy neon look for gamers, streamers, and esports teams.",
    accent: "#b7f34a",
    background: "radial-gradient(ellipse at top, #26355b 0%, #10172d 48%, #080b16 100%)",
    cardBackground: "linear-gradient(155deg, rgba(27,39,68,.97), rgba(10,14,28,.98))",
    layout: "streamer",
  },
  {
    id: "velvet-noir",
    name: "Velvet Noir",
    category: "Photography",
    description: "A dramatic, gallery-like canvas for photographers and visual artists.",
    accent: "#e6b86a",
    background: "radial-gradient(ellipse at top, #34233a 0%, #17121e 50%, #0b0b11 100%)",
    cardBackground: "linear-gradient(155deg, rgba(48,34,50,.97), rgba(16,14,22,.98))",
    layout: "editorial",
  },
  {
    id: "terracotta-table",
    name: "Terracotta Table",
    category: "Restaurant",
    description: "A sun-warmed, handcrafted style for restaurants, cafes, and makers.",
    accent: "#c65f3b",
    background: "radial-gradient(ellipse at top, #fff1df 0%, #f4d8bd 52%, #e9c2a5 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,251,242,.98), rgba(250,235,216,.97))",
    layout: "shop",
    isLight: true,
  },
  {
    id: "studio-grid",
    name: "Studio Grid",
    category: "Portfolio",
    description: "A crisp, understated layout for designers and creative portfolios.",
    accent: "#a78bfa",
    background: "radial-gradient(ellipse at top right, #292744 0%, #151523 48%, #090a12 100%)",
    cardBackground: "linear-gradient(150deg, rgba(36,35,57,.97), rgba(14,15,25,.98))",
    layout: "business",
  },
  {
    id: "wildflower",
    name: "Wildflower",
    category: "Lifestyle",
    description: "Soft botanical colors for beauty, personal brands, and handmade shops.",
    accent: "#bb6d7f",
    background: "radial-gradient(ellipse at top, #fff2ec 0%, #f4dce0 50%, #e8cddd 100%)",
    cardBackground: "linear-gradient(145deg, rgba(255,250,247,.98), rgba(250,238,242,.97))",
    layout: "creator",
    isLight: true,
  },
  {
    id: "alpine-air",
    name: "Alpine Air",
    category: "Travel",
    description: "A fresh mountain-inspired theme for guides, outdoor creators, and trips.",
    accent: "#7dd3c7",
    background: "radial-gradient(ellipse at top, #21414b 0%, #10242f 50%, #09121c 100%)",
    cardBackground: "linear-gradient(150deg, rgba(25,54,62,.97), rgba(10,23,32,.98))",
    layout: "classic",
  },
];

export const BIO_TEMPLATE_CATEGORIES = [
  "All",
  "Business",
  "Creator",
  "E-commerce",
  "Education",
  "Event",
  "Gaming",
  "Lifestyle",
  "Non-profit",
  "Photography",
  "Portfolio",
  "Restaurant",
  "Travel",
] as const;

export function getBioTemplate(id: string) {
  return (
    BIO_TEMPLATES.find((template) => template.id === id) ||
    BIO_TEMPLATES[0]
  );
}

export interface AssetPreset {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
}

export const PRESET_ICONS: AssetPreset[] = [
  {
    id: "icon-bell",
    name: "Golden Bell",
    url: "/presets/icon-bell.png",
    category: "General",
    description: "Vibrant alert notification bell with amber radial glow",
  },
  {
    id: "icon-success",
    name: "Emerald Check",
    url: "/presets/icon-success.png",
    category: "Success",
    description: "Completed / verified green checkmark ring",
  },
  {
    id: "icon-alert",
    name: "Crimson Alert",
    url: "/presets/icon-alert.png",
    category: "Urgent",
    description: "High-priority warning shield and exclamation mark",
  },
  {
    id: "icon-message",
    name: "Indigo Chat",
    url: "/presets/icon-message.png",
    category: "Social",
    description: "Conversation message speech bubble with typing indicator",
  },
  {
    id: "icon-logo",
    name: "PushHub Signal Bell",
    url: "/logo.png",
    category: "Brand",
    description: "Official PushHub neon pulse notification bell emblem",
  },
];

export const PRESET_BADGES: AssetPreset[] = [
  {
    id: "badge-bell",
    name: "Bell Badge",
    url: "/presets/badge-bell.png",
    category: "Standard",
    description: "Crisp white notification bell silhouette",
  },
  {
    id: "badge-shield",
    name: "Shield Badge",
    url: "/presets/badge-shield.png",
    category: "Security",
    description: "Crisp white security shield silhouette",
  },
  {
    id: "badge-star",
    name: "Star Badge",
    url: "/presets/badge-star.png",
    category: "Achievement",
    description: "Crisp white 5-point star silhouette",
  },
  {
    id: "badge-check",
    name: "Checkmark Badge",
    url: "/presets/badge-check.png",
    category: "Verified",
    description: "Crisp white verified checkmark silhouette",
  },
];

export const PRESET_BANNERS: AssetPreset[] = [
  {
    id: "banner-abstract",
    name: "Neon Cyber Wave",
    url: "/presets/banner-abstract.png",
    category: "Tech",
    description: "Modern purple/blue ambient glowing waves and tech grid",
  },
  {
    id: "banner-promo",
    name: "Special Offer 🎉",
    url: "/presets/banner-promo.png",
    category: "Marketing",
    description: "Golden warm sunset gradient with celebration sparkles",
  },
  {
    id: "banner-success",
    name: "Payment Confirmed",
    url: "/presets/banner-success.png",
    category: "Billing",
    description: "Emerald burst with transaction verified seal",
  },
];

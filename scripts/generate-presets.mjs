import fs from "fs";
import path from "path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "presets");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. SVGs for Icons (192x192)
const icons = [
  {
    name: "icon-bell",
    svg: `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgBell" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="192" height="192" rx="44" fill="url(#bgBell)"/>
  <circle cx="96" cy="96" r="68" fill="white" fill-opacity="0.12"/>
  <g filter="url(#shadow)" fill="white" transform="translate(48, 44)">
    <path d="M48 10C33.6 10 22 21.6 22 36V54L14 66V72H82V66L74 54V36C74 21.6 62.4 10 48 10ZM38 78C38 83.5 42.5 88 48 88C53.5 88 58 83.5 58 78H38Z"/>
  </g>
</svg>`
  },
  {
    name: "icon-success",
    svg: `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="192" height="192" rx="44" fill="url(#bgSuccess)"/>
  <circle cx="96" cy="96" r="68" fill="white" fill-opacity="0.12"/>
  <g filter="url(#shadow)" fill="white" transform="translate(44, 44)">
    <path d="M52 4C25.5 4 4 25.5 4 52C4 78.5 25.5 100 52 100C78.5 100 100 78.5 100 52C100 25.5 78.5 4 52 4ZM44 76L22 54L30.5 45.5L44 59L73.5 29.5L82 38L44 76Z"/>
  </g>
</svg>`
  },
  {
    name: "icon-alert",
    svg: `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgAlert" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="192" height="192" rx="44" fill="url(#bgAlert)"/>
  <circle cx="96" cy="96" r="68" fill="white" fill-opacity="0.12"/>
  <g filter="url(#shadow)" fill="white" transform="translate(48, 44)">
    <path d="M48 6L10 24V50C10 74 26 96 48 102C70 96 86 74 86 50V24L48 6ZM52 76H44V68H52V76ZM52 58H44V34H52V58Z"/>
  </g>
</svg>`
  },
  {
    name: "icon-message",
    svg: `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgMessage" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="192" height="192" rx="44" fill="url(#bgMessage)"/>
  <circle cx="96" cy="96" r="68" fill="white" fill-opacity="0.12"/>
  <g filter="url(#shadow)" fill="white" transform="translate(46, 46)">
    <path d="M50 8C24.6 8 4 25.9 4 48C4 58.6 8.5 68.2 16 75.3V92L32.2 84.3C37.6 86.7 43.6 88 50 88C75.4 88 96 70.1 96 48C96 25.9 75.4 8 50 8ZM32 54C28.7 54 26 51.3 26 48C26 44.7 28.7 42 32 42C35.3 42 38 44.7 38 48C38 51.3 35.3 54 32 54ZM50 54C46.7 54 44 51.3 44 48C44 44.7 46.7 42 50 42C53.3 42 56 44.7 56 48C56 51.3 53.3 54 50 54ZM68 54C64.7 54 62 51.3 62 48C62 44.7 64.7 42 68 42C71.3 42 74 44.7 74 48C74 51.3 71.3 54 68 54Z"/>
  </g>
</svg>`
  }
];

// 2. SVGs for Badges (96x96 monochrome transparent)
const badges = [
  {
    name: "badge-bell",
    svg: `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <path fill="#ffffff" d="M48 10C33.6 10 22 21.6 22 36V54L14 66V72H82V66L74 54V36C74 21.6 62.4 10 48 10ZM38 78C38 83.5 42.5 88 48 88C53.5 88 58 83.5 58 78H38Z"/>
</svg>`
  },
  {
    name: "badge-shield",
    svg: `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <path fill="#ffffff" d="M48 6L14 22V48C14 71 28.5 91.5 48 97C67.5 91.5 82 71 82 48V22L48 6ZM48 52H24C25.5 68.5 35.5 82.5 48 87V52Z"/>
</svg>`
  },
  {
    name: "badge-star",
    svg: `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <path fill="#ffffff" d="M48 8L60.3 33.1L88 37.1L68 56.6L72.7 84.1L48 71.1L23.3 84.1L28 56.6L8 37.1L35.7 33.1L48 8Z"/>
</svg>`
  },
  {
    name: "badge-check",
    svg: `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <path fill="#ffffff" d="M48 6C24.8 6 6 24.8 6 48C6 71.2 24.8 90 48 90C71.2 90 90 71.2 90 48C90 24.8 71.2 6 48 6ZM41 68L21 48L28.1 40.9L41 53.8L67.9 26.9L75 34L41 68Z"/>
</svg>`
  }
];

// 3. SVGs for Banners (720x360 widescreen)
const banners = [
  {
    name: "banner-abstract",
    svg: `<svg width="720" height="360" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#311042"/>
    </linearGradient>
    <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#818cf8" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30"/>
    </filter>
  </defs>
  <rect width="720" height="360" fill="url(#bg1)"/>
  
  <!-- Glowing Orbs -->
  <circle cx="150" cy="180" r="110" fill="#6366f1" fill-opacity="0.35" filter="url(#blurFilter)"/>
  <circle cx="560" cy="120" r="130" fill="#ec4899" fill-opacity="0.3" filter="url(#blurFilter)"/>
  <circle cx="360" cy="280" r="90" fill="#38bdf8" fill-opacity="0.25" filter="url(#blurFilter)"/>
  
  <!-- Sleek Tech Graphic Overlay -->
  <g stroke="white" stroke-opacity="0.08" stroke-width="1.5">
    <line x1="0" y1="90" x2="720" y2="90"/>
    <line x1="0" y1="180" x2="720" y2="180"/>
    <line x1="0" y1="270" x2="720" y2="270"/>
    <line x1="180" y1="0" x2="180" y2="360"/>
    <line x1="360" y1="0" x2="360" y2="360"/>
    <line x1="540" y1="0" x2="540" y2="360"/>
  </g>
  
  <!-- Glowing Wave Ribbon -->
  <path d="M-20 220 C 180 120, 360 300, 540 160 C 620 100, 700 240, 740 200" fill="none" stroke="url(#neonGlow)" stroke-width="6" stroke-linecap="round" filter="url(#blurFilter)"/>
  <path d="M-20 220 C 180 120, 360 300, 540 160 C 620 100, 700 240, 740 200" fill="none" stroke="url(#neonGlow)" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Central Badge & Label -->
  <rect x="230" y="140" width="260" height="80" rx="20" fill="#0f172a" fill-opacity="0.7" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  <text x="360" y="176" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#ffffff" letter-spacing="1">PUSHHUB LIVE</text>
  <text x="360" y="200" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#94a3b8" letter-spacing="2">RICH PUSH NOTIFICATION</text>
</svg>`
  },
  {
    name: "banner-promo",
    svg: `<svg width="720" height="360" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgPromo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#450a0a"/>
      <stop offset="40%" stop-color="#7c2d12"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <filter id="blurPromo" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="35"/>
    </filter>
  </defs>
  <rect width="720" height="360" fill="url(#bgPromo)"/>
  <circle cx="160" cy="100" r="140" fill="#f97316" fill-opacity="0.4" filter="url(#blurPromo)"/>
  <circle cx="580" cy="240" r="150" fill="#e11d48" fill-opacity="0.35" filter="url(#blurPromo)"/>
  
  <!-- Sparkles -->
  <g fill="#fef08a" opacity="0.8">
    <polygon points="120,70 124,84 138,88 124,92 120,106 116,92 102,88 116,84"/>
    <polygon points="610,90 613,100 623,103 613,106 610,116 607,106 597,103 607,100"/>
    <polygon points="560,280 563,288 571,291 563,294 560,302 557,294 549,291 557,288"/>
    <polygon points="180,270 183,278 191,281 183,284 180,292 177,284 169,281 177,278"/>
  </g>
  
  <!-- Card Container -->
  <rect x="180" y="115" width="360" height="130" rx="24" fill="#000000" fill-opacity="0.55" stroke="rgba(251,191,36,0.3)" stroke-width="2"/>
  <text x="360" y="162" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#fbbf24" letter-spacing="3">LIMITED TIME EXCLUSIVE</text>
  <text x="360" y="202" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">SPECIAL OFFER 🎉</text>
  <text x="360" y="228" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#fed7aa">Tap to unlock your discount coupon</text>
</svg>`
  },
  {
    name: "banner-success",
    svg: `<svg width="720" height="360" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgSuccessBanner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="50%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <filter id="blurSucc" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="35"/>
    </filter>
  </defs>
  <rect width="720" height="360" fill="url(#bgSuccessBanner)"/>
  <circle cx="200" cy="180" r="140" fill="#10b981" fill-opacity="0.3" filter="url(#blurSucc)"/>
  <circle cx="540" cy="140" r="120" fill="#06b6d4" fill-opacity="0.35" filter="url(#blurSucc)"/>
  
  <!-- Success Emblem & Text -->
  <g transform="translate(328, 80)">
    <circle cx="32" cy="32" r="32" fill="#10b981" fill-opacity="0.25"/>
    <circle cx="32" cy="32" r="26" fill="#10b981"/>
    <path d="M26 33L30 37L39 27" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <text x="360" y="195" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="0.5">TRANSACTION CONFIRMED</text>
  <text x="360" y="228" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#a7f3d0">Your payment and order have been verified successfully</text>
  <rect x="270" y="252" width="180" height="34" rx="17" fill="#ffffff" fill-opacity="0.15" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  <text x="360" y="274" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#ecfdf5">INVOICE #INV-8921</text>
</svg>`
  }
];

async function generateAll() {
  console.log("Generating presets in:", outDir);

  // 1. Generate Icons
  for (const item of icons) {
    fs.writeFileSync(path.join(outDir, `${item.name}.svg`), item.svg);
    await sharp(Buffer.from(item.svg))
      .png()
      .toFile(path.join(outDir, `${item.name}.png`));
    console.log(`✓ Generated: ${item.name}.png & .svg`);
  }

  // 2. Generate Badges
  for (const item of badges) {
    fs.writeFileSync(path.join(outDir, `${item.name}.svg`), item.svg);
    await sharp(Buffer.from(item.svg))
      .png()
      .toFile(path.join(outDir, `${item.name}.png`));
    console.log(`✓ Generated: ${item.name}.png & .svg`);
  }

  // 3. Generate Banners
  for (const item of banners) {
    fs.writeFileSync(path.join(outDir, `${item.name}.svg`), item.svg);
    await sharp(Buffer.from(item.svg))
      .png()
      .toFile(path.join(outDir, `${item.name}.png`));
    console.log(`✓ Generated: ${item.name}.png & .svg`);
  }

  console.log("All default preset assets generated successfully!");
}

generateAll().catch(console.error);

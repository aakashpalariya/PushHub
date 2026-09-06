# PushHub — Production-Quality Push Notification Testing PWA

**PushHub** is a mobile-first, developer-grade Web Push Notification Testing Studio and Progressive Web App (PWA). Author rich notification payloads, preview them with high fidelity across Browser, Android, and iOS formats, and dispatch real W3C Web Push notifications directly through standard VAPID protocols.

---

## Features

- **Real Web Push API**: Cryptographically signed VAPID push notifications delivered through Next.js server route handlers to browser Service Workers.
- **Two-Column Notification Composer**: Live preview updating simultaneously as you edit title, body, icons, images, vibration patterns, and action buttons.
- **Administrator Portal (`/admin`)**: Dedicated dashboard to manage registered accounts, reset passwords, promote/demote roles, inspect device counts, and monitor system-wide push statistics.
- **Inline Field Validations**: Direct below-field validation feedback with red highlight states across all forms.
- **Multi-Platform Previews**: High-fidelity visual approximations of Chrome/Edge, Android Material You, and iOS Lock Screen banners.
- **12 Built-In System Templates**: Pre-configured blueprints for Alerts, Billing, Reminders, Flash Promotions, Social reactions, Chat messages, Version Updates, Security notifications, Gamification achievements, Order delivery, Flight status updates, and Upcoming meetings.
- **Capability & Diagnostics Center**: Dynamic detection of Push Manager, Service Worker, Action Buttons, Vibration API, App Badging, and PWA standalone status.
- **Device Management**: Register and manage browser push endpoints across multiple desktop and mobile devices with one-click test pings.
- **Notification History**: Full audit trail of dispatched push events with raw JSON payload inspection and status tracking.
- **PWA & Mobile-First**: Installable application with service worker caching, standalone display, and dedicated iOS Safari Home Screen instructions.
- **Consistent Typography**: Styled with the Google Font **Baloo 2** throughout the entire application.

---

## Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: Email/password with bcryptjs and secure HTTP-only Jose JWT session cookies
- **Push Engine**: `web-push` library with VAPID key exchange
- **Icons & UI**: Lucide React, Sonner toasts

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18.18+ or v20+ / v22+
- npm v9+

### 2. Installation

Clone the repository and install dependencies:

```bash
cd PushHub
npm install
```

### 3. Environment Variables

Create a `.env` file from the provided `.env.example`:

```bash
cp .env.example .env
```

Ensure your `.env` contains:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-32-char-random-auth-secret"

# Web Push VAPID Keys
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:admin@pushhub.dev"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

### 4. Default Administrator Credentials

PushHub seeds a default administrator account:
- **Email**: `admin@pushhub.dev`
- **Password**: `adminPassword123!`
- **Portal**: Access at `/admin` (or via the **Admin Portal** link in the sidebar)

### 5. Generating VAPID Keys

If you need a new VAPID keypair, generate one with:

```bash
npx web-push generate-vapid-keys
```

Copy the printed `publicKey` and `privateKey` into your `.env` file.

### 5. Database Setup & Seeding

Initialize the SQLite database and seed the 12 built-in system templates:

```bash
# Push schema to SQLite
npx prisma db push

# Seed the 12 system notification templates
npm run prisma:seed
```

### 6. Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing Web Push Notifications

### Localhost & HTTPS Requirements

- **Localhost**: Browsers (Chrome, Edge, Firefox) permit Service Workers and Web Push on `http://localhost:3000` without requiring an SSL certificate.
- **Testing on Mobile (Android / iOS)**: To test real push notifications on a physical phone over your local network, Web Push **strictly requires HTTPS** (except on `localhost`). You can use tools such as [ngrok](https://ngrok.com/) or Cloudflare Tunnel to expose a secure HTTPS tunnel to your phone:

```bash
npx ngrok http 3000
```

### Testing on Android

1. Open the app URL in Chrome on Android.
2. Sign in or create an account.
3. Tap **"Subscribe Device"** in the top navigation or Device Manager.
4. Allow notifications when prompted by Android.
5. In the Notification Composer, tap **"Send Real Push"**. The system notification will appear in your Android drawer!

### Testing on iOS (iPhone / iPad)

Starting in iOS 16.4, Apple Web Push is supported exclusively through Home Screen PWAs:

1. Open Push Lab in **Safari** on your iOS device.
2. Tap the **Share** icon in Safari and select **"Add to Home Screen"**.
3. Open the installed Push Lab app from your Home Screen (not inside the browser).
4. Sign in and tap **"Subscribe Device"**.
5. Grant notification permissions when prompted.
6. Dispatch a push notification from the composer or desktop dashboard to receive native lockscreen alerts on your iPhone!

---

## Project Structure

```text
├── prisma/
│   ├── schema.prisma             # SQLite schema for User, Notification, Device, History, Template
│   └── seed.mjs                  # Seeds the 10 system notification blueprints
├── public/
│   ├── sw.js                     # Service Worker handling 'push' and 'notificationclick'
│   ├── manifest.webmanifest      # PWA metadata & configuration
│   └── icons/                    # App and notification badge SVGs
├── src/
│   ├── app/
│   │   ├── (auth)/               # Sign up & Login pages
│   │   ├── (dashboard)/          # Authenticated App views (Composer, Devices, History, etc.)
│   │   ├── api/                  # Backend Next.js Route Handlers
│   │   ├── layout.tsx            # Global layout with Baloo 2 font & Sonner toasts
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── composer/             # Form builder & JSON inspector
│   │   ├── preview/              # Multi-platform preview frames (Browser, Android, iOS)
│   │   ├── devices/              # Capability center & device cards
│   │   ├── layout/               # Sidebar, Header, and Mobile bottom navigation
│   │   └── ui/                   # Reusable shadcn/ui inspired components
│   ├── hooks/
│   │   ├── use-push-subscription.ts  # Web Push subscription lifecycle hook
│   │   └── use-pwa-install.ts        # PWA installation event hook
│   ├── lib/
│   │   ├── auth/                 # Bcrypt & Jose JWT session helpers
│   │   ├── db/                   # Prisma client singleton
│   │   └── push/                 # Web-push server utility
│   └── types/                    # Unified TypeScript notification definitions
```

---

## Production Build & Deployment

To test or deploy a production bundle:

```bash
npm run build
npm run start
```

---

## License

MIT License. Designed and engineered for production web push testing.

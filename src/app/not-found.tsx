import Link from "next/link";
import { ArrowLeft, Home, Bell, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20 selection:text-primary">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-orange-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card/90 backdrop-blur-xl p-8 shadow-2xl text-center space-y-6">
        {/* Brand Logo & 404 Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-xl p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PushHub Logo" className="h-full w-full object-contain" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border text-xs font-bold text-muted-foreground">
            <Compass className="h-3.5 w-3.5 text-orange-400" />
            <span>HTTP 404 · Not Found</span>
          </div>
        </div>

        {/* Big 404 Number */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400">
            404
          </h1>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you requested doesn&apos;t exist, has been moved, or is no longer available in PushHub.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Link href="/dashboard" className="w-full">
            <Button variant="glow" className="w-full gap-2 font-bold text-sm h-11">
              <Home className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Link href="/notifications" className="w-full">
            <Button variant="outline" className="w-full gap-2 text-sm h-11">
              <Bell className="h-4 w-4" />
              <span>My Notifications</span>
            </Button>
          </Link>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          PushHub · Web Push Testing Studio
        </div>
      </div>
    </div>
  );
}

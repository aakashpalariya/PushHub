"use client";

import { useState } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Download, Share, X, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  // iOS Safari Guide Banner
  if (isIOS) {
    return (
      <div className="relative mx-4 mt-3 p-4 rounded-2xl bg-card border border-blue-500/30 text-foreground shadow-lg">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="pr-6">
            <h4 className="font-bold text-sm text-foreground">
              Install PushHub on iOS
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              iOS requires adding this website to your Home Screen to test Web Push notifications:
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                1. Tap <Share className="h-3 w-3" /> Share
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                2. &quot;Add to Home Screen&quot;
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                3. Open app &amp; enable push
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Desktop / Android PWA Prompt Banner
  if (isInstallable) {
    return (
      <div className="relative mx-4 mt-3 p-4 rounded-2xl bg-card border border-blue-500/30 text-foreground shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              Install PushHub App
            </h4>
            <p className="text-xs text-muted-foreground">
              Install as a desktop or mobile PWA for native notifications and offline testing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="glow" onClick={install} className="gap-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Install
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

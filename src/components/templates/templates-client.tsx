"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Copy,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Shield,
  Layers,
  Flame,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "@/components/ui/custom-toaster";
import { TemplateModel } from "@/types/notification";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

interface TemplateWithConfig extends TemplateModel {
  parsedConfig: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    actions?: Array<{ action: string; title: string }>;
    tag?: string;
    style?: { theme?: string };
  };
}

export function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: TemplateWithConfig[];
}) {
  const router = useRouter();
  const { isSubscribed, subscribeDevice } = usePushSubscription();
  const { resolvedTheme } = useTheme();
  const [templates, setTemplates] = useState<TemplateWithConfig[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    templates.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.parsedConfig.title.toLowerCase().includes(search.toLowerCase()) ||
        t.parsedConfig.body.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        selectedCategory === "All" || t.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [templates, search, selectedCategory]);

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to copy template");

      toast.success("Template copied to your notifications! Opening editor...");
      
      if (data.notification?.id) {
        router.push(`/notifications/${data.notification.id}`);
      } else if (data.template) {
        const parsedConfig = JSON.parse(data.template.configuration);
        setTemplates((prev) => [{ ...data.template, parsedConfig }, ...prev]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error copying template";
      toast.error(msg);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleTestPush = async (tmpl: TemplateWithConfig) => {
    if (!isSubscribed) {
      toast.info("Subscribing this browser first...");
      const subscribed = await subscribeDevice();
      if (!subscribed) {
        toast.error("Device subscription required to test push notifications");
        return;
      }
    }

    setTestingId(tmpl.id);
    try {
      const res = await fetch(`/api/templates/${tmpl.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: resolvedTheme }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch test push");
      }

      toast.success(data.message || `Test push for "${tmpl.name}" delivered!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error dispatching test push";
      toast.error(msg);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Notification Templates"
        description="Production-ready blueprints designed for alerts, marketing, transactions, chat, and system updates."
        badge={
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>12 Built-In System Templates Available</span>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Search templates by title, description, or category..."
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-xs"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={search ? "No matching templates found" : "No templates available"}
          description={
            search
              ? "Try adjusting your search terms or selecting another category."
              : "Templates provide quick starting points for testing various push notification scenarios."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filtered.map((tmpl) => (
          <div
            key={tmpl.id}
            className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-foreground break-words">
                    {tmpl.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant="outline" size="sm" className="flex-shrink-0">
                      {tmpl.category}
                    </Badge>
                    {tmpl.isSystemTemplate ? (
                      <Badge variant="purple" size="sm" className="flex-shrink-0">
                        System Template
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm" className="flex-shrink-0">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>

                {tmpl.parsedConfig.icon && (
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-secondary border border-border flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tmpl.parsedConfig.icon}
                      alt="Icon"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/logo.png";
                      }}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {tmpl.description}
              </p>

              {/* Notification Mock Card */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/70 text-xs space-y-1.5">
                <p className="font-bold text-foreground truncate">
                  {tmpl.parsedConfig.title}
                </p>
                <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                  {tmpl.parsedConfig.body}
                </p>
                {tmpl.parsedConfig.actions && tmpl.parsedConfig.actions.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {tmpl.parsedConfig.actions.slice(0, 2).map((act, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-secondary border border-border text-[10px] font-semibold text-foreground/80"
                      >
                        {act.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-border/70 flex flex-wrap sm:flex-nowrap items-center gap-2">
              <Button
                variant="glow"
                size="sm"
                onClick={() => handleTestPush(tmpl)}
                disabled={testingId === tmpl.id}
                className="flex-1 gap-1.5 font-bold shadow-blue-500/20"
                title="Send test push to your subscribed device"
              >
                <Zap className={cn("h-3.5 w-3.5", testingId === tmpl.id && "animate-spin text-amber-300")} />
                <span>{testingId === tmpl.id ? "Testing..." : "Test Push"}</span>
              </Button>

              <Link
                href={`/notifications/new?templateId=${tmpl.id}`}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5 font-bold">
                  <span>Use</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate(tmpl.id)}
                disabled={duplicatingId === tmpl.id}
                className="gap-1.5 px-3 flex-initial"
                title="Duplicate to My Templates"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="text-xs">Copy</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

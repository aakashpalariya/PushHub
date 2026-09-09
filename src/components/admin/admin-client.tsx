"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Bell,
  Smartphone,
  Zap,
  Trash2,
  Key,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Lock,
  Layers,
  ArrowUpDown,
  Code,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Filter,
  BarChart3,
  Eye,
  Activity,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  Clock,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/custom-toaster";
import { formatDate, cn } from "@/lib/utils";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  dateOfBirth?: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  _count: {
    notifications: number;
    subscriptions: number;
    history: number;
  };
}

export interface AdminPushLog {
  id: string;
  title: string;
  payload: string;
  device: string;
  platform: string;
  status: string;
  error?: string | null;
  sentAt: string;
  userName: string;
  userEmail: string;
}

export interface AdminTemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystemTemplate: boolean;
  createdAt: string;
  author: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsersCount: number;
  deactivatedUsersCount: number;
  totalNotifications: number;
  totalSubscriptions: number;
  totalHistory: number;
  totalTemplates: number;
  sentPushes: number;
  failedPushes: number;
}

export function AdminClient({
  initialUsers,
  initialStats,
  initialLogs,
  initialTemplates,
  currentAdminEmail,
}: {
  initialUsers: AdminUser[];
  initialStats: AdminStats;
  initialLogs: AdminPushLog[];
  initialTemplates: AdminTemplateItem[];
  currentAdminEmail: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [logs] = useState<AdminPushLog[]>(initialLogs);
  const [templates] = useState<AdminTemplateItem[]>(initialTemplates);

  // Tabs: users | logs | analytics | templates
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "analytics" | "templates">("users");

  // User Filter & Sort States
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "notifications" | "devices" | "pushes" | "name">("newest");

  // Modals
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [inspectPayloadLog, setInspectPayloadLog] = useState<AdminPushLog | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const [actionUserId, setActionUserId] = useState<string | null>(null);

  // Log filter
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState<"all" | "sent" | "failed">("all");

  // Filtering & Sorting Users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase());

        const matchesRole =
          roleFilter === "all" ||
          (roleFilter === "admin" && u.isAdmin) ||
          (roleFilter === "member" && !u.isAdmin);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && u.isActive !== false) ||
          (statusFilter === "deactivated" && u.isActive === false);

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "notifications") return b._count.notifications - a._count.notifications;
        if (sortBy === "devices") return b._count.subscriptions - a._count.subscriptions;
        if (sortBy === "pushes") return b._count.history - a._count.history;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [users, search, roleFilter, statusFilter, sortBy]);

  // Filtering Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.userEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.userName.toLowerCase().includes(logSearch.toLowerCase());

      const matchesStatus =
        logStatusFilter === "all" || l.status === logStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, logSearch, logStatusFilter]);

  // Template type filter
  const [templateTypeFilter, setTemplateTypeFilter] = useState<"all" | "custom" | "system">("all");

  const customTemplatesCount = useMemo(
    () => templates.filter((t) => !t.isSystemTemplate).length,
    [templates]
  );
  const systemTemplatesCount = useMemo(
    () => templates.filter((t) => t.isSystemTemplate).length,
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (templateTypeFilter === "custom") return !tpl.isSystemTemplate;
      if (templateTypeFilter === "system") return tpl.isSystemTemplate;
      return true;
    });
  }, [templates, templateTypeFilter]);

  // Toggle Role
  const handleToggleRole = async (user: AdminUser) => {
    if (user.email === currentAdminEmail) {
      toast.error("Cannot modify role for your active admin account");
      return;
    }

    setActionUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user role");

      toast.success(`User ${user.email} is now ${!user.isAdmin ? "an Administrator" : "a Standard Member"}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating role";
      toast.error(msg);
    } finally {
      setActionUserId(null);
    }
  };

  // Toggle Active / Deactivate Account
  const handleToggleActive = async (user: AdminUser) => {
    if (user.email === currentAdminEmail) {
      toast.error("Cannot deactivate your own administrator account");
      return;
    }

    const nextState = !user.isActive;
    setActionUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account status");

      toast.success(
        nextState
          ? `Account ${user.email} has been activated`
          : `Account ${user.email} has been deactivated`
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextState } : u))
      );

      setStats((prev) => ({
        ...prev,
        activeUsersCount: prev.activeUsersCount + (nextState ? 1 : -1),
        deactivatedUsersCount: prev.deactivatedUsersCount + (nextState ? -1 : 1),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      toast.error(msg);
    } finally {
      setActionUserId(null);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: AdminUser) => {
    if (user.email === currentAdminEmail) {
      toast.error("Cannot delete your own administrator account");
      return;
    }

    const confirmed = await confirm({
      title: "Delete User Account",
      description: (
        <span>
          Are you sure you want to permanently delete user{" "}
          <strong className="text-foreground font-semibold">{user.email}</strong>? All their notification presets, registered devices, and push logs will be purged permanently.
        </span>
      ),
      confirmText: "Delete Account",
      variant: "destructive",
      icon: "trash",
    });

    if (!confirmed) {
      return;
    }

    setActionUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      toast.success(`User ${user.email} deleted successfully`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setStats((prev) => ({
        ...prev,
        totalUsers: prev.totalUsers - 1,
        activeUsersCount: user.isActive ? prev.activeUsersCount - 1 : prev.activeUsersCount,
        deactivatedUsersCount: !user.isActive ? prev.deactivatedUsersCount - 1 : prev.deactivatedUsersCount,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting user";
      toast.error(msg);
    } finally {
      setActionUserId(null);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!resetPasswordUser) return;

    if (!newPassword.trim()) {
      setPasswordError("Password is required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to reset password");
        return;
      }

      toast.success(`Password updated for ${resetPasswordUser.email}`);
      setResetPasswordUser(null);
      setNewPassword("");
      setPasswordError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resetting password";
      setPasswordError(msg);
    } finally {
      setResetting(false);
    }
  };

  const handleCopyPayload = (payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    toast.success("Payload copied to clipboard");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Delivery rate calculation
  const deliveryRate = stats.totalHistory > 0
    ? Math.round((stats.sentPushes / stats.totalHistory) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-100/90 via-blue-100/80 to-card dark:from-purple-950/70 dark:via-blue-950/60 dark:to-card border border-purple-200 dark:border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold">
              <Shield className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Administrator Operations Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              PushHub Control Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Supervise registered accounts, manage security access, audit push notification deliveries, and review system templates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card/90 border border-border text-xs space-y-1 self-start sm:self-center shadow-xs">
            <span className="font-bold text-foreground block">Active Administrator</span>
            <div className="font-mono text-[11px] text-purple-700 dark:text-purple-300">
              Email: <strong className="text-foreground font-bold">{currentAdminEmail}</strong>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              Permissions: <strong className="text-foreground">Full Platform Access</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Global Metrics 4-Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Total Accounts</span>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalUsers}</p>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-emerald-600 dark:text-emerald-400">{stats.activeUsersCount} active</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-rose-500">{stats.deactivatedUsersCount} suspended</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Saved Payloads</span>
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalNotifications}</p>
          <span className="text-xs text-muted-foreground block">Notification configurations</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Connected Devices</span>
            <Smartphone className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalSubscriptions}</p>
          <span className="text-xs text-muted-foreground block">Active browser endpoints</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Push Deliveries</span>
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalHistory}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
            {stats.sentPushes} delivered ({deliveryRate}%) · {stats.failedPushes} failed
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "logs"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Push Audit Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "analytics"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Platform Overview &amp; Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "templates"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Templates ({templates.length})</span>
        </button>
      </div>

      {/* TAB 1: User Management */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filters & Sorter */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="w-full md:w-80">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search users by name or email..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
              {/* Role filter */}
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "member")}
                wrapperClassName="w-full md:w-44"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators Only</option>
                <option value="member">Standard Members</option>
              </Select>

              {/* Status filter */}
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "deactivated")}
                wrapperClassName="w-full md:w-44"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="deactivated">Deactivated / Suspended</option>
              </Select>

              {/* Sorter */}
              <Select
                icon={ArrowUpDown}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "notifications" | "devices" | "pushes" | "name")}
                wrapperClassName="w-full md:w-48"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="notifications">Sort: Most Notifications</option>
                <option value="devices">Sort: Most Devices</option>
                <option value="pushes">Sort: Most Pushes</option>
                <option value="name">Sort: Name (A-Z)</option>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                        No users match the current search filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.email === currentAdminEmail;

                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {u.name[0]?.toUpperCase() || "U"}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">
                                  {u.name} {isSelf && <span className="text-xs text-primary font-normal">(You)</span>}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                                {u.dateOfBirth && (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono mt-0.5">
                                    <Calendar className="h-3 w-3 text-purple-500/70" />
                                    <span>DOB: {u.dateOfBirth}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Status column: Active / Deactivated */}
                          <TableCell>
                            {u.isActive !== false ? (
                              <Badge variant="success" className="gap-1.5 text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1.5 text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                Deactivated
                              </Badge>
                            )}
                          </TableCell>

                          {/* Role column */}
                          <TableCell>
                            {u.isAdmin ? (
                              <Badge variant="purple" className="gap-1 text-xs">
                                <Shield className="h-3 w-3" /> Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Member
                              </Badge>
                            )}
                          </TableCell>

                          {/* Activity / Counts Column */}
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Bell className="h-3 w-3 text-blue-500 shrink-0" />
                                <span className="font-semibold text-foreground">{u._count.notifications}</span>
                                <span>payloads</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Smartphone className="h-3 w-3 text-cyan-500 shrink-0" />
                                <span className="font-semibold text-foreground">{u._count.subscriptions}</span>
                                <span>devices</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
                                <span className="font-semibold text-foreground">{u._count.history}</span>
                                <span>pushes</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(u.createdAt)}
                          </TableCell>

                          {/* Action Buttons */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect details button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setInspectUser(u)}
                                className="h-8 px-2 text-xs"
                                title="Inspect User Details & Counts"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              {/* Deactivate / Activate Account button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(u)}
                                disabled={isSelf || actionUserId === u.id}
                                className={`h-8 px-2.5 text-xs font-semibold ${
                                  u.isActive !== false
                                    ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
                                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                                }`}
                                title={u.isActive !== false ? "Deactivate / Suspend Account" : "Activate Account"}
                              >
                                {u.isActive !== false ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5 mr-1" />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                    <span>Activate</span>
                                  </>
                                )}
                              </Button>

                              {/* Toggle role */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleRole(u)}
                                disabled={isSelf || actionUserId === u.id}
                                className="h-8 px-2 text-xs"
                                title={u.isAdmin ? "Demote to Member" : "Promote to Administrator"}
                              >
                                {u.isAdmin ? "Demote" : "Make Admin"}
                              </Button>

                              {/* Reset password */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setResetPasswordUser(u);
                                  setNewPassword("");
                                }}
                                className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                title="Reset User Password"
                              >
                                <Key className="h-3.5 w-3.5" />
                                <span>Password</span>
                              </Button>

                              {/* Delete account */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(u)}
                                disabled={isSelf || actionUserId === u.id}
                                className="h-8 px-2 text-xs gap-1 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/10"
                                title="Permanently Delete User"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile User Cards View (block md:hidden) */}
            <div className="block md:hidden divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No users match the current search filters.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.email === currentAdminEmail;

                  return (
                    <div key={u.id} className="p-4 space-y-3 bg-card hover:bg-secondary/10 transition-colors">
                      {/* User Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {u.name[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">
                              {u.name} {isSelf && <span className="text-xs text-primary font-normal">(You)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono break-all select-all">
                              {u.email}
                            </p>
                            {u.dateOfBirth && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono mt-0.5">
                                <Calendar className="h-3 w-3 text-purple-500/70" />
                                <span>DOB: {u.dateOfBirth}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {u.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Deactivated
                            </span>
                          )}

                          {u.isAdmin ? (
                            <Badge variant="secondary" className="text-[9px] text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 bg-purple-100 dark:bg-purple-500/10 font-bold">
                              <Shield className="h-2.5 w-2.5 mr-0.5" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px]">
                              Member
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Counts Summary 3-Pill Grid */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/60 text-center">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Saved</span>
                          <span className="text-sm font-black text-foreground">{u._count.notifications}</span>
                        </div>
                        <div className="border-x border-border/60">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Devices</span>
                          <span className="text-sm font-black text-foreground">{u._count.subscriptions}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Pushes</span>
                          <span className="text-sm font-black text-foreground">{u._count.history}</span>
                        </div>
                      </div>

                      {/* Meta info & Action bar */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatDate(u.createdAt)}</span>
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectUser(u)}
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            title="Inspect Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf || actionUserId === u.id}
                            className={`h-8 px-2 text-xs font-semibold gap-1 ${
                              u.isActive !== false
                                ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
                                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                            }`}
                            title={u.isActive !== false ? "Deactivate Account" : "Activate Account"}
                          >
                            {u.isActive !== false ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRole(u)}
                            disabled={isSelf || actionUserId === u.id}
                            className="h-8 px-2 text-xs"
                            title={u.isAdmin ? "Demote" : "Make Admin"}
                          >
                            {u.isAdmin ? "Demote" : "Admin"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetPasswordUser(u);
                              setNewPassword("");
                            }}
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            title="Reset Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                            <span>Password</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSelf || actionUserId === u.id}
                            className="h-8 px-2 text-xs gap-1 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/10"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Push Audit Logs */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="w-full md:w-80">
              <SearchInput
                value={logSearch}
                onChange={setLogSearch}
                placeholder="Search by title, sender, or email..."
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value as "all" | "sent" | "failed")}
                wrapperClassName="w-full md:w-56"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="sent">Delivered Only</option>
                <option value="failed">Failed Only</option>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification Title</TableHead>
                    <TableHead>Sender Account</TableHead>
                    <TableHead>Target Device / Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                        No push history logs recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <p className="font-bold text-foreground">{log.title}</p>
                          <span className="text-[11px] text-muted-foreground font-mono truncate max-w-xs block">
                            ID: {log.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-foreground">{log.userName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{log.userEmail}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">
                              {log.device} ({log.platform})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.status === "sent" ? (
                            <Badge variant="success" className="gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3" /> Delivered
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <XCircle className="h-3 w-3" /> Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.sentAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectPayloadLog(log)}
                            className="h-8 px-2.5 text-xs gap-1.5"
                          >
                            <Code className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            <span>Payload</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Push Logs Cards View (block md:hidden) */}
            <div className="block md:hidden divide-y divide-border/60">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No push history logs recorded yet.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-2.5 bg-card hover:bg-secondary/10 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-foreground text-sm">{log.title}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID: {log.id}
                        </span>
                      </div>

                      {log.status === "sent" ? (
                        <Badge variant="success" className="gap-1 text-[10px] flex-shrink-0">
                          <CheckCircle2 className="h-3 w-3" /> Delivered
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-[10px] flex-shrink-0">
                          <XCircle className="h-3 w-3" /> Failed
                        </Badge>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sender:</span>
                        <span className="font-semibold text-foreground truncate max-w-[180px]">{log.userName} ({log.userEmail})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Target:</span>
                        <span className="font-medium text-foreground">{log.device} ({log.platform})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(log.sentAt)}</span>
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectPayloadLog(log)}
                        className="h-7 px-2.5 text-xs gap-1.5"
                      >
                        <Code className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Payload</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Platform Overview & Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivery Health Card */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  Transmission Success Rate
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {deliveryRate}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${deliveryRate}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <span className="block font-bold text-base">{stats.sentPushes}</span>
                  <span>Successful Pushes</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                  <span className="block font-bold text-base">{stats.failedPushes}</span>
                  <span>Failed Attempts</span>
                </div>
              </div>
            </div>

            {/* Account Status Distribution */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Account Status Ratio
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {stats.totalUsers} Total
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active Members</span>
                    <span className="font-bold">{stats.activeUsersCount}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${stats.totalUsers > 0 ? (stats.activeUsersCount / stats.totalUsers) * 100 : 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-rose-500 font-bold">Deactivated / Suspended</span>
                    <span className="font-bold">{stats.deactivatedUsersCount}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{
                        width: `${stats.totalUsers > 0 ? (stats.deactivatedUsersCount / stats.totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Utilization Summary */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-bold text-foreground text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Averages &amp; Ratios
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30">
                  <span className="text-muted-foreground">Avg. Notifications per User</span>
                  <span className="font-bold text-foreground">
                    {stats.totalUsers > 0 ? (stats.totalNotifications / stats.totalUsers).toFixed(1) : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30">
                  <span className="text-muted-foreground">Avg. Subscribed Devices</span>
                  <span className="font-bold text-foreground">
                    {stats.totalUsers > 0 ? (stats.totalSubscriptions / stats.totalUsers).toFixed(1) : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30">
                  <span className="text-muted-foreground">Avg. Test Pushes Sent</span>
                  <span className="font-bold text-foreground">
                    {stats.totalUsers > 0 ? (stats.totalHistory / stats.totalUsers).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Templates Repository */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-2xl bg-card border border-border/80">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTemplateTypeFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  templateTypeFilter === "all"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                All ({templates.length})
              </button>
              <button
                onClick={() => setTemplateTypeFilter("custom")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  templateTypeFilter === "custom"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                Custom Templates ({customTemplatesCount})
              </button>
              <button
                onClick={() => setTemplateTypeFilter("system")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  templateTypeFilter === "system"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                System Blueprints ({systemTemplatesCount})
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              Exclusively showing system blueprints and administrator custom templates
            </span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-bold text-sm text-foreground">No templates match this filter</p>
              <p className="text-xs text-muted-foreground">
                {templateTypeFilter === "custom"
                  ? "You have not saved any custom administrator templates yet."
                  : "No templates available."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tpl) => (
                <div key={tpl.id} className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{tpl.name}</h3>
                      <span className="text-[11px] text-muted-foreground">{tpl.category}</span>
                    </div>
                    {tpl.isSystemTemplate ? (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold">
                        System Blueprint
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Custom Template
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>By: {tpl.author}</span>
                    <span>{formatDate(tpl.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Details Inspection Dialog */}
      <Dialog
        open={Boolean(inspectUser)}
        onOpenChange={(open) => !open && setInspectUser(null)}
      >
        <DialogHeader>
          <DialogTitle>User Account Summary &amp; Counts</DialogTitle>
          <DialogDescription>
            Account breakdown and metrics for: <strong>{inspectUser?.email}</strong>
          </DialogDescription>
        </DialogHeader>

        {inspectUser && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-bold text-foreground">{inspectUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-foreground">{inspectUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account Status:</span>
                <span className="font-bold">
                  {inspectUser.isActive !== false ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                  ) : (
                    <span className="text-rose-500">Deactivated / Suspended</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="font-bold text-foreground font-mono">{inspectUser.dateOfBirth || "Not recorded"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-bold text-foreground">{inspectUser.isAdmin ? "Administrator" : "Standard Member"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member Since:</span>
                <span>{formatDate(inspectUser.createdAt)}</span>
              </div>
            </div>

            {/* Counts Breakdown - Single Column Layout */}
            <div className="flex flex-col gap-2.5">
              <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">Saved Payloads</span>
                    <span className="text-[11px] text-muted-foreground">Stored notification templates</span>
                  </div>
                </div>
                <span className="text-xl font-black text-foreground font-mono">{inspectUser._count.notifications}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">Devices</span>
                    <span className="text-[11px] text-muted-foreground">Active browser push subscriptions</span>
                  </div>
                </div>
                <span className="text-xl font-black text-foreground font-mono">{inspectUser._count.subscriptions}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">Pushes Sent</span>
                    <span className="text-[11px] text-muted-foreground">Historical test push notifications</span>
                  </div>
                </div>
                <span className="text-xl font-black text-foreground font-mono">{inspectUser._count.history}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Inspect Raw Push Log Dialog */}
      <Dialog
        open={Boolean(inspectPayloadLog)}
        onOpenChange={(open) => !open && setInspectPayloadLog(null)}
      >
        <DialogHeader>
          <DialogTitle>Dispatched Web Push Payload</DialogTitle>
          <DialogDescription>
            Raw transmitted JSON for: <strong>{inspectPayloadLog?.title}</strong>
          </DialogDescription>
        </DialogHeader>

        {inspectPayloadLog && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Sender: {inspectPayloadLog.userName} ({inspectPayloadLog.userEmail})</span>
              <span>{formatDate(inspectPayloadLog.sentAt)}</span>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-secondary/50 border border-border font-mono text-xs overflow-x-auto max-h-72 text-foreground">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(inspectPayloadLog.payload), null, 2);
                  } catch {
                    return inspectPayloadLog.payload;
                  }
                })()}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyPayload(inspectPayloadLog.payload)}
                className="gap-1.5 text-xs"
              >
                {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPayload ? "Copied!" : "Copy JSON"}</span>
              </Button>

              <Button variant="glow" size="sm" onClick={() => setInspectPayloadLog(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog
        open={Boolean(resetPasswordUser)}
        onOpenChange={(open) => {
          if (!open) {
            setResetPasswordUser(null);
            setPasswordError(null);
            setNewPassword("");
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            Assign a new password for account: <strong>{resetPasswordUser?.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
          <FormField
            label="New Password"
            helperText="Minimum 6 characters"
            error={passwordError || undefined}
            required
          >
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="Enter new password"
              error={Boolean(passwordError)}
              autoFocus
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetPasswordUser(null);
                setPasswordError(null);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="glow" disabled={resetting}>
              {resetting ? "Resetting..." : "Save Password"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, Clock, Database, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { formatDateTime } from "@/lib/utils";

interface LogEntry {
  id: string;
  action: string;
  timestamp: string;
  user: { name: string };
}

export function SystemHealth() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [overview, setOverview] = useState<{ totalLearners: number; totalTutors: number; totalMaterials: number; totalAssessments: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uptime, setUptime] = useState("Checking...");
  const [dbStatus, setDbStatus] = useState<"ok" | "error" | "checking">("checking");

  useEffect(() => {
    const load = async () => {
      try {
        const [logsRes, overviewRes] = await Promise.all([
          fetch("/api/system-logs"),
          fetch("/api/analytics?type=overview"),
        ]);
        const [logsJson, overviewJson] = await Promise.all([logsRes.json(), overviewRes.json()]);
        setLogs(logsJson.data ?? []);
        setOverview(overviewJson.data);
        setDbStatus("ok");
        setUptime("Online");
      } catch {
        toast.error("Failed to load system health");
        setDbStatus("error");
        setUptime("Unknown");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Server Status"
          value={uptime}
          icon={Server}
          loading={loading}
          iconColour={uptime === "Online" ? "text-green-600" : "text-red-600"}
          iconBg={uptime === "Online" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}
        />
        <StatCard
          title="Database"
          value={dbStatus === "ok" ? "Connected" : "Error"}
          icon={Database}
          loading={loading}
          iconColour={dbStatus === "ok" ? "text-green-600" : "text-red-600"}
          iconBg={dbStatus === "ok" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}
        />
        <StatCard title="Total Learners" value={overview?.totalLearners ?? 0} icon={Activity} loading={loading} iconColour="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title="Learning Materials" value={overview?.totalMaterials ?? 0} icon={Clock} loading={loading} iconColour="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity logged yet.</p>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {formatDateTime(log.timestamp)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

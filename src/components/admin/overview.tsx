"use client";

import { Users, BookOpen, FileText, TrendingUp, Award, Activity } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface OverviewStats {
  totalLearners: number;
  totalTutors: number;
  totalAssessments: number;
  totalMaterials: number;
  averageScore: number;
  totalSubmissions: number;
  recentLogs: Array<{
    id: string;
    action: string;
    timestamp: Date;
    user: { name: string };
  }>;
}

export function AdminOverview({ stats }: { stats: OverviewStats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Learners"
          value={stats.totalLearners}
          description="Currently enrolled"
          icon={Users}
          iconColour="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Tutors"
          value={stats.totalTutors}
          description="Active staff members"
          icon={BookOpen}
          iconColour="text-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/30"
        />
        <StatCard
          title="Published Assessments"
          value={stats.totalAssessments}
          description="Available to learners"
          icon={FileText}
          iconColour="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          title="Learning Materials"
          value={stats.totalMaterials}
          description="Approved resources"
          icon={Activity}
          iconColour="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          title="Platform Average"
          value={`${stats.averageScore}%`}
          description="Across all assessments"
          icon={TrendingUp}
          iconColour="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          description="Assessments attempted"
          icon={Award}
          iconColour="text-rose-600"
          iconBg="bg-rose-100 dark:bg-rose-900/30"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                      <Activity className="h-3 w-3 text-primary" />
                    </div>
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

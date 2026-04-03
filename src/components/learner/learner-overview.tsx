"use client";

import Link from "next/link";
import { BookOpen, FileText, TrendingUp, Calendar, Megaphone } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculatePercentage, formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LearnerStats {
  enrollments: Array<{
    id: string;
    subject: { name: string; grade: { label: string } };
  }>;
  recentSubmissions: Array<{
    id: string;
    score: number | null;
    submittedAt: Date;
    assessment: { title: string; totalMarks: number; type: string };
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    type: string;
    startTime: Date;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    author: { name: string };
  }>;
  averageScore: number;
  totalSubmissions: number;
}

const eventTypeColour: Record<string, string> = {
  CLASS: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  TEST: "text-red-600 bg-red-50 dark:bg-red-900/20",
  APPOINTMENT: "text-green-600 bg-green-50 dark:bg-green-900/20",
};

export function LearnerOverview({ stats }: { stats: LearnerStats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={TrendingUp}
          iconColour={stats.averageScore >= 50 ? "text-green-600" : "text-red-600"}
          iconBg={stats.averageScore >= 50 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}
        />
        <StatCard title="Subjects Enrolled" value={stats.enrollments.length} icon={BookOpen} iconColour="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title="Tests Submitted" value={stats.totalSubmissions} icon={FileText} iconColour="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" />
        <StatCard title="Upcoming Events" value={stats.upcomingEvents.length} icon={Calendar} iconColour="text-teal-600" iconBg="bg-teal-100 dark:bg-teal-900/30" />
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Overall Performance</p>
            <p className="text-sm font-bold">{stats.averageScore}%</p>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={cn("h-3 rounded-full transition-all duration-500",
                stats.averageScore >= 80 ? "bg-green-500" :
                stats.averageScore >= 60 ? "bg-blue-500" :
                stats.averageScore >= 50 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${stats.averageScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className="text-amber-600 font-medium">Pass: 50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSubmissions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
                <Link href="/learner/tests" className="text-sm text-primary hover:underline mt-1 block">
                  Take your first test →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentSubmissions.map((s) => {
                  const pct = s.score !== null ? calculatePercentage(s.score, s.assessment.totalMarks) : null;
                  return (
                    <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{s.assessment.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(s.submittedAt)}</p>
                      </div>
                      {pct !== null ? (
                        <Badge variant={pct >= 50 ? "success" : "destructive"} className="text-xs">
                          {s.score}/{s.assessment.totalMarks} ({pct}%)
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">Awaiting grade</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
            ) : (
              <div className="space-y-2">
                {stats.upcomingEvents.map((e) => (
                  <div key={e.id} className={cn("flex items-center gap-3 rounded-lg p-3", eventTypeColour[e.type])}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{e.title}</p>
                      <p className="text-xs opacity-80">{formatDateTime(e.startTime)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{e.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {stats.announcements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.announcements.map((a) => (
                <div key={a.id} className="p-3 border rounded-lg">
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {a.author.name} · {formatDate(a.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

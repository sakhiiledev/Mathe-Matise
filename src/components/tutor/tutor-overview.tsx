"use client";

import { Users, FileText, ClipboardCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface TutorStats {
  totalLearners: number;
  totalAssessments: number;
  pendingGrading: number;
  averageScore: number;
  pendingSubmissions: Array<{
    id: string;
    submittedAt: Date;
    learner: { name: string };
    assessment: { title: string };
  }>;
  atRisk: Array<{ id: string; name: string; average: number }>;
  assignments: Array<{
    id: string;
    subject: { name: string };
    grade: { label: string };
  }>;
}

export function TutorOverview({ stats }: { stats: TutorStats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Learners" value={stats.totalLearners} icon={Users} iconColour="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title="Assessments" value={stats.totalAssessments} icon={FileText} iconColour="text-teal-600" iconBg="bg-teal-100 dark:bg-teal-900/30" />
        <StatCard title="Pending Grading" value={stats.pendingGrading} icon={ClipboardCheck} iconColour={stats.pendingGrading > 0 ? "text-amber-600" : "text-green-600"} iconBg={stats.pendingGrading > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"} />
        <StatCard title="Class Average" value={`${stats.averageScore}%`} icon={TrendingUp} iconColour="text-purple-600" iconBg="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Awaiting Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pendingSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All submissions are graded.</p>
            ) : (
              <div className="space-y-3">
                {stats.pendingSubmissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{s.learner.name}</p>
                      <p className="text-xs text-muted-foreground">{s.assessment.title}</p>
                    </div>
                    <Badge variant="warning" className="text-xs">{formatDateTime(s.submittedAt)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              At Risk ({stats.atRisk.length} learners)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.atRisk.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No learners currently at risk.</p>
            ) : (
              <div className="space-y-2">
                {stats.atRisk.map((learner) => (
                  <div key={learner.id} className="flex items-center justify-between border rounded-lg p-3">
                    <p className="text-sm font-medium">{learner.name}</p>
                    <Badge variant="destructive" className="text-xs">{learner.average}% avg.</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.assignments.map((a) => (
              <Badge key={a.id} variant="secondary" className="text-xs px-3 py-1">
                {a.grade.label} — {a.subject.name}
              </Badge>
            ))}
            {stats.assignments.length === 0 && (
              <p className="text-sm text-muted-foreground">No grade/subject assignments yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

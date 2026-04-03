"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { TrendingUp, Users, BarChart3, Award } from "lucide-react";

interface OverviewStats {
  totalLearners: number;
  totalTutors: number;
  totalAssessments: number;
  totalMaterials: number;
  averageScore: number;
  passRate: number;
  totalSubmissions: number;
}

interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  gradeLabel: string;
  averageScore: number;
  submissionCount: number;
  passRate: number;
}

interface TutorActivity {
  tutorId: string;
  tutorName: string;
  materialsUploaded: number;
  assessmentsCreated: number;
  submissionsGraded: number;
}

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [performance, setPerformance] = useState<SubjectPerformance[]>([]);
  const [tutorActivity, setTutorActivity] = useState<TutorActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [overviewRes, performanceRes, tutorRes] = await Promise.all([
          fetch("/api/analytics?type=overview"),
          fetch("/api/analytics?type=performance"),
          fetch("/api/analytics?type=tutor-activity"),
        ]);
        const [overviewJson, performanceJson, tutorJson] = await Promise.all([
          overviewRes.json(),
          performanceRes.json(),
          tutorRes.json(),
        ]);
        setOverview(overviewJson.data);
        setPerformance(performanceJson.data ?? []);
        setTutorActivity(tutorJson.data ?? []);
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const mathsData = performance.filter((p) => p.subjectName === "Mathematics");
  const scienceData = performance.filter((p) => p.subjectName === "Physical Sciences");

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pass Rate" value={`${overview?.passRate ?? 0}%`} icon={Award} loading={loading} iconColour="text-green-600" iconBg="bg-green-100 dark:bg-green-900/30" />
        <StatCard title="Avg. Score" value={`${overview?.averageScore ?? 0}%`} icon={TrendingUp} loading={loading} iconColour="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title="Total Submissions" value={overview?.totalSubmissions ?? 0} icon={BarChart3} loading={loading} iconColour="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" />
        <StatCard title="Active Learners" value={overview?.totalLearners ?? 0} icon={Users} loading={loading} iconColour="text-purple-600" iconBg="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Performance by grade */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mathematics — Average Score by Grade</CardTitle>
            <CardDescription>Across all assessments and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mathsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="gradeLabel" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Average Score"]} />
                  <Bar dataKey="averageScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Physical Sciences — Average Score by Grade</CardTitle>
            <CardDescription>Across all assessments and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scienceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="gradeLabel" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Average Score"]} />
                  <Bar dataKey="averageScore" fill="hsl(45 100% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pass rate comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pass Rate by Subject & Grade</CardTitle>
          <CardDescription>Percentage of learners achieving 50% or above</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((grade) => ({
                  grade,
                  Mathematics: mathsData.find((d) => d.gradeLabel === grade)?.passRate ?? 0,
                  "Physical Sciences": scienceData.find((d) => d.gradeLabel === grade)?.passRate ?? 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Legend />
                <Line type="monotone" dataKey="Mathematics" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Physical Sciences" stroke="hsl(45 100% 51%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tutor activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutor Activity</CardTitle>
          <CardDescription>Materials uploaded, assessments created, and submissions graded</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {tutorActivity.map((tutor) => (
                <div key={tutor.tutorId} className="flex items-center justify-between p-3 rounded-lg border">
                  <p className="font-medium text-sm">{tutor.tutorName}</p>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Materials</p>
                      <p className="font-semibold text-sm">{tutor.materialsUploaded}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Assessments</p>
                      <p className="font-semibold text-sm">{tutor.assessmentsCreated}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Graded</p>
                      <p className="font-semibold text-sm">{tutor.submissionsGraded}</p>
                    </div>
                  </div>
                </div>
              ))}
              {tutorActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No activity data yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

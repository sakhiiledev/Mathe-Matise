"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, BookOpen, Calendar } from "lucide-react";

interface Grade { id: string; label: string; order: number; subjects: { id: string; name: string }[] }

export function AdminSettings() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [gradesRes] = await Promise.all([
          fetch("/api/grades?withSubjects=true"),
        ]);
        const [gradesJson] = await Promise.all([gradesRes.json()]);
        setGrades(gradesJson.data ?? []);
      } catch { toast.error("Failed to load settings"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Academic Year</CardTitle>
          </div>
          <CardDescription>Current academic year configuration</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-16 w-full" /> : (
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <p className="font-semibold">2025</p>
                <Badge variant="success">Current</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">15 January 2025 – 30 November 2025</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Grade & Subject Configuration</CardTitle>
          </div>
          <CardDescription>CAPS-aligned grades and subjects seeded from the database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => (
                <div key={grade.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{grade.label}</p>
                    <Badge variant="outline" className="text-xs">{grade.subjects.length} subjects</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {grade.subjects.map((s) => (
                      <div key={s.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Platform Name</span>
            <span className="font-medium">Mathe-Matise</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Curriculum Standard</span>
            <span className="font-medium">CAPS (South Africa)</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Supported Grades</span>
            <span className="font-medium">Grade 8 – Grade 12</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subjects</span>
            <span className="font-medium">Mathematics, Physical Sciences</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

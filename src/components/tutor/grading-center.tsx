"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getInitials, calculatePercentage } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface Submission {
  id: string;
  answers: Record<string, string>;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  submittedAt: string;
  learner: { id: string; name: string; email: string; avatarUrl: string | null };
  assessment: {
    title: string;
    totalMarks: number;
    type: string;
    subject: { name: string };
    grade: { label: string };
  };
}

const GradeSchema = z.object({
  score: z.number().min(0, "Score must be 0 or above"),
  feedback: z.string().optional(),
});

type GradeForm = z.infer<typeof GradeSchema>;

export function GradingCenter() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<GradeForm>({ resolver: zodResolver(GradeSchema) });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions?pageSize=100");
      const json = await res.json();
      // Show only ungraded first
      const sorted = (json.data ?? []).sort((a: Submission) =>
        a.score === null ? -1 : 1
      );
      setSubmissions(sorted);
    } catch { toast.error("Failed to load submissions"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const onGrade = async (data: GradeForm) => {
    if (!selected) return;
    if (data.score > selected.assessment.totalMarks) {
      toast.error(`Score cannot exceed ${selected.assessment.totalMarks}`);
      return;
    }
    const res = await fetch(`/api/submissions/${selected.id}/grade`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("Submission graded successfully");
    setSelected(null);
    reset();
    fetchSubmissions();
  };

  const pending = submissions.filter((s) => s.score === null);
  const graded = submissions.filter((s) => s.score !== null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Pending Grading ({pending.length})
        </h3>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : pending.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30">
            <CheckCircle className="h-4 w-4 text-green-600" />
            All submissions are graded.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => { setSelected(s); reset(); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={s.learner.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(s.learner.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.learner.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.assessment.title}</p>
                      <p className="text-xs text-muted-foreground">{s.assessment.grade.label} · {s.assessment.subject.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Submitted {formatDate(s.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="warning" className="text-xs">Awaiting Grade</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {graded.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Graded ({graded.length})</h3>
          <div className="space-y-2">
            {graded.map((s) => (
              <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{getInitials(s.learner.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{s.learner.name}</p>
                    <p className="text-xs text-muted-foreground">{s.assessment.title}</p>
                  </div>
                </div>
                <Badge variant={calculatePercentage(s.score!, s.assessment.totalMarks) >= 50 ? "success" : "destructive"} className="text-xs">
                  {s.score}/{s.assessment.totalMarks} ({calculatePercentage(s.score!, s.assessment.totalMarks)}%)
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); reset(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {selected?.learner.name} — {selected?.assessment.title}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">{selected.assessment.grade.label} · {selected.assessment.subject.name}</p>
                <p className="text-muted-foreground">Total Marks: {selected.assessment.totalMarks}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Learner Answers</p>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {Object.entries(selected.answers).map(([questionId, answer]) => (
                    <div key={questionId} className="text-sm">
                      <p className="text-xs text-muted-foreground">Q: {questionId}</p>
                      <p className="mt-0.5 p-2 bg-background border rounded text-sm">{answer || "(no answer)"}</p>
                    </div>
                  ))}
                  {Object.keys(selected.answers).length === 0 && (
                    <p className="text-sm text-muted-foreground">No answers recorded</p>
                  )}
                </div>
              </div>

              <Separator />

              <form onSubmit={handleSubmit(onGrade)} className="space-y-3">
                <div className="space-y-2">
                  <Label>Score (out of {selected.assessment.totalMarks})</Label>
                  <Input type="number" min={0} max={selected.assessment.totalMarks} placeholder="Enter score" {...register("score", { valueAsNumber: true })} />
                  {errors.score && <p className="text-xs text-destructive">{errors.score.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Feedback (optional)</Label>
                  <Textarea placeholder="Write feedback for the learner..." rows={3} {...register("feedback")} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setSelected(null); reset(); }}>Cancel</Button>
                  <Button type="submit" loading={isSubmitting}>Submit Grade</Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

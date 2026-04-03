"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { calculatePercentage, formatDate } from "@/lib/utils";

interface Question {
  id: string;
  questionText: string;
  type: "MCQ" | "SHORT" | "LONG";
  options?: string[];
  marks: number;
  order: number;
}

interface Assessment {
  id: string;
  title: string;
  type: "QUIZ" | "TEST";
  totalMarks: number;
  dueDate: string | null;
  subject: { name: string };
  grade: { label: string };
  _count: { questions: number };
}

interface AssessmentDetail extends Assessment {
  questions: Question[];
}

interface Submission {
  id: string;
  assessmentId: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  assessment: { totalMarks: number; title: string };
}

export function LearnerTests() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState<{ score: number | null; totalMarks: number; title: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assessRes, subRes] = await Promise.all([
        fetch("/api/assessments?pageSize=100"),
        fetch("/api/submissions?pageSize=100"),
      ]);
      const [assessJson, subJson] = await Promise.all([assessRes.json(), subRes.json()]);
      setAssessments(assessJson.data ?? []);
      setSubmissions(subJson.data ?? []);
    } catch { toast.error("Failed to load tests"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAssessment = async (id: string) => {
    const res = await fetch(`/api/assessments/${id}`);
    const json = await res.json();
    if (!res.ok) { toast.error("Failed to load assessment"); return; }
    setSelectedAssessment(json.data);
    setAnswers({});
  };

  const submitAssessment = async () => {
    if (!selectedAssessment) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: selectedAssessment.id, answers }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success("Assessment submitted!");
      setResult({
        score: json.data.score,
        totalMarks: selectedAssessment.totalMarks,
        title: selectedAssessment.title,
      });
      setSelectedAssessment(null);
      setResultOpen(true);
      fetchData();
    } finally { setSubmitting(false); }
  };

  const getSubmission = (assessmentId: string) =>
    submissions.find((s) => s.assessmentId === assessmentId);

  const pending = assessments.filter((a) => !getSubmission(a.id));
  const completed = assessments.filter((a) => !!getSubmission(a.id));

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Available ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
                No assessments available at the moment.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((a) => (
                  <Card key={a.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => openAssessment(a.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm">{a.title}</p>
                        <Badge variant={a.type === "QUIZ" ? "default" : "secondary"} className="text-xs shrink-0">{a.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.grade.label} · {a.subject.name}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{a._count.questions} questions</span>
                        <span>{a.totalMarks} marks</span>
                        {a.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {formatDate(a.dueDate)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Completed ({completed.length})</h3>
              <div className="space-y-2">
                {completed.map((a) => {
                  const sub = getSubmission(a.id)!;
                  const pct = sub.score !== null ? calculatePercentage(sub.score, a.totalMarks) : null;
                  return (
                    <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.grade.label} · {a.subject.name}</p>
                          {sub.feedback && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">&ldquo;{sub.feedback}&rdquo;</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {pct !== null ? (
                          <Badge variant={pct >= 50 ? "success" : "destructive"} className="text-xs">
                            {sub.score}/{a.totalMarks} ({pct}%)
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Awaiting grade</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Assessment dialog */}
      <Dialog open={!!selectedAssessment} onOpenChange={(o) => { if (!o) { setSelectedAssessment(null); setAnswers({}); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAssessment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAssessment?.grade.label} · {selectedAssessment?.subject.name} · {selectedAssessment?.totalMarks} marks
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-5">
              {selectedAssessment.questions.map((q, i) => (
                <div key={q.id} className="space-y-3">
                  {i > 0 && <Separator />}
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q.questionText}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {q.type === "MCQ" && q.options && (
                    <RadioGroup
                      onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                      className="ml-7"
                    >
                      {q.options.filter(Boolean).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <RadioGroupItem value={opt} id={`${q.id}-${oi}`} />
                          <Label htmlFor={`${q.id}-${oi}`} className="text-sm cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {(q.type === "SHORT" || q.type === "LONG") && (
                    <Textarea
                      placeholder="Type your answer here..."
                      rows={q.type === "LONG" ? 4 : 2}
                      className="ml-7 w-[calc(100%-1.75rem)]"
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setSelectedAssessment(null); setAnswers({}); }}>Cancel</Button>
            <Button onClick={submitAssessment} loading={submitting}>Submit Assessment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Assessment Submitted</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <p className="font-semibold">{result.title}</p>
              {result.score !== null ? (
                <>
                  <p className="text-3xl font-bold">
                    {result.score}/{result.totalMarks}
                  </p>
                  <Badge
                    variant={calculatePercentage(result.score, result.totalMarks) >= 50 ? "success" : "destructive"}
                    className="text-sm px-3 py-1"
                  >
                    {calculatePercentage(result.score, result.totalMarks)}%
                  </Badge>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Your submission is awaiting manual grading.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button className="w-full" onClick={() => setResultOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

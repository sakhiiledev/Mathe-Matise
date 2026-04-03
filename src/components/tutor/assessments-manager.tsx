"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreHorizontal, Eye, EyeOff, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

interface Grade { id: string; label: string }
interface Subject { id: string; name: string; gradeId: string }
interface Assessment {
  id: string;
  title: string;
  type: "QUIZ" | "TEST";
  isPublished: boolean;
  totalMarks: number;
  dueDate: string | null;
  createdAt: string;
  subject: { name: string };
  grade: { label: string };
  _count: { questions: number; submissions: number };
}

const QuestionSchema = z.object({
  questionText: z.string().min(1, "Question required"),
  type: z.enum(["MCQ", "SHORT", "LONG"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  marks: z.coerce.number().min(1),
});

const AssessmentSchema = z.object({
  title: z.string().min(2, "Title required"),
  type: z.enum(["QUIZ", "TEST"]),
  gradeId: z.string().min(1, "Grade required"),
  subjectId: z.string().min(1, "Subject required"),
  dueDate: z.string().optional(),
  totalMarks: z.coerce.number().min(1, "Total marks required"),
  questions: z.array(QuestionSchema).optional(),
});

type FormData = z.infer<typeof AssessmentSchema>;

export function AssessmentsManager() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");

  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(AssessmentSchema),
      defaultValues: { questions: [] },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "questions" });

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assessments?pageSize=100");
      const json = await res.json();
      setAssessments(json.data ?? []);
    } catch { toast.error("Failed to load assessments"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAssessments();
    fetch("/api/grades").then((r) => r.json()).then((j) => setGrades(j.data ?? []));
  }, [fetchAssessments]);

  useEffect(() => {
    if (!selectedGrade) return;
    fetch(`/api/subjects?gradeId=${selectedGrade}`).then((r) => r.json()).then((j) => setSubjects(j.data ?? []));
  }, [selectedGrade]);

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        questions: data.questions?.map((q) => ({
          ...q,
          options: q.type === "MCQ" ? q.options?.filter(Boolean) : undefined,
        })),
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("Assessment created");
    setOpen(false);
    reset();
    fetchAssessments();
  };

  const togglePublish = async (a: Assessment) => {
    const res = await fetch(`/api/assessments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !a.isPublished }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success(`Assessment ${a.isPublished ? "unpublished" : "published"}`);
    fetchAssessments();
  };

  const deleteAssessment = async (id: string) => {
    const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    toast.success("Assessment deleted");
    fetchAssessments();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Assessment
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No assessments created yet.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.grade.label} — {a.subject.name}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => togglePublish(a)}>
                        {a.isPublished ? <><EyeOff className="mr-2 h-4 w-4" />Unpublish</> : <><Eye className="mr-2 h-4 w-4" />Publish</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteAssessment(a.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={a.type === "QUIZ" ? "default" : "secondary"} className="text-xs">{a.type}</Badge>
                  <Badge variant={a.isPublished ? "success" : "warning"} className="text-xs">
                    {a.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a._count.questions} questions · {a.totalMarks} marks</span>
                  <span>{a._count.submissions} submissions</span>
                </div>
                {a.dueDate && (
                  <p className="text-xs text-muted-foreground mt-1">Due: {formatDate(a.dueDate)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Assessment</DialogTitle>
            <DialogDescription>Set up a quiz or test with questions for your learners.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Assessment title" {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select onValueChange={(v) => setValue("type", v as "QUIZ" | "TEST")}>
                  <SelectTrigger><SelectValue placeholder="Quiz or Test" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="TEST">Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select onValueChange={(v) => { setSelectedGrade(v); setValue("gradeId", v); }}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select onValueChange={(v) => setValue("subjectId", v)} disabled={!selectedGrade}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input type="number" min={1} placeholder="e.g. 50" {...register("totalMarks")} />
                {errors.totalMarks && <p className="text-xs text-destructive">{errors.totalMarks.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Due Date (optional)</Label>
                <Input type="datetime-local" {...register("dueDate")} />
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Questions ({fields.length})</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ questionText: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "", marks: 2 })}
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> Add Question
                </Button>
              </div>
              {fields.map((field, index) => (
                <Card key={field.id} className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Question {index + 1}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <Textarea placeholder="Question text..." rows={2} {...register(`questions.${index}.questionText`)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select defaultValue="MCQ" onValueChange={(v) => setValue(`questions.${index}.type`, v as "MCQ" | "SHORT" | "LONG")}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MCQ">MCQ</SelectItem>
                        <SelectItem value="SHORT">Short Answer</SelectItem>
                        <SelectItem value="LONG">Long Answer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" min={1} placeholder="Marks" className="h-8 text-xs" {...register(`questions.${index}.marks`)} />
                  </div>
                  {watch(`questions.${index}.type`) === "MCQ" && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Options (enter 4 options):</p>
                      {[0, 1, 2, 3].map((optIdx) => (
                        <Input key={optIdx} placeholder={`Option ${optIdx + 1}`} className="h-8 text-xs" {...register(`questions.${index}.options.${optIdx}`)} />
                      ))}
                      <Input placeholder="Correct answer (must match one option exactly)" className="h-8 text-xs border-green-500" {...register(`questions.${index}.correctAnswer`)} />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Create Assessment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

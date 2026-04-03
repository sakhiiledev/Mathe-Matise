"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Upload, FileText, Video, File, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface Grade { id: string; label: string }
interface Subject { id: string; name: string; gradeId: string }
interface CapsTopic { id: string; title: string; term: number }
interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  type: "VIDEO" | "PDF" | "DOCUMENT";
  createdAt: string;
  subject: { name: string };
  grade: { label: string };
  capsTopic: { title: string } | null;
}

const Schema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "PDF", "DOCUMENT"]),
  gradeId: z.string().min(1, "Grade required"),
  subjectId: z.string().min(1, "Subject required"),
  capsTopicId: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

const typeIconMap = { VIDEO: Video, PDF: FileText, DOCUMENT: File };
const typeBadge: Record<string, "default" | "secondary" | "outline"> = {
  VIDEO: "default", PDF: "secondary", DOCUMENT: "outline",
};

export function LearningMaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<CapsTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(Schema) });

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials?pageSize=100");
      const json = await res.json();
      setMaterials(json.data ?? []);
    } catch { toast.error("Failed to load materials"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMaterials();
    fetch("/api/grades").then((r) => r.json()).then((j) => setGrades(j.data ?? []));
  }, [fetchMaterials]);

  useEffect(() => {
    if (!selectedGrade) return;
    fetch(`/api/subjects?gradeId=${selectedGrade}`)
      .then((r) => r.json())
      .then((j) => setSubjects(j.data ?? []));
  }, [selectedGrade]);

  useEffect(() => {
    if (!selectedSubject) return;
    fetch(`/api/caps-topics?subjectId=${selectedSubject}`)
      .then((r) => r.json())
      .then((j) => setTopics(j.data ?? []));
  }, [selectedSubject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Upload failed"); return; }
      setFileUrl(json.data.url);
      toast.success("File uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const onSubmit = async (data: FormData) => {
    if (!fileUrl) { toast.error("Please upload a file first"); return; }
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, fileUrl }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("Material uploaded successfully");
    setOpen(false);
    reset();
    setFileUrl("");
    fetchMaterials();
  };

  const deleteMaterial = async (id: string) => {
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    toast.success("Material deleted");
    fetchMaterials();
  };

  const grouped = materials.reduce<Record<string, Material[]>>((acc, m) => {
    const key = `${m.grade.label} — ${m.subject.name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Upload Material
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No materials uploaded yet.</div>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 mt-4">{group}</h3>
            <div className="space-y-2">
              {items.map((m) => {
                const Icon = typeIconMap[m.type];
                return (
                  <Card key={m.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{m.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {m.capsTopic && (
                              <span className="text-xs text-muted-foreground truncate">{m.capsTopic.title}</span>
                            )}
                            <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={typeBadge[m.type]} className="text-xs">{m.type}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">View File</a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMaterial(m.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Learning Material</DialogTitle>
            <DialogDescription>Upload a PDF, video, or document for your learners.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. Grade 10 Algebra Notes" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea placeholder="Brief description of this material..." rows={2} {...register("description")} />
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
                {errors.gradeId && <p className="text-xs text-destructive">{errors.gradeId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select onValueChange={(v) => { setSelectedSubject(v); setValue("subjectId", v); }} disabled={!selectedGrade}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>CAPS Topic (optional)</Label>
                <Select onValueChange={(v) => setValue("capsTopicId", v)} disabled={!selectedSubject}>
                  <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => <SelectItem key={t.id} value={t.id}>Term {t.term}: {t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select onValueChange={(v) => setValue("type", v as "VIDEO" | "PDF" | "DOCUMENT")}>
                  <SelectTrigger><SelectValue placeholder="File type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>File Upload</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {fileUrl ? (
                  <p className="text-sm text-green-600 font-medium">File uploaded successfully</p>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">PDF, Video, or Document (max 50MB)</p>
                  </>
                )}
                <input type="file" className="mt-2 text-sm" accept=".pdf,.mp4,.webm,.doc,.docx,.ppt,.pptx" onChange={handleFileUpload} />
              </div>
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); setFileUrl(""); }}>Cancel</Button>
              <Button type="submit" loading={isSubmitting || uploading}>Upload Material</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

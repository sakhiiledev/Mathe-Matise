"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Megaphone } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target: string;
  isActive: boolean;
  createdAt: string;
  author: { name: string };
}

const Schema = z.object({
  title: z.string().min(2, "Title required"),
  content: z.string().min(1, "Content required"),
  target: z.enum(["ALL", "ADMIN", "TUTOR", "LEARNER"]),
});

type FormData = z.infer<typeof Schema>;

const targetColour: Record<string, "default" | "secondary" | "outline" | "info"> = {
  ALL: "default",
  ADMIN: "secondary",
  TUTOR: "info",
  LEARNER: "outline",
};

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(Schema), defaultValues: { target: "ALL" } });

  const fetch_ = async () => {
    try {
      const res = await fetch("/api/announcements");
      const json = await res.json();
      setAnnouncements(json.data ?? []);
    } catch { toast.error("Failed to load announcements"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("Announcement posted");
    setOpen(false);
    reset();
    fetch_();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Announcement
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-lg border animate-pulse bg-muted" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No announcements posted yet.</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                      <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{a.title}</p>
                        <Badge variant={targetColour[a.target] as "default" | "secondary" | "outline"} className="text-xs">
                          {a.target}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Posted by {a.author.name} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Post an announcement visible to specific roles or all users.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Announcement title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea placeholder="Write your announcement..." rows={4} {...register("content")} />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select defaultValue="ALL" onValueChange={(v) => setValue("target", v as "ALL" | "ADMIN" | "TUTOR" | "LEARNER")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="LEARNER">Learners Only</SelectItem>
                  <SelectItem value="TUTOR">Tutors Only</SelectItem>
                  <SelectItem value="ADMIN">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Post Announcement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

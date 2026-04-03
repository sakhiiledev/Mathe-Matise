"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, CalendarClock } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/utils";

interface Learner { id: string; name: string }
interface Event {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  attendees: Array<{ user: { id: string; name: string } }>;
}

const Schema = z.object({
  title: z.string().min(2, "Title required"),
  attendeeId: z.string().min(1, "Learner required"),
  startTime: z.string().min(1, "Start required"),
  endTime: z.string().min(1, "End required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

export default function TutorAppointmentsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(Schema) });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const json = await res.json();
      setEvents((json.data ?? []).filter((e: Event) => e.type === "APPOINTMENT"));
    } catch { toast.error("Failed to load appointments"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetch("/api/users?role=LEARNER&pageSize=100").then((r) => r.json()).then((j) =>
      setLearners((j.data ?? []).map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })))
    );
  }, [fetchEvents]);

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        type: "APPOINTMENT",
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        notes: data.notes,
        attendeeIds: [data.attendeeId],
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("Appointment scheduled");
    setOpen(false);
    reset();
    fetchEvents();
  };

  return (
    <div>
      <PageHeader title="Appointments" description="Schedule 1-on-1 sessions with specific learners." />
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Schedule Appointment
          </Button>
        </div>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No appointments scheduled.</div>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 shrink-0">
                    <CalendarClock className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.startTime)} – {formatDateTime(e.endTime)}</p>
                    {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
                  </div>
                  <div className="shrink-0">
                    {e.attendees.map((a) => (
                      <Badge key={a.user.id} variant="outline" className="text-xs">{a.user.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>Book a 1-on-1 session with a learner.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Topic / Title</Label>
              <Input placeholder="e.g. Revision session" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Learner</Label>
              <Select onValueChange={(v) => setValue("attendeeId", v)}>
                <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
                <SelectContent>
                  {learners.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.attendeeId && <p className="text-xs text-destructive">{errors.attendeeId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="datetime-local" {...register("startTime")} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="datetime-local" {...register("endTime")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="What will be covered..." rows={2} {...register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

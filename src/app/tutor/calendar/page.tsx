"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarView } from "@/components/shared/calendar-view";
import { PageHeader } from "@/components/layout/page-header";

const Schema = z.object({
  title: z.string().min(2, "Title required"),
  type: z.enum(["CLASS", "TEST", "APPOINTMENT"]),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

export default function TutorCalendarPage() {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("Event created");
    setOpen(false);
    reset();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      <PageHeader title="Calendar" description="Manage your schedule, classes, and appointments." />
      <CalendarView key={refreshKey} canCreate onCreateClick={() => setOpen(true)} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Add a class, test date, or appointment to the calendar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input placeholder="e.g. Grade 10 Maths Class" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select onValueChange={(v) => setValue("type", v as "CLASS" | "TEST" | "APPOINTMENT")}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLASS">Class</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                  <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
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
              <Textarea placeholder="Additional details..." rows={2} {...register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Create Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

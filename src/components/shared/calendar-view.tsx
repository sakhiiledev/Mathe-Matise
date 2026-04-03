"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  type: "CLASS" | "TEST" | "APPOINTMENT";
  startTime: string;
  endTime: string;
  notes: string | null;
  creator: { name: string };
}

const eventTypeColour: Record<string, string> = {
  CLASS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  TEST: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  APPOINTMENT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
};

interface CalendarViewProps {
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function CalendarView({ canCreate = false, onCreateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = startOfMonth(currentMonth).toISOString();
      const to = endOfMonth(currentMonth).toISOString();
      const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
      const json = await res.json();
      setEvents(json.data ?? []);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  }, [currentMonth]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getEventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.startTime), date));

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold w-40 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {canCreate && (
          <Button onClick={onCreateClick} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dayEvents = getEventsForDay(d);
            const isSelected = selectedDate && isSameDay(d, selectedDate);
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(isSameDay(d, selectedDate ?? new Date(0)) ? null : d)}
                className={cn(
                  "min-h-[80px] p-1.5 border-b border-r text-left transition-colors",
                  !isSameMonth(d, currentMonth) && "opacity-30",
                  isToday(d) && "bg-primary/5",
                  isSelected && "bg-primary/10",
                  "hover:bg-muted/50"
                )}
              >
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday(d) && "bg-primary text-primary-foreground",
                )}>
                  {format(d, "d")}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div key={e.id} className={cn("text-xs rounded px-1 py-0.5 truncate", eventTypeColour[e.type])}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedEvents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{format(selectedDate, "EEEE, d MMMM yyyy")}</h3>
          {selectedEvents.map((e) => (
            <div key={e.id} className={cn("rounded-lg p-3 text-sm", eventTypeColour[e.type])}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{e.title}</p>
                <Badge className={cn("text-xs", eventTypeColour[e.type])}>{e.type}</Badge>
              </div>
              <p className="text-xs mt-1">
                {format(new Date(e.startTime), "HH:mm")} – {format(new Date(e.endTime), "HH:mm")}
              </p>
              {e.notes && <p className="text-xs mt-1 opacity-80">{e.notes}</p>}
              <p className="text-xs mt-1 opacity-70">Created by {e.creator.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

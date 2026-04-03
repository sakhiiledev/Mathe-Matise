"use client";

import { Sidebar } from "@/components/layout/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardCheck,
  Calendar,
  CalendarClock,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/tutor", icon: LayoutDashboard },
  { label: "Learning Materials", href: "/tutor/learning", icon: BookOpen },
  { label: "Assessments", href: "/tutor/assessments", icon: FileText },
  { label: "Grading", href: "/tutor/grading", icon: ClipboardCheck },
  { label: "Calendar", href: "/tutor/calendar", icon: Calendar },
  { label: "Appointments", href: "/tutor/appointments", icon: CalendarClock },
  { label: "Messages", href: "/tutor/messages", icon: MessageSquare },
];

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar navItems={navItems} portalLabel="Tutor Portal" />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

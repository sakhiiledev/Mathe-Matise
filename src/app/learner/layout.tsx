"use client";

import { Sidebar } from "@/components/layout/sidebar";
import {
  LayoutDashboard,
  User,
  FileText,
  BookOpen,
  MessageSquare,
  Calendar,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/learner", icon: LayoutDashboard },
  { label: "Profile", href: "/learner/profile", icon: User },
  { label: "Tests & Quizzes", href: "/learner/tests", icon: FileText },
  { label: "Learning", href: "/learner/learning", icon: BookOpen },
  { label: "Messages", href: "/learner/messages", icon: MessageSquare },
  { label: "Calendar", href: "/learner/calendar", icon: Calendar },
];

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar navItems={navItems} portalLabel="Learner Portal" />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

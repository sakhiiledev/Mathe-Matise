import { PageHeader } from "@/components/layout/page-header";
import { CalendarView } from "@/components/shared/calendar-view";

export const metadata = { title: "Calendar" };

export default function LearnerCalendarPage() {
  return (
    <div>
      <PageHeader title="Calendar" description="View your upcoming classes, tests, and appointments." />
      <CalendarView canCreate={false} />
    </div>
  );
}

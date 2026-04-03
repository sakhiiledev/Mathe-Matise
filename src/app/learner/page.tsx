import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { LearnerOverview } from "@/components/learner/learner-overview";

export const metadata = { title: "My Dashboard" };

async function getLearnerStats(learnerId: string) {
  const [enrollments, submissions, upcomingEvents, announcements] = await Promise.all([
    prisma.enrollment.findMany({
      where: { learnerId },
      include: { subject: { include: { grade: true } } },
    }),
    prisma.submission.findMany({
      where: { learnerId, score: { not: null } },
      include: { assessment: { select: { totalMarks: true, title: true, type: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.calendarEvent.findMany({
      where: {
        OR: [
          { attendees: { some: { userId: learnerId } } },
          { createdBy: learnerId },
        ],
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: "asc" },
      take: 3,
    }),
    prisma.announcement.findMany({
      where: { isActive: true, target: { in: ["ALL", "LEARNER"] } },
      orderBy: { createdAt: "desc" },
      take: 2,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const gradedSubmissions = submissions.filter((s) => s.score !== null);
  const averageScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score! / s.assessment.totalMarks) * 100, 0) /
        gradedSubmissions.length
      : 0;

  return {
    enrollments,
    recentSubmissions: submissions,
    upcomingEvents,
    announcements,
    averageScore: Math.round(averageScore),
    totalSubmissions: submissions.length,
  };
}

export default async function LearnerPage() {
  const session = await getServerSession(authOptions);
  const stats = await getLearnerStats(session!.user.id);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session?.user.name?.split(" ")[0]}`}
        description="Here's your learning progress overview."
      />
      <LearnerOverview stats={stats} />
    </div>
  );
}

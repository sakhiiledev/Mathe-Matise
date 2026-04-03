import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { TutorOverview } from "@/components/tutor/tutor-overview";

export const metadata = { title: "Tutor Overview" };

async function getTutorStats(tutorId: string) {
  const assignments = await prisma.tutorAssignment.findMany({
    where: { tutorId },
    include: { subject: true, grade: true },
  });

  const subjectIds = assignments.map((a) => a.subjectId);

  const [enrollments, assessments, pendingSubmissions] = await Promise.all([
    prisma.enrollment.findMany({
      where: { subjectId: { in: subjectIds } },
      include: { learner: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      distinct: ["learnerId"],
    }),
    prisma.assessment.findMany({
      where: { createdBy: tutorId },
      include: { _count: { select: { submissions: true } } },
    }),
    prisma.submission.findMany({
      where: {
        assessment: { createdBy: tutorId },
        score: null,
      },
      include: {
        learner: { select: { name: true } },
        assessment: { select: { title: true } },
      },
      take: 5,
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  // At-risk learners (score < 50%)
  const submissionsWithScores = await prisma.submission.findMany({
    where: { assessment: { createdBy: tutorId }, score: { not: null } },
    include: {
      learner: { select: { id: true, name: true } },
      assessment: { select: { totalMarks: true } },
    },
  });

  const learnerScores: Record<string, { total: number; count: number; name: string }> = {};
  for (const s of submissionsWithScores) {
    if (!learnerScores[s.learnerId]) {
      learnerScores[s.learnerId] = { total: 0, count: 0, name: s.learner.name };
    }
    learnerScores[s.learnerId].total += (s.score! / s.assessment.totalMarks) * 100;
    learnerScores[s.learnerId].count += 1;
  }

  const atRisk = Object.entries(learnerScores)
    .filter(([, v]) => v.total / v.count < 50)
    .map(([id, v]) => ({ id, name: v.name, average: Math.round(v.total / v.count) }));

  return {
    assignments,
    totalLearners: enrollments.length,
    totalAssessments: assessments.length,
    pendingGrading: pendingSubmissions.length,
    pendingSubmissions,
    atRisk,
    averageScore:
      submissionsWithScores.length > 0
        ? Math.round(
            submissionsWithScores.reduce(
              (sum, s) => sum + (s.score! / s.assessment.totalMarks) * 100,
              0
            ) / submissionsWithScores.length
          )
        : 0,
  };
}

export default async function TutorPage() {
  const session = await getServerSession(authOptions);
  const stats = await getTutorStats(session!.user.id);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${session?.user.name?.split(" ")[0]}`}
        description="Here's your class performance overview."
      />
      <TutorOverview stats={stats} />
    </div>
  );
}

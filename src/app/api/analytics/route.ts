import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.ADMIN, Role.TUTOR]);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "overview";

    if (type === "overview") {
      const [totalLearners, totalTutors, totalAssessments, totalMaterials, submissions] =
        await prisma.$transaction([
          prisma.user.count({ where: { role: Role.LEARNER, isActive: true } }),
          prisma.user.count({ where: { role: Role.TUTOR, isActive: true } }),
          prisma.assessment.count({ where: { isPublished: true } }),
          prisma.learningMaterial.count({ where: { isApproved: true } }),
          prisma.submission.findMany({ select: { score: true, assessment: { select: { totalMarks: true } } } }),
        ]);

      const gradedSubmissions = submissions.filter((s) => s.score !== null);
      const averageScore =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, s) => {
              return sum + (s.score! / s.assessment.totalMarks) * 100;
            }, 0) / gradedSubmissions.length
          : 0;

      const passRate =
        gradedSubmissions.length > 0
          ? (gradedSubmissions.filter((s) => (s.score! / s.assessment.totalMarks) * 100 >= 50).length /
              gradedSubmissions.length) *
            100
          : 0;

      return NextResponse.json({
        data: {
          totalLearners,
          totalTutors,
          totalAssessments,
          totalMaterials,
          averageScore: Math.round(averageScore),
          passRate: Math.round(passRate),
          totalSubmissions: submissions.length,
        },
      });
    }

    if (type === "performance") {
      // Per-subject performance
      const subjects = await prisma.subject.findMany({
        include: { grade: true },
        orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
      });

      const performance = await Promise.all(
        subjects.map(async (subject) => {
          const assessments = await prisma.assessment.findMany({
            where: { subjectId: subject.id },
            select: { id: true, totalMarks: true },
          });

          const assessmentIds = assessments.map((a) => a.id);
          const submissions = await prisma.submission.findMany({
            where: { assessmentId: { in: assessmentIds }, score: { not: null } },
            select: { score: true, assessmentId: true },
          });

          const totalMarksByAssessment = Object.fromEntries(
            assessments.map((a) => [a.id, a.totalMarks])
          );

          const avg =
            submissions.length > 0
              ? submissions.reduce((sum, s) => {
                  return sum + (s.score! / totalMarksByAssessment[s.assessmentId]) * 100;
                }, 0) / submissions.length
              : 0;

          return {
            subjectId: subject.id,
            subjectName: subject.name,
            gradeLabel: subject.grade.label,
            averageScore: Math.round(avg),
            submissionCount: submissions.length,
            passRate: submissions.length > 0
              ? Math.round(
                  (submissions.filter((s) => (s.score! / totalMarksByAssessment[s.assessmentId]) * 100 >= 50).length /
                    submissions.length) * 100
                )
              : 0,
          };
        })
      );

      return NextResponse.json({ data: performance });
    }

    if (type === "learner-trends") {
      const learnerId = searchParams.get("learnerId");
      if (!learnerId) return NextResponse.json({ error: "learnerId required" }, { status: 400 });

      const submissions = await prisma.submission.findMany({
        where: { learnerId, score: { not: null } },
        orderBy: { submittedAt: "asc" },
        include: {
          assessment: {
            select: { title: true, totalMarks: true, subject: { select: { name: true } }, grade: { select: { label: true } } },
          },
        },
      });

      const trends = submissions.map((s) => ({
        date: s.submittedAt,
        title: s.assessment.title,
        subject: s.assessment.subject.name,
        grade: s.assessment.grade.label,
        score: s.score,
        totalMarks: s.assessment.totalMarks,
        percentage: Math.round((s.score! / s.assessment.totalMarks) * 100),
      }));

      return NextResponse.json({ data: trends });
    }

    if (type === "tutor-activity") {
      const tutors = await prisma.user.findMany({
        where: { role: Role.TUTOR },
        select: { id: true, name: true },
      });

      const activity = await Promise.all(
        tutors.map(async (tutor) => {
          const [materialsCount, assessmentsCount, gradedCount] = await prisma.$transaction([
            prisma.learningMaterial.count({ where: { uploadedBy: tutor.id } }),
            prisma.assessment.count({ where: { createdBy: tutor.id } }),
            prisma.submission.count({ where: { gradedBy: tutor.id } }),
          ]);

          return {
            tutorId: tutor.id,
            tutorName: tutor.name,
            materialsUploaded: materialsCount,
            assessmentsCreated: assessmentsCount,
            submissionsGraded: gradedCount,
          };
        })
      );

      return NextResponse.json({ data: activity });
    }

    return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 });
  } catch (err) {
    return handleError(err);
  }
}

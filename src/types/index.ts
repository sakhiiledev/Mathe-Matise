import {
  Role,
  MaterialType,
  AssessmentType,
  QuestionType,
  EventType,
  NotificationType,
  AnnouncementTarget,
} from "@prisma/client";

export type {
  Role,
  MaterialType,
  AssessmentType,
  QuestionType,
  EventType,
  NotificationType,
  AnnouncementTarget,
};

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserWithCounts {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  _count?: {
    enrollments?: number;
    tutorAssignments?: number;
    submissions?: number;
  };
}

export interface EnrollmentWithSubject {
  id: string;
  learnerId: string;
  enrolledAt: Date;
  subject: {
    id: string;
    name: string;
    grade: {
      id: string;
      label: string;
    };
  };
}

export interface AssessmentWithDetails {
  id: string;
  title: string;
  type: AssessmentType;
  totalMarks: number;
  isPublished: boolean;
  dueDate: Date | null;
  createdAt: Date;
  subject: { id: string; name: string };
  grade: { id: string; label: string };
  creator: { id: string; name: string };
  _count?: { questions: number; submissions: number };
}

export interface SubmissionWithDetails {
  id: string;
  assessmentId: string;
  learnerId: string;
  answers: Record<string, string>;
  score: number | null;
  feedback: string | null;
  submittedAt: Date;
  gradedAt: Date | null;
  learner: { id: string; name: string; email: string; avatarUrl: string | null };
  assessment: {
    title: string;
    totalMarks: number;
    type: AssessmentType;
    subject: { name: string };
    grade: { label: string };
  };
}

export interface MessageWithUsers {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender: { id: string; name: string; avatarUrl: string | null; role: Role };
  receiver: { id: string; name: string; avatarUrl: string | null; role: Role };
}

export interface CalendarEventWithAttendees {
  id: string;
  title: string;
  type: EventType;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  creator: { id: string; name: string };
  attendees: Array<{
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
}

export interface DashboardStats {
  totalLearners: number;
  totalTutors: number;
  totalAssessments: number;
  totalMaterials: number;
  averageScore: number;
  passRate: number;
}

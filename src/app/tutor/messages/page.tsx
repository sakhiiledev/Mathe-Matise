import { PageHeader } from "@/components/layout/page-header";
import { Messaging } from "@/components/shared/messaging";

export const metadata = { title: "Messages" };

export default function TutorMessagesPage() {
  return (
    <div>
      <PageHeader title="Messages" description="Chat with your learners in real time." />
      <Messaging />
    </div>
  );
}

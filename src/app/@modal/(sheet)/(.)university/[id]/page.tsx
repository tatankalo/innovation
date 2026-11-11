import UniversityPage from "@/app/university/[id]/page";

export const dynamic = "force-dynamic";

// Soft navigation to /university/<id> lands here and shows the record in the side sheet.
// A refresh or a shared link skips this file and renders the full page.
export default function UniversitySheet({ params }: { params: Promise<{ id: string }> }) {
  return <UniversityPage params={params} />;
}

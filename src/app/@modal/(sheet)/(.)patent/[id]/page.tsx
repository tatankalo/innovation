import PatentPage from "@/app/patent/[id]/page";

export const dynamic = "force-dynamic";

// Soft navigation to /patent/<id> lands here and shows the record in the side sheet.
// A refresh or a shared link skips this file and renders the full page.
export default function PatentSheet({ params }: { params: Promise<{ id: string }> }) {
  return <PatentPage params={params} />;
}

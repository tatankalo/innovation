import AwardPage from "@/app/award/[id]/page";

export const dynamic = "force-dynamic";

// Soft navigation to /award/<id> lands here and shows the record in the side sheet.
// A refresh or a shared link skips this file and renders the full page.
export default function AwardSheet({ params }: { params: Promise<{ id: string }> }) {
  return <AwardPage params={params} />;
}

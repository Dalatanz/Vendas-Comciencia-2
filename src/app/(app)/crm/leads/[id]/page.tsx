import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "@/actions/leads";
import { LeadDetailClient } from "@/components/crm/LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getLead(id);
  if (!res.lead) notFound();
  const lead = res.lead;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <Link href="/crm" className="text-xs text-neon hover:underline">
            ← CRM
          </Link>
          <h1 className="text-2xl font-semibold text-white mt-2">{lead.contactName}</h1>
          <p className="text-sm text-white/50">
            Etapa: {lead.stage.name} · {lead.phone}
          </p>
        </div>
      </div>
      <LeadDetailClient lead={lead} />
    </div>
  );
}

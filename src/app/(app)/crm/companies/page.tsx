import Link from "next/link";
import { listCompanies } from "@/actions/companies";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { CompanyTable } from "@/components/companies/CompanyTable";

export default async function CompaniesPage() {
  const res = await listCompanies();
  const companies = "companies" in res ? res.companies : [];
  const error = "error" in res ? res.error : undefined;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Empresas</h1>
      {error && <p className="text-amber-300 text-sm">{error}</p>}
      <CompanyForm />
      <CompanyTable companies={companies} />
      <Link href="/crm" className="text-sm text-neon hover:underline">
        Voltar ao CRM
      </Link>
    </div>
  );
}

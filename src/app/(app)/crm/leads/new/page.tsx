"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LeadStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createLead } from "@/actions/leads";
import { formatPhoneBR, onlyDigits } from "@/lib/masks";

const schema = z
  .object({
    contactName: z.string().min(2),
    phone: z.string().min(8),
    origin: z.string().min(1),
    segment: z.string().min(1),
    revenue: z.string().optional(),
    interest: z.string().optional(),
    status: z.nativeEnum(LeadStatus),
  })
  .superRefine((data, ctx) => {
    if (data.status === LeadStatus.QUALIFICADO) {
      if (!data.interest?.trim()) ctx.addIssue({ code: "custom", path: ["interest"], message: "Obrigatório" });
    }
    if (data.status === LeadStatus.PERDIDO) {
      /* motivo tratado na edição do lead */
    }
  });

type Form = z.infer<typeof schema>;

export default function NewLeadPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { status: LeadStatus.NOVO },
  });

  const phone = watch("phone");

  async function onSubmit(values: Form) {
    const res = await createLead({
      ...values,
      phone: formatPhoneBR(onlyDigits(values.phone)),
    });
    if ("error" in res && res.error) {
      alert(res.error);
      return;
    }
    if ("id" in res && res.id) router.push(`/crm/leads/${res.id}`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-white">Novo lead</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Field label="Nome do contato" error={errors.contactName?.message}>
          <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" {...register("contactName")} />
        </Field>
        <Field label="Telefone" error={errors.phone?.message}>
          <input
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white"
            value={phone}
            onChange={(e) => setValue("phone", formatPhoneBR(onlyDigits(e.target.value)))}
          />
        </Field>
        <Field label="Origem" error={errors.origin?.message}>
          <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" {...register("origin")} />
        </Field>
        <Field label="Segmento / CNAE" error={errors.segment?.message}>
          <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" {...register("segment")} />
        </Field>
        <Field label="Faturamento" error={errors.revenue?.message}>
          <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" {...register("revenue")} />
        </Field>
        <Field label="Interesse" error={errors.interest?.message}>
          <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" {...register("interest")} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" {...register("status")}>
            {Object.values(LeadStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-neon/90 text-black font-semibold px-4 py-2 text-sm"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

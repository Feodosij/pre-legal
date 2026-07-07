import { getCoverFields, getPartyRows, getStandardTermsClauses } from "@/lib/nda-content";
import type { NdaFormData } from "@/lib/nda-types";

interface NdaDocumentProps {
  data: NdaFormData;
}

export default function NdaDocument({ data }: NdaDocumentProps) {
  const coverFields = getCoverFields(data);
  const partyRows = getPartyRows(data);
  const clauses = getStandardTermsClauses(data);

  return (
    <div className="mx-auto max-w-3xl bg-white px-8 py-10 text-slate-900">
      <h1 className="text-center text-2xl font-bold">Mutual Non-Disclosure Agreement</h1>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        {coverFields.map((field) => (
          <p key={field.label}>
            <strong>{field.label}:</strong> {field.value}
          </p>
        ))}
      </section>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-slate-300 p-2 text-left"></th>
            <th className="border border-slate-300 p-2 text-left">Party 1</th>
            <th className="border border-slate-300 p-2 text-left">Party 2</th>
          </tr>
        </thead>
        <tbody>
          {partyRows.map((row) => (
            <tr key={row.label}>
              <td className="border border-slate-300 p-2 font-medium">{row.label}</td>
              <td className="border border-slate-300 p-2">{row.partyOne}</td>
              <td className="border border-slate-300 p-2">{row.partyTwo}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-bold">Standard Terms</h2>
      <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-justify">
        {clauses.map((clause) => (
          <li key={clause.title}>
            <strong>{clause.title}.</strong> {clause.body}
          </li>
        ))}
      </ol>

      <p className="mt-8 text-xs text-slate-500">
        Based on the Common Paper Mutual Non-Disclosure Agreement, Version 1.0, free to use
        under CC BY 4.0. This document is a prototype output and is not legal advice.
      </p>
    </div>
  );
}

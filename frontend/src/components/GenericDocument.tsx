import { Fragment } from "react";
import { parseInlineMarkdown } from "@/lib/inline-markdown";
import type { RenderedDocument } from "@/lib/rendered-document-types";

interface GenericDocumentProps {
  document: RenderedDocument;
}

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInlineMarkdown(text).map((segment, index) =>
        segment.bold ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </>
  );
}

export default function GenericDocument({ document }: GenericDocumentProps) {
  return (
    <div className="mx-auto max-w-3xl bg-white px-8 py-10 text-slate-900">
      <h1 className="text-center text-2xl font-bold">{document.title}</h1>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        {document.coverFields.map((field) => (
          <p key={field.label}>
            <strong>{field.label}:</strong> {field.value}
          </p>
        ))}
      </section>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-slate-300 p-2 text-left"></th>
            {document.partyRoleLabels.map((label) => (
              <th key={label} className="border border-slate-300 p-2 text-left">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {document.partyRows.map((row) => (
            <tr key={row.label}>
              <td className="border border-slate-300 p-2 font-medium">{row.label}</td>
              {row.values.map((value, index) => (
                <td key={index} className="border border-slate-300 p-2">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {document.sections.map((section) => (
        <Fragment key={section.title}>
          <h2 className="mt-10 text-lg font-bold">{section.title}</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-justify">
            {section.subsections.map((subsection, index) => (
              <li key={index}>
                {subsection.title && <strong>{subsection.title}. </strong>}
                <InlineText text={subsection.body} />
              </li>
            ))}
          </ol>
        </Fragment>
      ))}

      <p className="mt-8 text-xs text-slate-500">
        This document is a prototype output and is not legal advice.
      </p>
    </div>
  );
}

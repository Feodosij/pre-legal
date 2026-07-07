"use client";

import { useState } from "react";
import type { NdaFormData, PartyInfo } from "@/lib/nda-types";

interface NdaFormProps {
  initialData: NdaFormData;
  onSubmit: (data: NdaFormData) => void;
}

function PartyFields({
  legend,
  party,
  onChange,
}: {
  legend: string;
  party: PartyInfo;
  onChange: (party: PartyInfo) => void;
}) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">{legend}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Company name
          <input
            required
            type="text"
            value={party.companyName}
            onChange={(e) => onChange({ ...party, companyName: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          Signer name
          <input
            required
            type="text"
            value={party.printName}
            onChange={(e) => onChange({ ...party, printName: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          Title
          <input
            required
            type="text"
            value={party.title}
            onChange={(e) => onChange({ ...party, title: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          Notice address (email or postal)
          <input
            required
            type="text"
            value={party.noticeAddress}
            onChange={(e) => onChange({ ...party, noticeAddress: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </fieldset>
  );
}

export default function NdaForm({ initialData, onSubmit }: NdaFormProps) {
  const [data, setData] = useState<NdaFormData>(initialData);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="space-y-6"
    >
      <PartyFields
        legend="Party 1"
        party={data.partyOne}
        onChange={(partyOne) => setData({ ...data, partyOne })}
      />
      <PartyFields
        legend="Party 2"
        party={data.partyTwo}
        onChange={(partyTwo) => setData({ ...data, partyTwo })}
      />

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Agreement terms</legend>

        <label className="block text-sm">
          Purpose (how confidential information may be used)
          <textarea
            required
            rows={2}
            value={data.purpose}
            onChange={(e) => setData({ ...data, purpose: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          Effective date
          <input
            required
            type="date"
            value={data.effectiveDate}
            onChange={(e) => setData({ ...data, effectiveDate: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="text-sm">
          <span className="font-medium">MNDA term (length of this MNDA)</span>
          <div className="mt-1 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mndaTerm"
                checked={data.mndaTerm === "expires"}
                onChange={() => setData({ ...data, mndaTerm: "expires" })}
              />
              Expires
              <input
                type="number"
                min={1}
                disabled={data.mndaTerm !== "expires"}
                value={data.mndaTermYears}
                onChange={(e) =>
                  setData({ ...data, mndaTermYears: Number(e.target.value) })
                }
                className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
              />
              year(s) from Effective Date
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mndaTerm"
                checked={data.mndaTerm === "untilTerminated"}
                onChange={() => setData({ ...data, mndaTerm: "untilTerminated" })}
              />
              Continues until terminated
            </label>
          </div>
        </div>

        <div className="text-sm">
          <span className="font-medium">
            Term of confidentiality (how long confidential information is protected)
          </span>
          <div className="mt-1 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="confidentialityTerm"
                checked={data.confidentialityTerm === "years"}
                onChange={() => setData({ ...data, confidentialityTerm: "years" })}
              />
              <input
                type="number"
                min={1}
                disabled={data.confidentialityTerm !== "years"}
                value={data.confidentialityTermYears}
                onChange={(e) =>
                  setData({ ...data, confidentialityTermYears: Number(e.target.value) })
                }
                className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
              />
              year(s) from Effective Date (trade secrets protected until no longer a trade
              secret)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="confidentialityTerm"
                checked={data.confidentialityTerm === "perpetuity"}
                onChange={() => setData({ ...data, confidentialityTerm: "perpetuity" })}
              />
              In perpetuity
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Governing law (state)
            <input
              required
              type="text"
              placeholder="e.g. Delaware"
              value={data.governingLaw}
              onChange={(e) => setData({ ...data, governingLaw: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            Jurisdiction
            <input
              required
              type="text"
              placeholder="e.g. courts located in New Castle, DE"
              value={data.jurisdiction}
              onChange={(e) => setData({ ...data, jurisdiction: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          MNDA modifications (optional)
          <textarea
            rows={2}
            value={data.modifications}
            onChange={(e) => setData({ ...data, modifications: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </fieldset>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Generate NDA
      </button>
    </form>
  );
}

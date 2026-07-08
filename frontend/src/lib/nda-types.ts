export interface PartyInfo {
  companyName: string;
  printName: string;
  title: string;
  noticeAddress: string;
}

export type MndaTermOption = "expires" | "untilTerminated";
export type ConfidentialityTermOption = "years" | "perpetuity";

export interface NdaFormData {
  partyOne: PartyInfo;
  partyTwo: PartyInfo;
  purpose: string;
  effectiveDate: string;
  mndaTerm: MndaTermOption;
  mndaTermYears: number;
  confidentialityTerm: ConfidentialityTermOption;
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
}

export function emptyParty(): PartyInfo {
  return { companyName: "", printName: "", title: "", noticeAddress: "" };
}

export type PartialPartyInfo = Partial<PartyInfo>;

export interface PartialNdaFormData {
  partyOne?: PartialPartyInfo;
  partyTwo?: PartialPartyInfo;
  purpose?: string;
  effectiveDate?: string;
  mndaTerm?: MndaTermOption;
  mndaTermYears?: number;
  confidentialityTerm?: ConfidentialityTermOption;
  confidentialityTermYears?: number;
  governingLaw?: string;
  jurisdiction?: string;
  modifications?: string;
}

function omitNullish<T extends object>(obj: T | undefined): Partial<T> {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined)
  ) as Partial<T>;
}

export function toNdaFormData(partial: PartialNdaFormData): NdaFormData {
  // The backend serializes unset optional fields as explicit JSON `null`
  // (not an absent key), so a plain spread would let `null` clobber defaults.
  const defaults = defaultNdaFormData();
  return {
    ...defaults,
    ...omitNullish(partial),
    partyOne: { ...defaults.partyOne, ...omitNullish(partial.partyOne) },
    partyTwo: { ...defaults.partyTwo, ...omitNullish(partial.partyTwo) },
  };
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultNdaFormData(): NdaFormData {
  return {
    partyOne: emptyParty(),
    partyTwo: emptyParty(),
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: toLocalIsoDate(new Date()),
    mndaTerm: "expires",
    mndaTermYears: 1,
    confidentialityTerm: "years",
    confidentialityTermYears: 1,
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
  };
}

export function formatEffectiveDate(isoDate: string): string {
  if (!isoDate) return "[Effective Date]";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMndaTerm(data: NdaFormData): string {
  return data.mndaTerm === "expires"
    ? `Expires ${data.mndaTermYears} year(s) from the Effective Date.`
    : "Continues until terminated in accordance with the terms of the MNDA.";
}

export function formatConfidentialityTerm(data: NdaFormData): string {
  return data.confidentialityTerm === "years"
    ? `${data.confidentialityTermYears} year(s) from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.`
    : "In perpetuity.";
}

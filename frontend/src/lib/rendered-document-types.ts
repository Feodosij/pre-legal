export interface Subsection {
  title: string | null;
  body: string;
}

export interface Section {
  title: string;
  subsections: Subsection[];
}

export interface PartyRow {
  label: string;
  values: string[];
}

export interface CoverFieldValue {
  label: string;
  value: string;
}

export interface RenderedDocument {
  title: string;
  partyRoleLabels: string[];
  partyRows: PartyRow[];
  coverFields: CoverFieldValue[];
  sections: Section[];
}

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GenericDocument from "./GenericDocument";
import type { RenderedDocument } from "@/lib/rendered-document-types";

const DOC: RenderedDocument = {
  title: "Pilot Agreement",
  partyRoleLabels: ["Provider", "Customer"],
  partyRows: [{ label: "Company Name", values: ["Acme Inc", "Globex Corp"] }],
  coverFields: [{ label: "Pilot Period", value: "90 days" }],
  sections: [
    {
      title: "Pilot Access",
      subsections: [
        { title: "Access and Use", body: "Globex Corp may access the product." },
        { title: null, body: '**"Term"** means something.' },
      ],
    },
  ],
};

describe("GenericDocument", () => {
  it("renders the title, cover fields, party table, and section content", () => {
    render(<GenericDocument document={DOC} />);

    expect(screen.getByText("Pilot Agreement")).toBeInTheDocument();
    expect(screen.getByText("90 days")).toBeInTheDocument();
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    expect(screen.getByText("Globex Corp")).toBeInTheDocument();
    expect(screen.getByText("Pilot Access")).toBeInTheDocument();
    expect(screen.getByText(/Access and Use/)).toBeInTheDocument();
    expect(screen.getByText(/Globex Corp may access the product\./)).toBeInTheDocument();
    expect(screen.getByText('"Term"')).toBeInTheDocument();
  });
});

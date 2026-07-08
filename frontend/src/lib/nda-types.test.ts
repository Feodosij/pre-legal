import { describe, expect, it } from "vitest";
import { defaultNdaFormData, toNdaFormData, type PartialNdaFormData } from "./nda-types";

describe("toNdaFormData", () => {
  it("fills in defaults for fields missing from the partial data", () => {
    const result = toNdaFormData({ governingLaw: "Delaware" });
    const defaults = defaultNdaFormData();

    expect(result.governingLaw).toBe("Delaware");
    expect(result.purpose).toBe(defaults.purpose);
    expect(result.mndaTerm).toBe(defaults.mndaTerm);
  });

  it("merges partial party info over the empty-party defaults", () => {
    const result = toNdaFormData({
      partyOne: { companyName: "Acme Inc" },
    });

    expect(result.partyOne.companyName).toBe("Acme Inc");
    expect(result.partyOne.printName).toBe("");
    expect(result.partyTwo.companyName).toBe("");
  });

  it("does not let an explicit null from the backend's JSON overwrite a default value", () => {
    // The backend serializes unset optional fields as explicit JSON `null`,
    // not as an absent key, so this is the shape actually received at runtime.
    const backendResponse = {
      purpose: null,
      governingLaw: "Delaware",
      partyOne: { companyName: "Acme Inc", printName: null },
    } as unknown as PartialNdaFormData;

    const result = toNdaFormData(backendResponse);
    const defaults = defaultNdaFormData();

    expect(result.purpose).toBe(defaults.purpose);
    expect(result.governingLaw).toBe("Delaware");
    expect(result.partyOne.companyName).toBe("Acme Inc");
    expect(result.partyOne.printName).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { slugForDomain } from "@/lib/inspiration-folders";
import { extensionForImage, inspirationObjectPath } from "@/server/inspiration-upload";

describe("inspiration source path", () => {
  it("keeps an event poster in the evenementiel folder", () => {
    expect(slugForDomain("Evenementiel")).toBe("evenementiel");
    expect(slugForDomain("Education & Formation")).toBe("education");
    expect(extensionForImage("image/jpeg")).toBe("jpg");
    expect(extensionForImage("image/png")).toBe("png");
    expect(extensionForImage("image/webp")).toBe("webp");
    expect(extensionForImage("image/gif")).toBeNull();
    expect(inspirationObjectPath("evenementiel", "abc", "jpg")).toBe("evenementiel/abc.jpg");
  });
});

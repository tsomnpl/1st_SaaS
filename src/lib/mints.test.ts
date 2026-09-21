import { describe, expect, it } from "vitest";
import { afficheNoun, mintBalanceLabel, mintNoun } from "./mints";

describe("mint labels", () => {
  it("uses singular at 0 and 1, plural after", () => {
    expect(mintNoun(0)).toBe("Mint");
    expect(mintNoun(1)).toBe("Mint");
    expect(mintNoun(3)).toBe("Mints");
    expect(afficheNoun(1)).toBe("affiche");
    expect(afficheNoun(2)).toBe("affiches");
  });

  it("prints a readable top-of-page balance", () => {
    expect(mintBalanceLabel(1)).toBe("1 Mint = 1 affiche");
    expect(mintBalanceLabel(4)).toBe("4 Mints = 4 affiches");
  });
});

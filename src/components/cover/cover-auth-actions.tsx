"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { CoverGuestActions, CoverMemberActions } from "@/components/cover/cover-actions";

export function CoverAuthActions({ variant }: { variant: "bar" | "band" }) {
  return (
    <>
      <SignedOut>
        <CoverGuestActions variant={variant} />
      </SignedOut>
      <SignedIn>
        <CoverMemberActions variant={variant} />
      </SignedIn>
    </>
  );
}

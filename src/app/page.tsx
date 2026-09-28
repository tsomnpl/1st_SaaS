import type { Metadata } from "next";
import { CoverGuestActions, CoverMemberActions } from "@/components/cover/cover-actions";
import { CoverScene } from "@/components/cover/cover-scene";

export const metadata: Metadata = {
  title: { absolute: "FlyerMint. Décris ton événement ou ton offre." },
  description: "Tu réponds à quelques questions, FlyerMint compose l'affiche, tu la télécharges.",
};

export default async function Home() {
  const signedIn = await coverVisitorIsSignedIn();
  const Actions = signedIn ? CoverMemberActions : CoverGuestActions;
  return <CoverScene bar={<Actions variant="bar" />} band={<Actions variant="band" />} />;
}

async function coverVisitorIsSignedIn() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return false;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    return Boolean(session.userId);
  } catch {
    return false;
  }
}

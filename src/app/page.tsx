import type { Metadata } from "next";
import { CoverGuestActions, CoverMemberActions } from "@/components/cover/cover-actions";
import { CoverBar } from "@/components/cover/cover-bar";
import { CoverScene } from "@/components/cover/cover-scene";
import { getDictionary } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: { absolute: `FlyerMint. ${t.cover.title}` },
    description: t.cover.lead,
  };
}

export default async function Home() {
  const signedIn = await coverVisitorIsSignedIn();
  const Actions = signedIn ? CoverMemberActions : CoverGuestActions;
  return (
    <CoverScene
      bar={<CoverBar signedIn={signedIn} />}
      band={<Actions variant="band" />}
    />
  );
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

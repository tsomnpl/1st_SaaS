import type { Metadata } from "next";
import { CoverGuestActions } from "@/components/cover/cover-actions";
import { CoverScene } from "@/components/cover/cover-scene";

export const metadata: Metadata = {
  title: { absolute: "FlyerMint. Décris ton événement ou ton offre." },
  description: "Tu réponds à quelques questions, FlyerMint compose l'affiche, tu la télécharges.",
};

export default function Home() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <CoverScene
        bar={<CoverGuestActions variant="bar" />}
        band={<CoverGuestActions variant="band" />}
      />
    );
  }
  return <CoverHomeAuth />;
}

async function CoverHomeAuth() {
  const { CoverAuthActions } = await import("@/components/cover/cover-auth-actions");
  return (
    <CoverScene
      bar={<CoverAuthActions variant="bar" />}
      band={<CoverAuthActions variant="band" />}
    />
  );
}

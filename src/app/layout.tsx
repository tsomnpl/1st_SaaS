import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicChrome } from "@/components/chrome/public-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyerMint — Créez des visuels qui marquent.",
  description:
    "Transforme une idée ou un besoin commercial en affiche professionnelle. Sans designer, sans prompt.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const dynamic = "force-dynamic";

const clerkAppearance = {
  variables: {
    colorPrimary: "#6D28D9",
    colorText: "#1E293B",
    colorBackground: "#FFFFFF",
    borderRadius: "0.9rem",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return <PublicChrome>{children}</PublicChrome>;
  }

  const [{ ClerkProvider }, { AuthChrome }] = await Promise.all([
    import("@clerk/nextjs"),
    import("@/components/chrome/auth-chrome"),
  ]);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <AuthChrome>{children}</AuthChrome>
    </ClerkProvider>
  );
}

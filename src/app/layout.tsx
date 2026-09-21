import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicChrome } from "@/components/chrome/public-chrome";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://flyermint-t.vercel.app"),
  title: {
    default: "FlyerMint — Créez des visuels qui marquent",
    template: "%s — FlyerMint",
  },
  description:
    "Transforme une idée ou un besoin commercial en affiche professionnelle. Sans designer, sans prompt.",
  icons: {
    icon: "/logo-mark.svg",
    apple: "/logo-mark.svg",
  },
  openGraph: {
    title: "FlyerMint — Créez des visuels qui marquent",
    description: "Des affiches professionnelles sans designer, sans prompt.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FlyerMint — Créez des visuels qui marquent." }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlyerMint — Créez des visuels qui marquent",
    description: "Des affiches professionnelles sans designer, sans prompt.",
    images: ["/og.png"],
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
      signInFallbackRedirectUrl="/post-auth"
      signUpFallbackRedirectUrl="/post-auth"
    >
      <AuthChrome>{children}</AuthChrome>
    </ClerkProvider>
  );
}

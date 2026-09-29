import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicChrome } from "@/components/chrome/public-chrome";
import { getDictionary } from "@/lib/locale";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getDictionary();
  const title = `FlyerMint, ${t.footer.slogan}`;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: {
      default: title,
      template: "%s, FlyerMint",
    },
    description: t.footer.tagline,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      title,
      description: t.footer.tagline,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
      locale: locale === "en" ? "en_US" : "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t.footer.tagline,
      images: ["/og.png"],
    },
  };
}

export const dynamic = "force-dynamic";

const clerkAppearance = {
  variables: {
    colorPrimary: "#6D28D9",
    colorText: "#1E293B",
    colorBackground: "#FFFFFF",
    borderRadius: "8px",
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

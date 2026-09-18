import { BrandLogo } from "@/components/brand/logo";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <BrandLogo withSlogan href="/" />
        <p className="mt-6 text-slate-600">
          La connexion Clerk n’est pas configurée dans cet environnement.
        </p>
      </div>
    );
  }

  return <SignInClient />;
}

async function SignInClient() {
  const { SignIn } = await import("@clerk/nextjs");
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <BrandLogo withSlogan href="/" />
      <SignIn />
    </div>
  );
}

import { BrandLogo } from "@/components/brand/logo";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <BrandLogo withSlogan href="/" />
        <p className="mt-6 text-slate-600">
          L’inscription Clerk n’est pas configurée dans cet environnement.
        </p>
      </div>
    );
  }

  return <SignUpClient />;
}

async function SignUpClient() {
  const { SignUp } = await import("@clerk/nextjs");
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <BrandLogo withSlogan href="/" />
      <SignUp fallbackRedirectUrl="/post-auth" />
    </div>
  );
}

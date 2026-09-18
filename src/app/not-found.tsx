import { SignUp } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand/logo";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <BrandLogo withSlogan href="/" />
      <SignUp />
    </div>
  );
}

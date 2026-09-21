import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { postAuthDestination } from "@/lib/redirects";

type SearchParams = Promise<{ redirect_url?: string }>;

export default async function PostAuthPage({ searchParams }: { searchParams: SearchParams }) {
  let userId: string | null = null;
  try {
    userId = (await auth()).userId;
  } catch {
    userId = null;
  }
  if (!userId) {
    redirect("/sign-in");
  }
  const requested = (await searchParams).redirect_url ?? null;
  const admin = await isAdmin();
  redirect(postAuthDestination({ isAdmin: admin, requested }));
}

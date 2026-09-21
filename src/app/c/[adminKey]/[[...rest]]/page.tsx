import { notFound, redirect } from "next/navigation";
import { getAdminBasePath, getAdminPrivatePath } from "@/lib/env";

type Params = Promise<{ adminKey: string; rest?: string[] }>;

export default async function LegacyAdminRedirect({ params }: { params: Params }) {
  const { adminKey, rest } = await params;
  const secret = getAdminPrivatePath();
  if (!secret || adminKey !== secret) {
    notFound();
  }
  const suffix = rest?.length ? `/${rest.join("/")}` : "";
  redirect(`${getAdminBasePath()}${suffix}`);
}

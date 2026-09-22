import { readFile } from "node:fs/promises";
import path from "node:path";

type Params = Promise<{ asset: string[] }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { asset } = await params;
  const rel = asset.join("/");
  if (!/^[\w./-]+$/.test(rel) || rel.includes("..") || !rel.endsWith(".webp")) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "x-flyermint-asset": "missing" },
    });
  }

  const root = path.join(process.cwd(), "public", "creations");
  const file = path.resolve(root, rel);
  if (!file.startsWith(`${root}${path.sep}`)) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  try {
    const body = await readFile(file);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "image/webp",
        "cache-control": "public, max-age=31536000, immutable",
        "x-flyermint-asset": "found",
      },
    });
  } catch {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "x-flyermint-asset": "missing" },
    });
  }
}

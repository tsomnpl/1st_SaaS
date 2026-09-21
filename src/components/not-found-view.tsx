import Link from "next/link";

export function NotFoundView() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-sm font-semibold text-[#20C997]">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Page introuvable</h1>
      <p className="mt-2 text-slate-600">Cette adresse n’existe pas sur FlyerMint.</p>
      <Link href="/" className="btn-primary mt-6">
        Retour à l’accueil
      </Link>
    </div>
  );
}

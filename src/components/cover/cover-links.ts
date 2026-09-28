export function coverAccountLinks(signedIn: boolean) {
  if (signedIn) {
    return [
      { href: "/create", label: "Créer une affiche", kind: "primary" as const },
      { href: "/dashboard", label: "Mon espace", kind: "secondary" as const },
    ];
  }
  return [
    { href: "/sign-up", label: "Créer un compte", kind: "primary" as const },
    { href: "/sign-in", label: "Se connecter", kind: "secondary" as const },
    { href: "/decouvrir", label: "En savoir plus", kind: "link" as const },
  ];
}

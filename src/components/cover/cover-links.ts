const french = {
  create: "Créer une affiche",
  space: "Mon espace",
  createAccount: "Créer un compte",
  signInCover: "Se connecter",
  more: "En savoir plus",
};

export function coverAccountLinks(
  signedIn: boolean,
  labels: {
    create: string;
    space: string;
    createAccount: string;
    signInCover: string;
    more: string;
  } = french,
) {
  if (signedIn) {
    return [
      { href: "/create", label: labels.create, kind: "primary" as const },
      { href: "/dashboard", label: labels.space, kind: "secondary" as const },
    ];
  }
  return [
    { href: "/sign-up", label: labels.createAccount, kind: "primary" as const },
    { href: "/sign-in", label: labels.signInCover, kind: "secondary" as const },
    { href: "/decouvrir", label: labels.more, kind: "link" as const },
  ];
}

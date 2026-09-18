const SITE = "FlyerMint";
const SLOGAN = "Créez des visuels qui marquent";

export function pageTitle(name?: string) {
  return name || `${SITE} — ${SLOGAN}`;
}

export function pageDescription() {
  return "Transforme une idée ou un besoin commercial en affiche professionnelle. Sans designer, sans prompt.";
}

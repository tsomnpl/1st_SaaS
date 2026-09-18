export const BRAND = {
  name: "FlyerMint",
  slogan: "Créez des visuels qui marquent.",
  colors: {
    night: "#1E293B",
    violet: "#6D28D9",
    blue: "#3B82F6",
    mint: "#10B981",
    orange: "#F59E0B",
    white: "#FFFFFF",
  },
} as const;

export const STEPS = [
  {
    n: "01",
    title: "Décris",
    text: "Explique ce que tu veux communiquer : offre, événement, message.",
  },
  {
    n: "02",
    title: "Réponds",
    text: "FlyerMint pose uniquement les questions utiles, sans prompt technique.",
  },
  {
    n: "03",
    title: "Direction artistique",
    text: "Hiérarchie, palette, composition et CTA sont construits automatiquement.",
  },
  {
    n: "04",
    title: "Génération",
    text: "Un modèle image spécialisé compose l’affiche professionnelle.",
  },
  {
    n: "05",
    title: "Contrôle",
    text: "Lisibilité, textes, marges et cohérence sont vérifiés.",
  },
  {
    n: "06",
    title: "Résultat",
    text: "Tu télécharges ton affiche. L’export ne consomme aucun Mint.",
  },
] as const;

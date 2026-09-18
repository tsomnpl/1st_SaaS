export type ShowcaseStatus = "genere" | "echec";

export type ShowcaseManifestEntry = {
  id: string;
  domaine: string;
  titre_original_catalogue: string;
  titre_affiche_finale: string;
  sous_titre_affiche_finale: string;
  prompt_image_final: string;
  modele_texte_utilise: string;
  modele_image_utilise: string;
  cout_rodi: number;
  fichier_image: string;
  fichier_image_hero: string;
  poids_ko: number;
  statut: ShowcaseStatus;
  hero_loop: boolean;
};

export type ShowcaseManifestFile = {
  source: string;
  generated_at?: string;
  count: number;
  rodi_total: number;
  fiches: ShowcaseManifestEntry[];
};

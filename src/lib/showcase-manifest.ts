export type ShowcaseStatus = "genere" | "echec";

export type ShowcaseReferenceCategorisation = {
  domaine?: string;
  style: string;
  composition: string;
  palette: string[];
  ambiance: string;
};

export type ShowcaseManifestEntry = {
  id: string;
  domaine: string;
  titre_original_catalogue: string;
  titre_affiche_finale: string;
  sous_titre_affiche_finale: string;
  prompt_image_final: string;
  regles_design_appliquees?: string[];
  modele_texte_utilise: string;
  modele_image_utilise: string;
  cout_rodi: number;
  fichier_image_master_4k?: string;
  master_width?: number;
  master_height?: number;
  fichier_image_web?: string;
  fichier_image: string;
  fichier_image_hero: string;
  poids_web_ko?: number;
  poids_ko: number;
  web_width?: number;
  web_height?: number;
  resize?: string;
  page_reference_pdf?: number | null;
  visual_ref_used?: boolean;
  reference_categorisation?: ShowcaseReferenceCategorisation;
  statut: ShowcaseStatus;
  hero_loop: boolean;
  erreur?: string;
};

export type ShowcaseManifestFile = {
  source: string;
  generated_at?: string;
  count: number;
  rodi_total: number;
  note?: string;
  hero_loop_count?: number;
  fiches: ShowcaseManifestEntry[];
};

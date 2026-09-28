import { describe, expect, it } from "vitest";
import { DOMAINS } from "@/lib/domains";
import { buildArtDirection, buildPrompt, createBriefSchema } from "@/lib/flyermint";
import { acceptedExactCopyResponseModel, EXACT_COPY_MODEL, judgeExactCopyTranscript } from "@/lib/exact-copy";
import { joinDomainReferences } from "@/lib/inspiration-source";
import { selectReferenceInDomain, type DomainReference } from "@/lib/reference-select";
import { buildImageGenerationBody, selectImageModel } from "@/server/rodium";
import { parseExactCopyQc } from "@/lib/exact-copy";

const FORMATION = "Education & Formation";

const EDUCATION: DomainReference[] = [
  ref("74697609-2154-4d08-a99d-d9e8265d12e9", "education/351febd33b648c563ea9234f8820bac7.jpg", {
    style: "Informatif et rassurant, axe sur l'education.",
    background: "Fond blanc quadrille rappelant un cahier d'ecolier.",
    texts: "Titre centre en gros caracteres orange, sous-titres en gras noir, informations pratiques en bandeaux.",
    visual: "Jeune fille concentree sur ses devoirs, entouree de livres.",
  }),
  ref("7fcef7c8-8467-4ea2-92cb-172f8f2927c1", "education/3af9dd4ef5a7b158dbdb624ca8faf974.jpg", {
    style: "Moderne et informatif, axe sur l'education.",
    background: "Fond bleu fonce avec une bande bleue plus claire en haut.",
    texts: "Titre principal en gras en haut a gauche, sous-titre en gras jaune, liste a puces, informations de contact en bas.",
    visual: "Une jeune fille souriante tenant un livre.",
  }),
  ref("b9a48415-c59e-429e-b092-e80769459f0b", "education/48c0285435a28dfd6edb781b38fb501e.jpg", {
    style: "Moderne et informatif, axe sur l'education.",
    background: "Fond bleu clair avec des formes abstraites.",
    texts: "Titre en haut en gras, liste de matieres en blocs colores, informations de contact en bandeau bas.",
    visual: "Un jeune homme souriant portant un sac a dos et des livres.",
  }),
  ref("d8d20efa-7bc8-4621-8274-0275e211e053", "education/6a7adc966a49695ea892a0afa8a12f99.jpg", {
    style: "informatif et encourageant.",
    background: "une scene d'apprentissage avec un adulte et un enfant.",
    texts: "titres en blocs colores, liste a puces pour les avantages, informations de contact en bas.",
    visual: "une image de fond montrant un homme enseignant a une jeune fille.",
  }),
  ref("53f63efe-7fd9-411a-9653-d09ac81a50a9", "education/6d4c84dec471ddfec22245312e26e2c0.jpg", {
    style: "Epure",
    background: "Fond blanc uni avec un grand cercle gris clair.",
    texts: "Titre principal en haut, centre, en capitales grasses, suivi d'une liste de services et d'un bouton d'appel a l'action en bas.",
    visual: "Une pile de livres avec un pot de crayons.",
  }),
  ref("6c465344-9a3d-4402-968d-25e06e8e2b41", "education/83527d1073d81570605f620ad1415a6f.jpg", {
    style: "Corporate",
    background: "Degrade uni aux tons violets et roses.",
    texts: "Hierarchie claire avec un titre principal en haut, des blocs d'informations centraux et des details pratiques en bas.",
    visual: "Portrait d'une jeune femme souriante tenant des dossiers, cadree sur le cote gauche.",
  }),
];

function ref(id: string, storagePath: string, copy: Pick<DomainReference, "style" | "background" | "texts" | "visual">): DomainReference {
  return {
    id,
    domain: FORMATION,
    slug: "education",
    storagePath,
    palette: [],
    analyzed: true,
    ...copy,
  };
}

function formationBrief() {
  return createBriefSchema.parse({
    visualType: "Affiche promotionnelle",
    domain: FORMATION,
    objective: "Promouvoir une formation",
    targetAudience: "Professionnels",
    title: "Formation Excel",
    format: "affiche_a4",
    creativeFreedom: "copie_exacte",
    colors: [],
    adaptiveData: {},
  });
}

describe("exact copy reference selection", () => {
  it("stays inside FORMATION and ignores a title match from another domain", () => {
    const intruder: DomainReference = {
      id: "resto-formation-lookalike",
      domain: "Restauration",
      slug: "restauration",
      storagePath: "restauration/menu-formation.jpg",
      style: "Formation cuisine",
      background: "restaurant",
      texts: "Titre Formation Excel, prix, CTA",
      visual: "chef",
      palette: [],
      analyzed: true,
    };
    const selection = selectReferenceInDomain({
      domain: FORMATION,
      brief: formationBrief(),
      candidates: [...EDUCATION, intruder],
    });

    expect(selection.slug).toBe("education");
    expect(selection.rejectedOtherDomains).toBe(1);
    expect(selection.examined).toHaveLength(EDUCATION.length);
    expect(selection.examined.every((item) => item.slug === "education" && item.storagePath.startsWith("education/"))).toBe(true);
    expect(selection.selected?.id).toBe("6c465344-9a3d-4402-968d-25e06e8e2b41");
    expect(selection.selected?.storagePath).toBe("education/83527d1073d81570605f620ad1415a6f.jpg");
    expect(selection.reason).toContain("hors domaine ignorees");
    expect(selection.reason).not.toContain("restauration/");
  });

  it("does not invent a reference when the domain folder is empty", () => {
    const selection = selectReferenceInDomain({
      domain: FORMATION,
      brief: formationBrief(),
      candidates: [],
    });
    expect(selection.selected).toBeNull();
    expect(selection.reason).toContain("Pas de repli");
  });

  it("joins only real rows from the chosen slug", () => {
    const joined = joinDomainReferences({
      domain: FORMATION,
      slug: "education",
      rows: [
        { id: "6c465344-9a3d-4402-968d-25e06e8e2b41", domaine: "education", storage_path: "education/83527d1073d81570605f620ad1415a6f.jpg" },
        { id: "other", domaine: "restauration", storage_path: "restauration/x.jpg" },
        { id: "bad-path", domaine: "education", storage_path: "sport/x.jpg" },
      ],
      analyses: [
        {
          id: "6c465344-9a3d-4402-968d-25e06e8e2b41",
          analysis: { style_general: "Corporate", textes: "Titre", visuel: "Portrait", arriere_plan: "violet", palette_dominante: ["#800080"] },
        },
      ],
    });
    expect(joined).toHaveLength(1);
    expect(joined[0]?.storagePath.startsWith("education/")).toBe(true);
  });
});

describe("exact copy prompt and model", () => {
  it("keeps the reference structure and does not force a new FlyerMint composition", () => {
    for (const domain of DOMAINS) {
      const brief = createBriefSchema.parse({
        visualType: "Affiche",
        domain,
        objective: "Promouvoir une offre",
        targetAudience: "Clients",
        title: "Offre",
        format: "affiche_a4",
        creativeFreedom: "copie_exacte",
        colors: [],
        adaptiveData: {},
      });
      const prompt = buildPrompt(brief, buildArtDirection(brief));
      expect(prompt).toContain("Modify the supplied reference poster.");
      expect(prompt).toContain("IMAGE EDIT");
      expect(prompt).toContain("same photograph");
      expect(prompt).toContain("Do not blur");
      expect(prompt).toContain("same font");
      expect(prompt).toContain("The only words allowed");
      expect(prompt).not.toContain("DESIGN LAWS, mandatory");
      expect(prompt).not.toContain("un seul heros");
      expect(prompt).not.toContain("Maximum 2-3 main colors");
      expect(prompt).toContain("sous-titre");
      expect(prompt).toContain("Remove these slots");
    }
  });

  it("deletes facts that the Formation Excel brief does not provide", () => {
    const brief = formationBrief();
    const prompt = buildPrompt(brief, buildArtDirection(brief));
    expect(prompt).toContain('titre replaces the original titre: "Formation Excel"');
    expect(prompt).toContain("- date");
    expect(prompt).toContain("- prix");
    expect(prompt).toContain("- telephone");
    expect(prompt).toContain("- bouton ou bande CTA");
    expect(prompt).toContain("Remove the old logo");
    expect(prompt).not.toContain("Put the word FLYERMINT");
  });

  it("sends google/gemini-3-pro-image with the reference image, never the lite model", () => {
    const brief = formationBrief();
    const model = selectImageModel(brief, "Formation Excel", [
      "openai/gpt-image-2",
      "google/gemini-3-pro-image-lite",
      "google/gemini-3.1-flash-image",
    ]);
    expect(model).toBe(EXACT_COPY_MODEL);
    expect(model).not.toContain("lite");
    expect(acceptedExactCopyResponseModel("gemini-3-pro-image")).toBe(true);
    expect(acceptedExactCopyResponseModel("google/gemini-3-pro-image")).toBe(true);
    expect(acceptedExactCopyResponseModel("google/gemini-3-pro-image-lite")).toBe(false);
    expect(acceptedExactCopyResponseModel("openai/gpt-image-2")).toBe(false);

    const reference = "data:image/jpeg;base64,QUJDRA==";
    const body = buildImageGenerationBody({
      model,
      prompt: buildPrompt(brief, buildArtDirection(brief)),
      brief,
      referenceImageDataUrl: reference,
    });
    expect(body.model).toBe("google/gemini-3-pro-image");
    expect(body.image).toBe(reference);
    const withPhoto = buildImageGenerationBody({
      model,
      prompt: "edit",
      brief: { ...brief, mainImageUrl: "data:image/png;base64,UEhPVE8=" },
      referenceImageDataUrl: reference,
    });
    expect(withPhoto.image).toEqual([reference, "data:image/png;base64,UEhPVE8="]);
    expect(String(body.prompt)).toContain("Modify the supplied reference poster.");
  });
});

describe("exact copy quality check", () => {
  it("rejects a pretty result that keeps old content or changes the composition", () => {
    const brief = formationBrief();
    const pretty = judgeExactCopyTranscript(
      brief,
      JSON.stringify({
        visible_text: "Formation Excel Maitrisez le tableur Debutant 3 mois Certificat 150 euros",
        same_layout: true,
      }),
    );
    expect(pretty.pass).toBe(false);
    expect(pretty.leftover_old_content).toBe(true);
    expect(pretty.pretty_but_wrong).toBe(true);

    const drifted = judgeExactCopyTranscript(
      brief,
      JSON.stringify({ visible_text: "Formation Excel", same_layout: false }),
    );
    expect(drifted.pass).toBe(false);
    expect(drifted.composition_match).toBe(false);

    const faithful = judgeExactCopyTranscript(
      brief,
      JSON.stringify({ visible_text: "Formation Excel", same_layout: true }),
    );
    expect(faithful.pass).toBe(true);
    expect(judgeExactCopyTranscript(brief, "not json").pass).toBe(false);
  });

  it("still parses an explicit model verdict without trusting pretty alone", () => {
    const pretty = parseExactCopyQc(
      JSON.stringify({
        pass: true,
        composition_match: false,
        leftover_old_content: true,
        brief_content_present: true,
        omitted_slots_removed: false,
        pretty_but_wrong: true,
        issues: ["ancien prix encore visible"],
        repair_prompt: "Delete the old price and restore the title block.",
      }),
    );
    expect(pretty.pass).toBe(false);
    expect(pretty.pretty_but_wrong).toBe(true);

    const faithful = parseExactCopyQc(
      JSON.stringify({
        pass: true,
        composition_match: true,
        leftover_old_content: false,
        brief_content_present: true,
        omitted_slots_removed: true,
        pretty_but_wrong: false,
        issues: [],
        repair_prompt: "",
      }),
    );
    expect(faithful.pass).toBe(true);
    expect(parseExactCopyQc("not json").pass).toBe(false);
  });
});

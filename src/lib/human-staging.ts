import { DOMAINS } from "@/lib/domains";

export type HumanStaging = {
  role: string;
  action: string;
  framing: string;
  wardrobe: string;
  expression: string;
  why: string;
};

const STAGING: Record<(typeof DOMAINS)[number], HumanStaging> = {
  Evenementiel: {
    role: "performer or guest in the crowd",
    action: "caught mid-performance or mid-cheer, body in motion",
    framing: "three-quarter portrait, subject in the lower third, sky/stage for type",
    wardrobe: "night-out clothes matching the event energy",
    expression: "anticipation, not a stock smile",
    why: "the person is the proof the night is real",
  },
  Restauration: {
    role: "cook or diner",
    action: "plating, tasting, or presenting the hero dish with both hands",
    framing: "close food hero plus a visible face/hands, not a floating plate",
    wardrobe: "apron or casual dining attire",
    expression: "appetite, concentration",
    why: "someone enjoying or making the food sells the restaurant",
  },
  "Mode & Accessoires": {
    role: "model wearing the piece",
    action: "standing or walking, garment fully readable",
    framing: "editorial full or three-quarter, generous negative space for type",
    wardrobe: "the advertised look only",
    expression: "calm confidence",
    why: "fashion needs a body in the clothes",
  },
  "Beaute & Soins": {
    role: "client or therapist",
    action: "receiving or applying the treatment on real skin",
    framing: "portrait or hands+face, natural skin texture visible",
    wardrobe: "spa/salon simplicity",
    expression: "relaxed, not over-retouched",
    why: "beauty is a human result, not a floating bottle",
  },
  Immobilier: {
    role: "visitor or agent",
    action: "entering, showing, or looking through the property",
    framing: "person in scale against the facade or living room",
    wardrobe: "smart casual",
    expression: "quiet confidence",
    why: "a home is inhabited, not an empty render",
  },
  "Business & Entreprise": {
    role: "founder or client",
    action: "working, shaking hands, or presenting the offer",
    framing: "chest-up in a real workspace, type on the opposite side",
    wardrobe: "professional, local, not a Silicon Valley cliché",
    expression: "direct, competent",
    why: "trust is a face",
  },
  Technologie: {
    role: "user",
    action: "actually using the phone, laptop, or device",
    framing: "hands+face with the product readable, interface not fake logos",
    wardrobe: "everyday clothes",
    expression: "focus",
    why: "tech is used by someone",
  },
  "Education & Formation": {
    role: "student or trainer",
    action: "learning, teaching, or holding a workbook/certificate",
    framing: "portrait in a classroom or desk scene, space for course title",
    wardrobe: "smart casual",
    expression: "ambition, not a fake grin",
    why: "formation is a human promise",
  },
  Sport: {
    role: "athlete",
    action: "in motion — running, lifting, striking",
    framing: "dynamic diagonal, subject sharp, background speed",
    wardrobe: "kit matching the sport, no real club logos",
    expression: "effort",
    why: "sport is a body in action",
  },
  "Finance & Fintech": {
    role: "customer or advisor",
    action: "using a phone wallet, card, or talking across a desk",
    framing: "chest-up, calm office or street, numbers have room",
    wardrobe: "clean professional",
    expression: "reassurance",
    why: "money needs a trustworthy person",
  },
  "Sante & Clinique": {
    role: "clinician or patient",
    action: "consulting, checking, or welcoming — respectful, no gore",
    framing: "calm portrait, lots of white space",
    wardrobe: "scrubs or simple civilian clothes, no real hospital marks",
    expression: "care",
    why: "health communication is human",
  },
  "Tourisme & Voyage": {
    role: "traveller",
    action: "arriving, looking at the view, or being welcomed",
    framing: "person in the landscape, horizon free for the title",
    wardrobe: "travel clothes",
    expression: "wonder, not a posed selfie grin",
    why: "travel is lived by someone",
  },
  "E-commerce": {
    role: "customer unboxing or wearing/using the product",
    action: "holding the product toward camera, face visible",
    framing: "product + person, badge space for price",
    wardrobe: "neutral",
    expression: "satisfaction",
    why: "a product is more believable in someone's hands",
  },
  Mariage: {
    role: "couple or guest",
    action: "standing together, walking, or a tender still",
    framing: "centered ceremonial, large margins",
    wardrobe: "attire matching the tone, no celebrity likeness",
    expression: "intimacy",
    why: "a wedding poster is about people",
  },
  Anniversaire: {
    role: "the celebrated person or friends",
    action: "laughing, blowing candles, or being hugged",
    framing: "photo-card with room for date/place",
    wardrobe: "party clothes",
    expression: "joy that looks photographed, not generated",
    why: "the honoree is the poster",
  },
  "Emploi & Recrutement": {
    role: "team member or candidate",
    action: "working on-site or being welcomed",
    framing: "documentary workplace, job title has a clear band",
    wardrobe: "the actual work clothes",
    expression: "competence",
    why: "people apply to people",
  },
  Agriculture: {
    role: "farmer or producer",
    action: "harvesting, carrying crates, or standing in the field",
    framing: "person + crop, daylight, earth textures",
    wardrobe: "work clothes",
    expression: "pride, fatigue allowed",
    why: "terroir is a person in a place",
  },
  Automobile: {
    role: "driver or buyer",
    action: "opening the door, sitting at the wheel, or walking around the car",
    framing: "three-quarter car with a person for scale",
    wardrobe: "smart casual",
    expression: "desire, control",
    why: "a car is driven",
  },
  Musique: {
    role: "artist or crowd member",
    action: "singing, playing, or hands up in the lights",
    framing: "stage portrait, title stacked above or across negative space",
    wardrobe: "performance clothes, no celebrity likeness",
    expression: "intensity",
    why: "music is a body on stage",
  },
  Associations: {
    role: "volunteer or beneficiary — respectful, never exploitative",
    action: "helping, teaching, or standing with the community",
    framing: "documentary, one clear face, message has room",
    wardrobe: "everyday clothes",
    expression: "dignity",
    why: "a cause is human",
  },
  "Religion & Culture": {
    role: "participant or officiant",
    action: "gathering, singing, or a quiet ceremonial gesture",
    framing: "stable centered portrait, wide margins, no caricature",
    wardrobe: "respectful ceremonial or modest dress",
    expression: "solemn warmth",
    why: "rite is lived by people",
  },
  "Services divers": {
    role: "the professional at work",
    action: "doing the actual service (repair, delivery, grooming, etc.)",
    framing: "person + tool/result, contact band at the bottom",
    wardrobe: "workwear",
    expression: "reliability",
    why: "a service is a person you call",
  },
};

export function humanStagingFor(domain: (typeof DOMAINS)[number]): HumanStaging {
  return STAGING[domain];
}

export function allDomainsHaveHumanStaging() {
  return DOMAINS.every((domain) => Boolean(STAGING[domain]?.role));
}

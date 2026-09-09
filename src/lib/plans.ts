export type PlanSeed = {
  code: string;
  name: string;
  priceFcfa: number;
  mintAmount: number;
  durationDays: number | null;
  editableExport: boolean;
  sortOrder: number;
};

export const OFFICIAL_PLANS: PlanSeed[] = [
  {
    code: "FREE",
    name: "Gratuit",
    priceFcfa: 0,
    mintAmount: 1,
    durationDays: null,
    editableExport: false,
    sortOrder: 0,
  },
  {
    code: "STARTER_2K",
    name: "Pack Starter 2 000 FCFA",
    priceFcfa: 2000,
    mintAmount: 2,
    durationDays: 30,
    editableExport: false,
    sortOrder: 1,
  },
  {
    code: "PACK_5K",
    name: "Pack 5 000 FCFA",
    priceFcfa: 5000,
    mintAmount: 2,
    durationDays: null,
    editableExport: false,
    sortOrder: 2,
  },
  {
    code: "PACK_10K",
    name: "Pack 10 000 FCFA",
    priceFcfa: 10000,
    mintAmount: 5,
    durationDays: null,
    editableExport: false,
    sortOrder: 3,
  },
  {
    code: "PACK_15K",
    name: "Pack 15 000 FCFA",
    priceFcfa: 15000,
    mintAmount: 10,
    durationDays: null,
    editableExport: false,
    sortOrder: 4,
  },
  {
    code: "PACK_20K",
    name: "Pack 20 000 FCFA",
    priceFcfa: 20000,
    mintAmount: 15,
    durationDays: null,
    editableExport: true,
    sortOrder: 5,
  },
  {
    code: "PACK_25K",
    name: "Pack 25 000 FCFA",
    priceFcfa: 25000,
    mintAmount: 20,
    durationDays: null,
    editableExport: true,
    sortOrder: 6,
  },
];

/**
 * Nigeria delivery fee + ETA estimator.
 * Zone-based — values are illustrative for the storefront UX.
 */
export type ShippingQuote = { fee: number; etaMin: number; etaMax: number; zone: string };

const ZONES: Record<string, { fee: number; etaMin: number; etaMax: number; zone: string }> = {
  lagos: { fee: 2500, etaMin: 1, etaMax: 2, zone: "Lagos" },
  ogun: { fee: 3500, etaMin: 2, etaMax: 3, zone: "South-West" },
  oyo: { fee: 3500, etaMin: 2, etaMax: 3, zone: "South-West" },
  osun: { fee: 3500, etaMin: 2, etaMax: 3, zone: "South-West" },
  ondo: { fee: 3500, etaMin: 2, etaMax: 3, zone: "South-West" },
  ekiti: { fee: 3500, etaMin: 2, etaMax: 3, zone: "South-West" },
  fct: { fee: 4500, etaMin: 2, etaMax: 4, zone: "Abuja / FCT" },
  abuja: { fee: 4500, etaMin: 2, etaMax: 4, zone: "Abuja / FCT" },
  rivers: { fee: 4500, etaMin: 3, etaMax: 5, zone: "South-South" },
  delta: { fee: 4500, etaMin: 3, etaMax: 5, zone: "South-South" },
  edo: { fee: 4000, etaMin: 3, etaMax: 4, zone: "South-South" },
  bayelsa: { fee: 5000, etaMin: 3, etaMax: 5, zone: "South-South" },
  "akwa ibom": { fee: 5000, etaMin: 3, etaMax: 5, zone: "South-South" },
  "cross river": { fee: 5000, etaMin: 3, etaMax: 5, zone: "South-South" },
  anambra: { fee: 4500, etaMin: 3, etaMax: 5, zone: "South-East" },
  enugu: { fee: 4500, etaMin: 3, etaMax: 5, zone: "South-East" },
  imo: { fee: 4500, etaMin: 3, etaMax: 5, zone: "South-East" },
  abia: { fee: 4500, etaMin: 3, etaMax: 5, zone: "South-East" },
  ebonyi: { fee: 4500, etaMin: 3, etaMax: 5, zone: "South-East" },
  kano: { fee: 5500, etaMin: 4, etaMax: 6, zone: "North-West" },
  kaduna: { fee: 5500, etaMin: 4, etaMax: 6, zone: "North-West" },
  sokoto: { fee: 6500, etaMin: 5, etaMax: 7, zone: "North-West" },
  kebbi: { fee: 6500, etaMin: 5, etaMax: 7, zone: "North-West" },
  zamfara: { fee: 6500, etaMin: 5, etaMax: 7, zone: "North-West" },
  jigawa: { fee: 6000, etaMin: 5, etaMax: 7, zone: "North-West" },
  katsina: { fee: 5500, etaMin: 4, etaMax: 6, zone: "North-West" },
  plateau: { fee: 5500, etaMin: 4, etaMax: 6, zone: "North-Central" },
  benue: { fee: 5500, etaMin: 4, etaMax: 6, zone: "North-Central" },
  kogi: { fee: 4500, etaMin: 3, etaMax: 5, zone: "North-Central" },
  kwara: { fee: 4500, etaMin: 3, etaMax: 5, zone: "North-Central" },
  nasarawa: { fee: 5000, etaMin: 3, etaMax: 5, zone: "North-Central" },
  niger: { fee: 5000, etaMin: 4, etaMax: 6, zone: "North-Central" },
  bauchi: { fee: 6000, etaMin: 5, etaMax: 7, zone: "North-East" },
  gombe: { fee: 6000, etaMin: 5, etaMax: 7, zone: "North-East" },
  yobe: { fee: 6500, etaMin: 5, etaMax: 7, zone: "North-East" },
  borno: { fee: 7000, etaMin: 6, etaMax: 8, zone: "North-East" },
  taraba: { fee: 6500, etaMin: 5, etaMax: 7, zone: "North-East" },
  adamawa: { fee: 6500, etaMin: 5, etaMax: 7, zone: "North-East" },
};

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

export function quoteShipping(stateName: string): ShippingQuote | null {
  if (!stateName) return null;
  const key = stateName.trim().toLowerCase();
  const z = ZONES[key];
  if (!z) return null;
  return z;
}

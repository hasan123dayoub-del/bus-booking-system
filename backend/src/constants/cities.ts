export const CITY_CODES = [
  "DAMASCUS", "RIF_DIMASHQ", "ALEPPO", "HOMS", "HAMA", "LATAKIA", "TARTUS",
  "IDLIB", "DEIR_EZZOR", "RAQQA", "HASAKAH", "DARAA", "SUWEIDA", "QUNEITRA",
] as const;

export type CityCode = (typeof CITY_CODES)[number];

export const CITY_NAMES_AR: Record<CityCode, string> = {
  DAMASCUS: "دمشق",
  RIF_DIMASHQ: "ريف دمشق",
  ALEPPO: "حلب",
  HOMS: "حمص",
  HAMA: "حماة",
  LATAKIA: "اللاذقية",
  TARTUS: "طرطوس",
  IDLIB: "إدلب",
  DEIR_EZZOR: "دير الزور",
  RAQQA: "الرقة",
  HASAKAH: "الحسكة",
  DARAA: "درعا",
  SUWEIDA: "السويداء",
  QUNEITRA: "القنيطرة",
};

export const CITIES = CITY_CODES.map((code) => ({ code, nameAr: CITY_NAMES_AR[code] }));

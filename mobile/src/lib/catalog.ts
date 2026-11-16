// Fixed data that mirrors backend/src/constants: the 14 governorates and the 6 bus types
export const CITY_NAMES: Record<string, string> = {
  DAMASCUS: 'دمشق',
  RIF_DIMASHQ: 'ريف دمشق',
  ALEPPO: 'حلب',
  HOMS: 'حمص',
  HAMA: 'حماة',
  LATAKIA: 'اللاذقية',
  TARTUS: 'طرطوس',
  IDLIB: 'إدلب',
  DEIR_EZZOR: 'دير الزور',
  RAQQA: 'الرقة',
  HASAKAH: 'الحسكة',
  DARAA: 'درعا',
  SUWEIDA: 'السويداء',
  QUNEITRA: 'القنيطرة',
};

export const cityName = (code: string) => CITY_NAMES[code] ?? code;

export type BusClass = 'REGULAR' | 'FIRST_CLASS' | 'BUSINESS';
export type BusSize = 'LARGE' | 'MEDIUM';

export const BUS_CLASSES: BusClass[] = ['REGULAR', 'FIRST_CLASS', 'BUSINESS'];

export const CLASS_INFO: Record<BusClass, { name: string; bg: string; fg: string }> = {
  REGULAR: { name: 'عادية', bg: '#E8EEF7', fg: '#2C4A7A' },
  FIRST_CLASS: { name: 'درجة أولى', bg: '#FFF1D6', fg: '#8A5A00' },
  BUSINESS: { name: 'رجال أعمال', bg: '#EDE7FA', fg: '#4A3A8A' },
};

// The app only accepts this many seats in one booking (backend MAX_SEATS_PER_BOOKING)
export const MAX_SEATS_PER_BOOKING = 10;

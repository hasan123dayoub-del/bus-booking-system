import { randomInt } from "crypto";

// No 0/O or 1/I so the code is easy to read out over the phone
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** e.g. BK-7F3K9Q */
export function newBookingCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `BK-${s}`;
}

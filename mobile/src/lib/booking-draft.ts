import type { Booking } from './types';

// Holds the booking just created, so the success screen can show it without another request
let lastBooking: Booking | null = null;

export const setLastBooking = (b: Booking) => {
  lastBooking = b;
};

export const getLastBooking = () => lastBooking;

// The welcome screen shows once per app launch for guests
let welcomeSeen = false;
export const markWelcomeSeen = () => {
  welcomeSeen = true;
};
export const wasWelcomeSeen = () => welcomeSeen;

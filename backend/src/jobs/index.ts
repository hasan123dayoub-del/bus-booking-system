import cron from "node-cron";
import { generateAllTrips } from "../services/schedule.service";
import { markDepartedTrips } from "../services/trip.service";

async function run(name: string, task: () => Promise<number>) {
  try {
    const n = await task();
    if (n) console.log(`[job] ${name}: ${n}`);
  } catch (err) {
    console.error(`[job] ${name} failed`, err);
  }
}

/** Background jobs. Each one is safe to run more than once. */
export function startJobs() {
  // Keep 30 days of trips ahead for every active schedule: on boot and every night
  void run("generate trips", generateAllTrips);
  cron.schedule("5 0 * * *", () => run("generate trips", generateAllTrips), {
    timezone: "Asia/Damascus",
  });

  // Trips whose departure time has passed become DEPARTED
  void run("mark departed", markDepartedTrips);
  cron.schedule("*/5 * * * *", () => run("mark departed", markDepartedTrips));
}

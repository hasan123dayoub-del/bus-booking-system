import { BusClass, BusSize, BusStatus } from "../constants";
import { Bus, Trip, TripSchedule } from "../models";
import { AppError } from "../utils/AppError";
import { buildSeatMap, seatCount } from "../utils/seatMap";

type BusInput = { plateNumber: string; busClass: BusClass; size: BusSize; status?: BusStatus };
type BusDoc = InstanceType<typeof Bus>;

export const busView = (bus: BusDoc) => ({
  ...bus.toJSON(),
  seatCount: seatCount(bus.busClass as BusClass, bus.size as BusSize),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listBuses(filter: {
  q?: string;
  busClass?: string;
  size?: string;
  status?: string;
}) {
  const q: Record<string, unknown> = {};
  if (filter.q) q.plateNumber = { $regex: escapeRegex(filter.q), $options: "i" };
  if (filter.busClass) q.busClass = filter.busClass;
  if (filter.size) q.size = filter.size;
  if (filter.status) q.status = filter.status;
  const buses = await Bus.find(q).sort({ createdAt: 1 });
  return buses.map(busView);
}

export async function getBus(id: string) {
  const bus = await Bus.findById(id);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");
  return {
    ...busView(bus),
    seatMap: buildSeatMap(bus.busClass as BusClass, bus.size as BusSize),
  };
}

export async function createBus(input: BusInput) {
  return busView(await Bus.create(input));
}

export async function updateBus(id: string, input: Partial<BusInput>) {
  const bus = await Bus.findById(id);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");

  const layoutChanges =
    (input.busClass && input.busClass !== bus.busClass) || (input.size && input.size !== bus.size);

  // Changing class/size would change the seat map under existing bookings.
  if (
    layoutChanges &&
    (await Trip.exists({ busId: bus._id, status: "SCHEDULED", "bookedSeats.0": { $exists: true } }))
  ) {
    throw new AppError(
      409,
      "BUS_HAS_BOOKINGS",
      "لا يمكن تغيير درجة أو حجم باص عليه رحلات قادمة فيها حجوزات",
    );
  }

  bus.set(input);
  await bus.save();
  return busView(bus);
}

export async function deleteBus(id: string) {
  const bus = await Bus.findById(id);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");
  if ((await Trip.exists({ busId: bus._id })) || (await TripSchedule.exists({ busId: bus._id }))) {
    throw new AppError(409, "BUS_IN_USE", "الباص مرتبط برحلات أو جداول، حوّله إلى صيانة بدل حذفه");
  }
  await bus.deleteOne();
}

/** The bus must exist and be in service to get new trips. */
export async function requireActiveBus(busId: string) {
  const bus = await Bus.findById(busId);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");
  if (bus.status !== "ACTIVE") {
    throw new AppError(409, "BUS_IN_MAINTENANCE", "الباص في الصيانة ولا يمكن إسناد رحلات له");
  }
  return bus;
}

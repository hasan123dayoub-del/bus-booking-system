import { BusClass, BusSize, BusStatus } from "../constants";
import { Bus, Trip } from "../models";
import { AppError } from "../utils/appError";
import { buildSeatMap, seatCount } from "../utils/seatMap";

type BusInput = { plateNumber: string; busClass: BusClass; size: BusSize; status?: BusStatus };

const withSeats = (bus: InstanceType<typeof Bus>) => ({
  ...bus.toJSON(),
  seatCount: seatCount(bus.busClass as BusClass, bus.size as BusSize),
});

export async function listBuses(filter: { busClass?: string; size?: string; status?: string }) {
  const q: Record<string, string> = {};
  if (filter.busClass) q.busClass = filter.busClass;
  if (filter.size) q.size = filter.size;
  if (filter.status) q.status = filter.status;
  const buses = await Bus.find(q).sort({ createdAt: -1 });
  return buses.map(withSeats);
}

export async function getBus(id: string) {
  const bus = await Bus.findById(id);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");
  return {
    ...withSeats(bus),
    seatMap: buildSeatMap(bus.busClass as BusClass, bus.size as BusSize),
  };
}

export async function createBus(input: BusInput) {
  return withSeats(await Bus.create(input));
}

export async function updateBus(id: string, input: Partial<BusInput>) {
  const bus = await Bus.findById(id);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");

  const layoutChanges =
    (input.busClass && input.busClass !== bus.busClass) || (input.size && input.size !== bus.size);

  // Changing class/size would change the seat map under existing bookings.
  if (layoutChanges && (await Trip.exists({ busId: bus._id, "bookedSeats.0": { $exists: true } }))) {
    throw new AppError(409, "BUS_HAS_BOOKINGS", "لا يمكن تغيير درجة أو حجم باص عليه رحلات فيها حجوزات");
  }

  bus.set(input);
  await bus.save();
  return withSeats(bus);
}

export async function deleteBus(id: string) {
  const bus = await Bus.findById(id);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");
  if (await Trip.exists({ busId: bus._id })) {
    throw new AppError(409, "BUS_IN_USE", "الباص مرتبط برحلات، عطّله بدل حذفه");
  }
  await bus.deleteOne();
}

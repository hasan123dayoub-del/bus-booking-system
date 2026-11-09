import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function ReceptionLayout({ children }: { children: ReactNode }) {
  return <AppShell role="RECEPTIONIST">{children}</AppShell>;
}

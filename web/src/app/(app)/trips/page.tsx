"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { PageHeader, Segmented } from "@/components/ui";
import { SchedulesTab } from "./schedules-tab";
import { TripsTab } from "./trips-tab";

export default function TripsPage() {
  const [tab, setTab] = useState<"TRIPS" | "SCHEDULES">("TRIPS");
  const [creating, setCreating] = useState(0); // bump to open the create form

  return (
    <>
      <PageHeader title="الرحلات والجداول" subtitle="أنشئ الرحلات يدويًا أو دع الجداول المجدولة تولّدها تلقائيًا" />
      <div className="tabs-row">
        <Segmented
          className="tabs"
          value={tab}
          onChange={setTab}
          options={[
            { value: "TRIPS", label: "الرحلات" },
            { value: "SCHEDULES", label: "الجداول المجدولة" },
          ]}
        />
        <button type="button" className="btn btn-primary btn-create" onClick={() => setCreating((n) => n + 1)}>
          <Icon name="plus" size={20} />
          {tab === "TRIPS" ? "إنشاء رحلة" : "إنشاء جدول"}
        </button>
      </div>
      {tab === "TRIPS" ? <TripsTab createSignal={creating} /> : <SchedulesTab createSignal={creating} />}
    </>
  );
}

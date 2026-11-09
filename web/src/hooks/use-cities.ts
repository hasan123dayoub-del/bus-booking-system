"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { City } from "@/types/domain";

function normalizeCities(value: unknown): City[] {
  if (!Array.isArray(value)) {
    throw new Error("استجابة المدن يجب أن تكون قائمة");
  }
  return value.map((item, index) => {
    if (typeof item === "string") {
      return { name: item, value: item };
    }
    if (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      typeof item.name === "string"
    ) {
      const valueText =
        "value" in item && typeof item.value === "string"
          ? item.value
          : item.name;
      return { name: item.name, value: valueText };
    }
    throw new Error(`صيغة المدينة رقم ${index + 1} غير صالحة`);
  });
}

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const response = await apiRequest<unknown>("/cities");
      setCities(normalizeCities(response));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل المدن");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => { void reload(); }, 0);
    return () => window.clearTimeout(request);
  }, [reload]);

  return { cities, loading, error, reload };
}

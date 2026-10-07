import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);

export const formatDateTime = (value?: string | null) => {
  if (!value) return "No data";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

export const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

export const statusTone = (status: string) => {
  if (status === "ONLINE" || status === "FULL") return "success";
  if (status === "LOW" || status === "MAINTENANCE") return "warning";
  if (status === "CRITICAL" || status === "OFFLINE") return "danger";
  return "neutral";
};

export const getRssiStatus = (rssi: number) => {
  if (rssi >= -67) return "GOOD";
  if (rssi >= -75) return "FAIR";
  if (rssi >= -82) return "WEAK";
  return "CRITICAL";
};

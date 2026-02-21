export const API_BASE =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export const API_SECRET_KEY =
  import.meta.env.VITE_API_SECRET_KEY ?? "dev-secret-key-change-in-production";

export const toIso = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (num: number, size = 2) => String(num).padStart(size, "0");
  const year = pad(date.getFullYear(), 4);
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const millis = pad(date.getMilliseconds(), 3);

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetMins = pad(Math.abs(offsetMinutes) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${sign}${offsetHours}:${offsetMins}`;
};

export const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(date);
};

export const getNowParts = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return { date, time };
};

export const toDateInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

export const toTimeInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

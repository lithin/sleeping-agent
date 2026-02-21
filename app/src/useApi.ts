import { useMemo } from "react";
import { API_BASE, API_SECRET_KEY } from "./helpers";

export const useApi = () =>
  useMemo(
    () => ({
      async get<T>(path: string) {
        const response = await fetch(`${API_BASE}${path}`, {
          headers: { "x-api-key": API_SECRET_KEY },
        });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        return (await response.json()) as T;
      },
      async post<T>(path: string, body: unknown) {
        const response = await fetch(`${API_BASE}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_SECRET_KEY,
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed: ${response.status}`);
        }
        return (await response.json()) as T;
      },
      async put<T>(path: string, body: unknown) {
        const response = await fetch(`${API_BASE}${path}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_SECRET_KEY,
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed: ${response.status}`);
        }
        return (await response.json()) as T;
      },
      async delete(path: string) {
        const response = await fetch(`${API_BASE}${path}`, {
          method: "DELETE",
          headers: { "x-api-key": API_SECRET_KEY },
        });
        if (!response.ok && response.status !== 204) {
          const text = await response.text();
          throw new Error(text || `Request failed: ${response.status}`);
        }
      },
    }),
    [],
  );

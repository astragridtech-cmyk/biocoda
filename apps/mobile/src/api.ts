/**
 * Talks to the BioCoda web API (same endpoints the dashboard uses). Set the
 * base URL with EXPO_PUBLIC_API_URL (use your machine's LAN IP when testing on
 * a physical device, e.g. http://192.168.1.20:3000).
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const HEADERS = {
  "content-type": "application/json",
  "x-bc-role": "ecologist",
  "x-bc-tenant": "rb-natural-trust",
};

export type Band = "poor" | "moderate" | "good";

export interface SurveyTask {
  id: string;
  parcelId: string;
  parcelName: string;
  habitatType: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface ParcelDetail {
  parcel: {
    id: string;
    name: string;
    habitatType: string;
    areaHa: number;
    baselineCondition: Band;
    targetCondition: Band;
    byYear: number;
    centroid: [number, number];
  };
  trajectory: {
    status: "on_track" | "at_risk";
    year: number;
    actual: number;
    required: number;
    gap: number;
  };
}

export async function fetchTasks(): Promise<SurveyTask[]> {
  const res = await fetch(`${BASE_URL}/api/mobile/tasks`, { headers: HEADERS });
  if (!res.ok) throw new Error(`tasks ${res.status}`);
  const data = await res.json();
  return data.tasks as SurveyTask[];
}

export async function fetchParcel(id: string): Promise<ParcelDetail> {
  const res = await fetch(`${BASE_URL}/api/mobile/parcels/${id}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`parcel ${res.status}`);
  return (await res.json()) as ParcelDetail;
}

export async function submitVerification(input: {
  parcelId: string;
  condition: Band;
  notes: string;
  photos: string[];
  lng: number;
  lat: number;
}): Promise<{ id: string }> {
  const res = await fetch(`${BASE_URL}/api/mobile/verifications`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`verification ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string };
}

export { BASE_URL };

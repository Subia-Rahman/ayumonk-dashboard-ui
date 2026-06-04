export const USE_MOCK = true;

export async function connectDevice() {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ url: "https://mock-oauth.example.com/connect" }), 500)
    );
  }
  const res = await fetch("/api/wearables/connect-session", { method: "POST" });
  if (!res.ok) throw new Error("Failed to start connect session");
  return res.json();
}

export async function getStatus() {
  if (USE_MOCK) {
    return { connected: true, provider: "Fitbit", lastSync: "2h ago" };
  }
  const res = await fetch("/api/wearables/status");
  if (!res.ok) throw new Error("Failed to fetch wearable status");
  return res.json();
}

export async function getTodayMetrics() {
  if (USE_MOCK) {
    return { sleepMinutes: 445, steps: 8200, restingHr: 61 };
  }
  const res = await fetch("/api/wearables/today");
  if (!res.ok) throw new Error("Failed to fetch today metrics");
  return res.json();
}

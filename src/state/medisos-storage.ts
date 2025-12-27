const prefix = "medisos:";

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(prefix + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T) {
  localStorage.setItem(prefix + key, JSON.stringify(value));
}

export function safeId(prefixStr = "id") {
  return `${prefixStr}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

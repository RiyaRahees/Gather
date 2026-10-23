// Centralized API client and URL builder for EventFlow

export function getApiUrl(path = "") {
  const rawBase =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL)) ||
    (typeof window !== "undefined" && window.__ENV_BACKEND_URL) ||
    (process.env.NODE_ENV === "production" ? "https://gather-backend-fidw.onrender.com" : "");

  let baseUrl = (rawBase || "").trim().replace(/\/+$/, "");
  if (baseUrl.includes("localhost:5000")) {
    baseUrl = baseUrl.replace("localhost:5000", "127.0.0.1:5000");
  }

  if (baseUrl) {
    if (baseUrl.endsWith("/api")) {
      const cleanPath = path.startsWith("/api") ? path.slice(4) : path;
      return `${baseUrl}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
    } else {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return `${baseUrl}${cleanPath}`;
    }
  }

  // Fallback for local development:
  if (typeof window !== "undefined") {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `http://127.0.0.1:5000${cleanPath}`;
}

export async function fetchApi(endpoint, options = {}) {
  const url = getApiUrl(endpoint);

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    credentials: "include", // send/receive HTTP-only session cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "An API error occurred");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default fetchApi;

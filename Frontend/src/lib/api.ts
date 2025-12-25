// src/lib/api.ts
export const BASE_URL = "https://atalbhujal.onrender.com"; // FastAPI backend

// Helper for POST requests
export async function postData(endpoint: string, data: any) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error("API POST error:", err);
    throw err;
  }
}

// Helper for GET requests
export async function getData(endpoint: string) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error("API GET error:", err);
    throw err;
  }
}

/** Appels API internes Next (cookie httpOnly inclus). */
export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: string }).error === 'string'
        ? (body as { error: string }).error
        : res.statusText;
    throw new Error(msg);
  }
  return body as T;
}

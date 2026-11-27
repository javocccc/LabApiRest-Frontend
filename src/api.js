export function endpoint(base, resource, id) {
  const prefix = (base || '/api').replace(/\/+$/, '');
  return `${prefix}/${resource}/${id == null ? '' : `${id}/`}`;
}
export async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
  } catch { throw new Error('No se pudo conectar con la API.'); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.detail || `La solicitud falló (${response.status}).`);
    error.fields = data && typeof data === 'object' ? data : {};
    throw error;
  }
  return data;
}

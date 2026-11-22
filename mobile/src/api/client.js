import { API_URL } from '../config.js';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let _sesionExpiradaHandler = null;

function registrarSesionExpirada(fn) {
  _sesionExpiradaHandler = fn;
}

function buildQuery(query) {
  if (!query || Object.keys(query).length === 0) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  }
  const qs = params.toString();
  return qs.length ? `?${qs}` : '';
}

async function request(method, path, options = {}) {
  const { query, body, token } = options;

  if (!API_URL) {
    throw new ApiError('No se encontró la URL del servidor. Verifica tu configuración.', 0, 'CONFIG_ERROR');
  }

  const url = `${API_URL}${path}${buildQuery(query)}`;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const fetchOptions = {
      method,
      headers,
      signal: controller.signal,
    };
    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 204) {
      return null;
    }

    let json;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (response.ok) {
      return json;
    }

    if (json && json.error) {
      const error = new ApiError(json.error.message, response.status, json.error.code);
      
      if (response.status === 401 && path !== '/auth/login') {
        if (_sesionExpiradaHandler) {
          _sesionExpiradaHandler();
        }
      }
      
      throw error;
    }

    throw new ApiError(
      `La respuesta del servidor fue inesperada (status ${response.status}).`,
      response.status,
      'UNKNOWN_ERROR'
    );
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('La conexión tardó demasiado. Verificá tu internet.', 0, 'NETWORK_ERROR');
    }

    throw new ApiError('No se pudo conectar al servidor. Verificá tu conexión a internet.', 0, 'NETWORK_ERROR');
  }
}

export { ApiError, request, registrarSesionExpirada };

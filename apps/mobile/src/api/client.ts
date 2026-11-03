import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URLS = {
  production: 'https://hatgaosky.onrender.com/api',
  local: 'http://localhost:4000/api',
  androidEmulator: 'http://10.0.2.2:4000/api',
};

// Default to production so Expo Go works immediately on real phones, with fallback capability
let currentBaseUrl = API_BASE_URLS.production;

export const setApiBaseUrl = (url: string) => {
  currentBaseUrl = url;
};

export const getApiBaseUrl = () => currentBaseUrl;

const TOKEN_KEY = '@vietsky_token';

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('Failed to save token', e);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('Failed to clear token', e);
  }
};

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${currentBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.message || data?.error || `Lỗi máy chủ (${res.status})`;
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }

    return data as T;
  } catch (err: any) {
    // If production fails or is sleeping, give informative error
    console.warn(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

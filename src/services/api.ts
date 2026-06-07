import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'changuita_access_token';

async function getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
}

async function request<T>(method: string, path: string, body?: object): Promise<T> {
    const token = await getToken();
    console.log(`[API] ${method} ${API_URL}${path}`);
    console.log(`[API] token:`, token ? token.substring(0, 20) + '...' : 'null');
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Error ${res.status}`);
    }

    return res.json();
}

// ── Emprendimientos ───────────────────────────────────────────────────────────
export const getMisEmprendimientos = () =>
    request<any[]>('GET', '/emprendimientos');

export const crearEmprendimiento = (data: { nombre: string; descripcion?: string }) =>
    request<any>('POST', '/emprendimientos', data);

// ── Gastos ────────────────────────────────────────────────────────────────────
export const getGastos = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/gastos`);

export const crearGasto = (emprendimientoId: number, data: {
    descripcion: string;
    monto: number;
    fecha: string;
    categoriaId?: number;
}) => request<any>('POST', `/emprendimientos/${emprendimientoId}/gastos`, data);

export const getCategoriasGasto = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/categorias-gasto`);

// ── Ventas ────────────────────────────────────────────────────────────────────
export const getVentas = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/ventas`);

export const crearVenta = (emprendimientoId: number, data: object) => {
    console.log('[crearVenta] data:', JSON.stringify(data));
    return request<any>('POST', `/emprendimientos/${emprendimientoId}/ventas`, data);
};

// ── Productos ─────────────────────────────────────────────────────────────────
export const getProductos = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/productos?includeVariantes=true`);

export const crearProducto = (emprendimientoId: number, data: object) =>
    request<any>('POST', `/emprendimientos/${emprendimientoId}/productos`, data);

export const syncUsuario = async (token: string) => {
    const url = `${API_URL}/auth/sync`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await res.json();
    console.log('[sync] response:', JSON.stringify(data));
    return data;
};

export const getClientes = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/clientes`);

export const crearCategoriaGasto = (emprendimientoId: number, data: { nombre: string }) =>
    request<any>('POST', `/emprendimientos/${emprendimientoId}/categorias-gasto`, data);
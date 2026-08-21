import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'changuita_access_token';

async function getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
}

// La app registra acá un callback (en AuthContext) para desloguear
// automáticamente cuando el backend rechaza el token (sesión vencida).
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: () => void) {
    onUnauthorized = fn;
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
        if (res.status === 401) {
            onUnauthorized?.();
            throw new Error('Tu sesión expiró. Iniciá sesión de nuevo.');
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.message ?? `Error ${res.status}`);
    }

    return res.json();
}

// ── Emprendimientos ───────────────────────────────────────────────────────────
export const getMisEmprendimientos = () =>
    request<any[]>('GET', '/emprendimientos');

export const crearEmprendimiento = (data: { nombre: string; descripcion?: string }) =>
    request<any>('POST', '/emprendimientos', data);

export const actualizarEmprendimiento = (id: number, data: { nombre?: string; descripcion?: string }) =>
    request<any>('PUT', `/emprendimientos/${id}`, data);

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

export const getGastosRecurrentes = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/gastos-recurrentes`);

// ── Ventas ────────────────────────────────────────────────────────────────────
export const getVentas = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/ventas`);

export const crearVenta = (emprendimientoId: number, data: object) => {
    console.log('[crearVenta] data:', JSON.stringify(data));
    return request<any>('POST', `/emprendimientos/${emprendimientoId}/ventas`, data);
};

export const actualizarEstadoVenta = (emprendimientoId: number, id: number, estado: string) =>
    request<any>('PATCH', `/emprendimientos/${emprendimientoId}/ventas/${id}/estado`, { estado });

// ── Productos ─────────────────────────────────────────────────────────────────
export const getProductos = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/productos?includeVariantes=true`);

export const crearProducto = (emprendimientoId: number, data: object) =>
    request<any>('POST', `/emprendimientos/${emprendimientoId}/productos`, data);

export const actualizarProducto = (emprendimientoId: number, id: number, data: object) =>
    request<any>('PUT', `/emprendimientos/${emprendimientoId}/productos/${id}`, data);

export const eliminarProducto = (emprendimientoId: number, id: number) =>
    request<any>('DELETE', `/emprendimientos/${emprendimientoId}/productos/${id}`);

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

export const completarOnboarding = () =>
    request<any>('PATCH', '/auth/onboarding');

// ── Perfil ────────────────────────────────────────────────────────────────────
export const actualizarPerfil = (nombre: string) =>
    request<any>('PUT', '/auth/me', { nombre });

export const getClientes = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/clientes`);

export const crearCliente = (emprendimientoId: number, data: {
    nombre: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    notas?: string;
}) => request<any>('POST', `/emprendimientos/${emprendimientoId}/clientes`, data);

export const actualizarCliente = (emprendimientoId: number, id: number, data: {
    nombre: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    notas?: string;
}) => request<any>('PUT', `/emprendimientos/${emprendimientoId}/clientes/${id}`, data);

export const eliminarCliente = (emprendimientoId: number, id: number) =>
    request<any>('DELETE', `/emprendimientos/${emprendimientoId}/clientes/${id}`);

export const crearCategoriaGasto = (emprendimientoId: number, data: { nombre: string }) =>
    request<any>('POST', `/emprendimientos/${emprendimientoId}/categorias-gasto`, data);

// ── Pedidos ───────────────────────────────────────────────────────────────────
export const getPedidos = (emprendimientoId: number) =>
    request<any[]>('GET', `/emprendimientos/${emprendimientoId}/pedidos`);

export const crearPedido = (emprendimientoId: number, data: {
    clienteId?: number;
    fechaEstimada?: string;
    notas?: string;
    detalles: { varianteId: number; cantidad: number; precioUnitario: number }[];
}) => request<any>('POST', `/emprendimientos/${emprendimientoId}/pedidos`, data);

export const actualizarEstadoPedido = (emprendimientoId: number, id: number, estado: string) =>
    request<any>('PATCH', `/emprendimientos/${emprendimientoId}/pedidos/${id}/estado`, { estado });

export const cancelarPedido = (emprendimientoId: number, id: number) =>
    request<any>('DELETE', `/emprendimientos/${emprendimientoId}/pedidos/${id}`);
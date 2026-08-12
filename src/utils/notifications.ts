import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getProductos, getGastosRecurrentes, getVentas } from '../services/api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Notificaciones push reales requieren un dev build (Expo Go ya no las
// soporta); usamos notificaciones locales disparadas por la propia app,
// que sí funcionan en Expo Go y cumplen el mismo rol para el usuario.
async function pedirPermiso(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status: existente } = await Notifications.getPermissionsAsync();
    if (existente === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

const hoyKey = () => new Date().toISOString().split('T')[0];

async function yaNotificadoHoy(key: string): Promise<boolean> {
    const marca = await AsyncStorage.getItem(`notif_${key}`);
    return marca === hoyKey();
}

async function marcarNotificadoHoy(key: string) {
    await AsyncStorage.setItem(`notif_${key}`, hoyKey());
}

async function notificar(key: string, title: string, body: string) {
    if (await yaNotificadoHoy(key)) return;
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
    await marcarNotificadoHoy(key);
}

async function chequearStockBajo(emprendimientoId: number) {
    const productos = await getProductos(emprendimientoId);
    const agotados = productos.filter((p: any) => p.activo && p.stockTotal === 0);
    const bajos = productos.filter((p: any) => p.activo && p.stockTotal > 0 && p.stockTotal <= p.stockMinimo);
    const criticos = agotados.length + bajos.length;
    if (criticos === 0) return;
    await notificar(
        `stock_${emprendimientoId}`,
        'Stock crítico',
        `Tenés ${criticos} producto${criticos > 1 ? 's' : ''} con stock bajo o agotado.`,
    );
}

async function chequearGastosRecurrentes(emprendimientoId: number) {
    const recurrentes = await getGastosRecurrentes(emprendimientoId);
    const ahora = new Date();
    const limite = new Date(ahora);
    limite.setDate(limite.getDate() + 3);
    const porVencer = recurrentes.filter((g: any) => {
        const fecha = new Date(g.proximaFecha);
        return fecha >= ahora && fecha <= limite;
    });
    if (porVencer.length === 0) return;
    const nombres = porVencer.map((g: any) => g.descripcion).slice(0, 3).join(', ');
    await notificar(
        `gastosrec_${emprendimientoId}`,
        porVencer.length > 1 ? 'Gastos recurrentes por vencer' : 'Gasto recurrente por vencer',
        `${nombres}${porVencer.length > 3 ? '…' : ''}`,
    );
}

async function chequearCobrosPendientes(emprendimientoId: number) {
    const ventas = await getVentas(emprendimientoId);
    const ahora = new Date();
    const pendientesViejas = ventas.filter((v: any) => {
        if (v.estado !== 'PENDIENTE') return false;
        const dias = (ahora.getTime() - new Date(v.fecha).getTime()) / (1000 * 60 * 60 * 24);
        return dias >= 3;
    });
    if (pendientesViejas.length === 0) return;
    const total = pendientesViejas.reduce((acc: number, v: any) => acc + Number(v.total), 0);
    await notificar(
        `cobrospend_${emprendimientoId}`,
        'Cobros pendientes',
        `Tenés ${pendientesViejas.length} venta${pendientesViejas.length > 1 ? 's' : ''} pendiente${pendientesViejas.length > 1 ? 's' : ''} de cobro por $${total.toLocaleString('es-AR')}.`,
    );
}

export async function chequearRecordatorios(emprendimientoId: number) {
    const permitido = await pedirPermiso();
    if (!permitido) return;

    // Cada chequeo es independiente: si uno falla (ej. endpoint caído),
    // no debe frenar a los demás.
    await Promise.allSettled([
        chequearStockBajo(emprendimientoId),
        chequearGastosRecurrentes(emprendimientoId),
        chequearCobrosPendientes(emprendimientoId),
    ]);
}

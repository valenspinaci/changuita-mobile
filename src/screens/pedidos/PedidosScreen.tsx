import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { useEmprendimiento } from '../../context/EmprendimientoContext';
import { getPedidos, actualizarEstadoPedido, cancelarPedido } from '../../services/api';
import { colors, spacing, radius, shadow, typography } from '../../theme';

type EstadoPedido = 'PENDIENTE' | 'ACTIVO' | 'ENTREGADO' | 'CANCELADO';

interface DetallePedido {
    cantidad: number;
    precioUnitario: string;
    variante: { producto: { nombre: string } };
}

interface Pedido {
    id: number;
    estado: EstadoPedido;
    fechaEstimada?: string;
    notas?: string;
    cliente?: { nombre: string };
    detalles: DetallePedido[];
}

const ESTADOS: { key: EstadoPedido; label: string; color: string }[] = [
    { key: 'PENDIENTE', label: 'Pendientes', color: colors.warning },
    { key: 'ACTIVO', label: 'Activos', color: colors.primary },
    { key: 'ENTREGADO', label: 'Entregados', color: colors.textSecondary },
];

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
    PENDIENTE: 'ACTIVO',
    ACTIVO: 'ENTREGADO',
};

const formatMonto = (n: number) =>
    '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0 });

const formatFecha = (f?: string) => {
    if (!f) return null;
    return new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const totalPedido = (p: Pedido) =>
    p.detalles.reduce((acc, d) => acc + d.cantidad * Number(d.precioUnitario), 0);

export default function PedidosScreen() {
    const { emprendimientoActivo } = useEmprendimiento();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actualizandoId, setActualizandoId] = useState<number | null>(null);

    const cargar = useCallback(async () => {
        if (!emprendimientoActivo) return;
        try {
            const data = await getPedidos(emprendimientoActivo.id);
            setPedidos(data);
        } catch (err: any) {
            showAlert('Error', err.message ?? 'No pudimos cargar los pedidos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [emprendimientoActivo]);

    useEffect(() => { cargar(); }, [cargar]);
    const onRefresh = () => { setRefreshing(true); cargar(); };

    const handleAvanzar = async (pedido: Pedido) => {
        const siguiente = SIGUIENTE_ESTADO[pedido.estado];
        if (!siguiente || !emprendimientoActivo) return;
        setActualizandoId(pedido.id);
        try {
            await actualizarEstadoPedido(emprendimientoActivo.id, pedido.id, siguiente);
            cargar();
        } catch (err: any) {
            showAlert('Error', err.message ?? 'No pudimos actualizar el pedido');
        } finally {
            setActualizandoId(null);
        }
    };

    const handleCancelar = (pedido: Pedido) => {
        showAlert(
            'Cancelar pedido',
            `¿Seguro que querés cancelar el pedido #${pedido.id}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
                        if (!emprendimientoActivo) return;
                        setActualizandoId(pedido.id);
                        try {
                            await cancelarPedido(emprendimientoActivo.id, pedido.id);
                            cargar();
                        } catch (err: any) {
                            showAlert('Error', err.message ?? 'No pudimos cancelar el pedido');
                        } finally {
                            setActualizandoId(null);
                        }
                    },
                },
            ],
        );
    };

    if (loading) {
        return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={s.safe}>
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.titleRow}>
                    <Text style={s.heading}>Pedidos</Text>
                    <Text style={s.sub}>Seguí el estado de tus pedidos de un vistazo</Text>
                </View>

                {ESTADOS.map(({ key, label, color }) => {
                    const items = pedidos.filter(p => p.estado === key);
                    return (
                        <View key={key} style={s.section}>
                            <View style={s.sectionHeader}>
                                <View style={[s.dot, { backgroundColor: color }]} />
                                <Text style={s.sectionTitle}>{label}</Text>
                                <Text style={s.contador}>{items.length}</Text>
                            </View>

                            {items.length === 0 ? (
                                <View style={s.empty}>
                                    <Text style={s.emptyText}>Sin pedidos {label.toLowerCase()}</Text>
                                </View>
                            ) : (
                                items.map(p => {
                                    const siguiente = SIGUIENTE_ESTADO[p.estado];
                                    const ocupado = actualizandoId === p.id;
                                    return (
                                        <View key={p.id} style={s.card}>
                                            <View style={s.cardHeader}>
                                                <Text style={s.cardCliente}>
                                                    {p.cliente?.nombre ?? `Pedido #${p.id}`}
                                                </Text>
                                                <Text style={s.cardMonto}>{formatMonto(totalPedido(p))}</Text>
                                            </View>

                                            <Text style={s.cardProductos} numberOfLines={2}>
                                                {p.detalles.map(d => `${d.cantidad}× ${d.variante.producto.nombre}`).join(', ')}
                                            </Text>

                                            {p.fechaEstimada && (
                                                <Text style={s.cardFecha}>Entrega estimada: {formatFecha(p.fechaEstimada)}</Text>
                                            )}
                                            {p.notas && <Text style={s.cardNotas} numberOfLines={2}>{p.notas}</Text>}

                                            <View style={s.cardAcciones}>
                                                {siguiente && (
                                                    <TouchableOpacity
                                                        style={[s.avanzarBtn, ocupado && s.disabled]}
                                                        onPress={() => handleAvanzar(p)}
                                                        disabled={ocupado}
                                                        activeOpacity={0.85}
                                                    >
                                                        {ocupado
                                                            ? <ActivityIndicator color="#fff" size="small" />
                                                            : <Text style={s.avanzarBtnText}>Marcar como {siguiente === 'ACTIVO' ? 'activo' : 'entregado'} →</Text>
                                                        }
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    style={s.cancelarBtn}
                                                    onPress={() => handleCancelar(p)}
                                                    disabled={ocupado}
                                                    activeOpacity={0.85}
                                                >
                                                    <Text style={s.cancelarBtnText}>Cancelar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: spacing.xxl },

    titleRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2 },
    sub: { ...typography.bodySecondary, marginTop: 2 },

    section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4 },
    sectionTitle: { ...typography.h4, flex: 1 },
    contador: { ...typography.bodySecondary, fontWeight: '600' },

    empty: {
        backgroundColor: colors.white, borderRadius: radius.md,
        paddingVertical: spacing.lg, alignItems: 'center',
    },
    emptyText: { ...typography.bodySecondary },

    card: {
        backgroundColor: colors.white, borderRadius: radius.md,
        padding: spacing.md, marginBottom: spacing.sm, ...shadow.sm,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardCliente: { ...typography.body, fontWeight: '600', flex: 1 },
    cardMonto: { fontSize: 15, fontWeight: '700', color: colors.text },
    cardProductos: { ...typography.bodySecondary, marginTop: spacing.xs },
    cardFecha: { ...typography.caption, marginTop: spacing.xs },
    cardNotas: { ...typography.caption, marginTop: spacing.xs, fontStyle: 'italic' },

    cardAcciones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    disabled: { opacity: 0.7 },
    avanzarBtn: {
        flex: 1, height: 40, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.sm, backgroundColor: colors.primary,
    },
    avanzarBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    cancelarBtn: {
        height: 40, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
    },
    cancelarBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
});

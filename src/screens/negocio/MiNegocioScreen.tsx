import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, RefreshControl,
    Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { useEmprendimiento } from '../../context/EmprendimientoContext';
import { getVentas, getGastos, getProductos, actualizarEmprendimiento } from '../../services/api';
import { colors, spacing, radius, shadow, typography } from '../../theme';

type Periodo = 'hoy' | 'semana' | 'mes';

interface Venta {
    id: number;
    estado: string;
    total: string;
    fecha: string;
    notas?: string;
    cliente?: { nombre: string };
}

interface Gasto {
    id: number;
    monto: string;
    fecha: string;
    descripcion: string;
}

interface Producto {
    id: number;
    nombre: string;
    stockTotal: number;
    stockMinimo: number;
    activo: boolean;
}

const formatMonto = (n: number) =>
    '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString()) {
        return `Hoy, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const filtrarPorPeriodo = <T extends { fecha: string }>(items: T[], periodo: Periodo): T[] => {
    const ahora = new Date();
    return items.filter(item => {
        const fecha = new Date(item.fecha);
        if (periodo === 'hoy') return fecha.toDateString() === ahora.toDateString();
        if (periodo === 'semana') {
            const inicioSemana = new Date(ahora);
            const dia = ahora.getDay() === 0 ? 7 : ahora.getDay();
            inicioSemana.setDate(ahora.getDate() - dia + 1);
            inicioSemana.setHours(0, 0, 0, 0);
            return fecha >= inicioSemana;
        }
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    });
};

interface Props { onNavigate?: (key: string) => void }

export default function MiNegocioScreen({ onNavigate }: Props) {
    const { emprendimientoActivo, setEmprendimientoActivo } = useEmprendimiento();
    const [periodo, setPeriodo] = useState<Periodo>('hoy');
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [editandoNegocio, setEditandoNegocio] = useState(false);
    const [nombreNegocio, setNombreNegocio] = useState('');
    const [descripcionNegocio, setDescripcionNegocio] = useState('');
    const [guardandoNegocio, setGuardandoNegocio] = useState(false);

    const abrirEdicionNegocio = () => {
        setNombreNegocio(emprendimientoActivo?.nombre ?? '');
        setDescripcionNegocio(emprendimientoActivo?.descripcion ?? '');
        setEditandoNegocio(true);
    };

    const handleGuardarNegocio = async () => {
        if (!nombreNegocio.trim()) { showAlert('Error', 'El nombre no puede estar vacío'); return; }
        if (!emprendimientoActivo) return;
        setGuardandoNegocio(true);
        try {
            const actualizado = await actualizarEmprendimiento(emprendimientoActivo.id, {
                nombre: nombreNegocio.trim(),
                descripcion: descripcionNegocio.trim() || undefined,
            });
            setEmprendimientoActivo(actualizado);
            setEditandoNegocio(false);
        } catch (err: any) {
            showAlert('Error', err.message ?? 'No pudimos actualizar el negocio');
        } finally {
            setGuardandoNegocio(false);
        }
    };

    const cargar = useCallback(async () => {
        if (!emprendimientoActivo) return;
        try {
            const [v, g, p] = await Promise.all([
                getVentas(emprendimientoActivo.id),
                getGastos(emprendimientoActivo.id),
                getProductos(emprendimientoActivo.id),
            ]);
            setVentas(v);
            setGastos(g);
            setProductos(p);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [emprendimientoActivo]);

    useEffect(() => { cargar(); }, [cargar]);
    const onRefresh = () => { setRefreshing(true); cargar(); };

    if (loading) {
        return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    const ventasFiltradas = filtrarPorPeriodo(ventas, periodo);
    const gastosFiltrados = filtrarPorPeriodo(gastos, periodo);
    const totalVentas = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.total), 0);
    const totalGastos = gastosFiltrados.reduce((acc, g) => acc + parseFloat(g.monto), 0);
    const gananciaEstimada = totalVentas - totalGastos;

    const ventasRecientes = [...ventas]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5);

    const productosAgotados = productos.filter(p => p.activo && p.stockTotal === 0);
    const productosBajoStock = productos.filter(p => p.activo && p.stockTotal > 0 && p.stockTotal <= p.stockMinimo);
    const totalCriticos = productosAgotados.length + productosBajoStock.length;

    return (
        <View style={s.safe}>
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.titleRow}>
                    <Text style={s.heading}>Mi Negocio</Text>
                    <TouchableOpacity style={s.negocioRow} onPress={abrirEdicionNegocio} activeOpacity={0.7}>
                        <Text style={s.sub}>{emprendimientoActivo?.nombre ?? 'Resumen de tu negocio'}</Text>
                        <Text style={s.editarNegocioText}>Editar</Text>
                    </TouchableOpacity>
                </View>

                {/* Selector de período */}
                <View style={s.periodoSelector}>
                    {(['hoy', 'semana', 'mes'] as Periodo[]).map(p => (
                        <TouchableOpacity
                            key={p}
                            style={[s.periodoBtn, periodo === p && s.periodoBtnActive]}
                            onPress={() => setPeriodo(p)}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.periodoBtnText, periodo === p && s.periodoBtnTextActive]}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Ventas totales */}
                <View style={s.ventasCard}>
                    <Text style={s.ventasLabel}>VENTAS TOTALES</Text>
                    <Text style={s.ventasMonto}>{formatMonto(totalVentas)}</Text>
                    <Text style={s.ventasCount}>{ventasFiltradas.length} ventas en el período</Text>
                </View>

                {/* Gastos + Ganancia */}
                <View style={s.metricRow}>
                    <View style={s.metricCard}>
                        <Text style={s.metricLabel}>GASTOS</Text>
                        <Text style={s.metricValue}>{formatMonto(totalGastos)}</Text>
                    </View>
                    <View style={[s.metricCard, s.metricCardPrimary]}>
                        <Text style={s.metricLabelLight}>GANANCIA EST.</Text>
                        <Text style={[s.metricValue, s.metricValueLight]}>{formatMonto(gananciaEstimada)}</Text>
                    </View>
                </View>

                {/* Alerta stock crítico */}
                {totalCriticos > 0 && (
                    <TouchableOpacity
                        style={s.alertaCard}
                        onPress={() => onNavigate?.('stock')}
                        activeOpacity={0.85}
                    >
                        <View style={s.alertaIconWrap}><Text style={s.alertaIcon}>⚠️</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.alertaTitulo}>Alerta de Stock Crítico</Text>
                            <Text style={s.alertaTexto}>
                                {productosAgotados.length > 0 && `${productosAgotados.length} sin existencias`}
                                {productosAgotados.length > 0 && productosBajoStock.length > 0 && ' • '}
                                {productosBajoStock.length > 0 && `${productosBajoStock.length} bajo stock mínimo`}
                            </Text>
                        </View>
                        <Text style={s.alertaFlecha}>→</Text>
                    </TouchableOpacity>
                )}

                {/* Acciones rápidas */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Acciones Rápidas</Text>
                    <View style={s.accionesRow}>
                        {[
                            { label: 'Nueva Venta', key: 'ventas', emoji: '🛒' },
                            { label: 'Nuevo Gasto', key: 'gastos', emoji: '💳' },
                            { label: 'Ver Stock', key: 'stock', emoji: '📦' },
                        ].map(a => (
                            <TouchableOpacity
                                key={a.key}
                                style={s.accionBtn}
                                onPress={() => onNavigate?.(a.key)}
                                activeOpacity={0.85}
                            >
                                <Text style={s.accionEmoji}>{a.emoji}</Text>
                                <Text style={s.accionLabel}>{a.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Ventas recientes */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Ventas Recientes</Text>
                        <TouchableOpacity onPress={() => onNavigate?.('ventas')}>
                            <Text style={s.verTodo}>Ver todas →</Text>
                        </TouchableOpacity>
                    </View>

                    {ventasRecientes.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={s.emptyText}>No hay ventas todavía</Text>
                        </View>
                    ) : (
                        <View style={s.card}>
                            {ventasRecientes.map((v, i) => (
                                <View key={v.id} style={[s.ventaRow, i > 0 && s.ventaRowBorder]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.ventaNotas} numberOfLines={1}>
                                            {v.notas || `Venta #${v.id}`}
                                        </Text>
                                        <Text style={s.ventaMeta}>
                                            {v.cliente ? v.cliente.nombre : 'Sin cliente'} • {formatFecha(v.fecha)}
                                        </Text>
                                    </View>
                                    <Text style={s.ventaMonto}>{formatMonto(parseFloat(v.total))}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal editar negocio */}
            <Modal visible={editandoNegocio} transparent animationType="fade">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditandoNegocio(false)}>
                        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
                            <Text style={s.modalTitle}>Editar negocio</Text>

                            <Text style={s.fieldLabel}>NOMBRE</Text>
                            <TextInput
                                style={s.textInput}
                                value={nombreNegocio}
                                onChangeText={setNombreNegocio}
                                placeholder="Nombre del negocio"
                                placeholderTextColor={colors.placeholder}
                                autoCapitalize="words"
                            />

                            <Text style={[s.fieldLabel, { marginTop: spacing.md }]}>DESCRIPCIÓN (OPCIONAL)</Text>
                            <TextInput
                                style={[s.textInput, s.textArea]}
                                value={descripcionNegocio}
                                onChangeText={setDescripcionNegocio}
                                placeholder="¿A qué se dedica tu negocio?"
                                placeholderTextColor={colors.placeholder}
                                multiline
                            />

                            <View style={s.modalBtns}>
                                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditandoNegocio(false)} disabled={guardandoNegocio}>
                                    <Text style={s.cancelBtnText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.saveBtn, guardandoNegocio && s.disabled]}
                                    onPress={handleGuardarNegocio}
                                    disabled={guardandoNegocio}
                                    activeOpacity={0.85}
                                >
                                    {guardandoNegocio
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={s.saveBtnText}>Guardar</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: spacing.xxl },

    titleRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
    negocioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
    editarNegocioText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
        padding: spacing.lg,
    },
    modalTitle: { ...typography.h3, marginBottom: spacing.md },
    fieldLabel: { ...typography.label, marginBottom: spacing.sm },
    textInput: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 48,
        fontSize: 15, color: colors.text,
    },
    textArea: { height: 80, paddingTop: spacing.sm, textAlignVertical: 'top' },
    modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    disabled: { opacity: 0.7 },
    cancelBtn: {
        flex: 1, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    cancelBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },
    saveBtn: {
        flex: 1, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.primary, ...shadow.primary,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    heading: { ...typography.h2 },
    sub: { ...typography.bodySecondary, marginTop: 2 },

    periodoSelector: {
        flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.white, borderRadius: radius.md, padding: 4, gap: 4,
    },
    periodoBtn: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    periodoBtnActive: { backgroundColor: colors.primaryLight },
    periodoBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    periodoBtnTextActive: { color: colors.primary },

    ventasCard: {
        marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.white, borderRadius: radius.lg,
        padding: spacing.lg, ...shadow.sm,
    },
    ventasLabel: { ...typography.label },
    ventasMonto: { fontSize: 36, fontWeight: '800', color: colors.primary, marginTop: 4 },
    ventasCount: { ...typography.bodySecondary, marginTop: spacing.sm },

    metricRow: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.md },
    metricCard: {
        flex: 1, backgroundColor: colors.white, borderRadius: radius.lg,
        padding: spacing.md, ...shadow.sm,
    },
    metricCardPrimary: { backgroundColor: colors.primary },
    metricLabel: { ...typography.label },
    metricLabelLight: { ...typography.label, color: 'rgba(255,255,255,0.75)' },
    metricValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
    metricValueLight: { color: '#fff' },

    alertaCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.errorLight, borderRadius: radius.lg, padding: spacing.md,
    },
    alertaIconWrap: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: colors.error,
        alignItems: 'center', justifyContent: 'center',
    },
    alertaIcon: { fontSize: 18 },
    alertaTitulo: { fontSize: 14, fontWeight: '700', color: colors.error },
    alertaTexto: { ...typography.caption, marginTop: 2 },
    alertaFlecha: { fontSize: 18, color: colors.error },

    section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    sectionTitle: { ...typography.h4, marginBottom: spacing.sm },
    verTodo: { fontSize: 13, color: colors.primary, fontWeight: '500' },

    accionesRow: { flexDirection: 'row', gap: spacing.sm },
    accionBtn: {
        flex: 1, backgroundColor: colors.white, borderRadius: radius.md,
        paddingVertical: spacing.md, alignItems: 'center', gap: spacing.xs, ...shadow.sm,
    },
    accionEmoji: { fontSize: 22 },
    accionLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },

    card: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, ...shadow.sm },
    ventaRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.md,
    },
    ventaRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    ventaNotas: { ...typography.body, fontWeight: '500' },
    ventaMeta: { ...typography.caption, marginTop: 2 },
    ventaMonto: { fontSize: 15, fontWeight: '600', color: colors.text },

    empty: { backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.bodySecondary },
});

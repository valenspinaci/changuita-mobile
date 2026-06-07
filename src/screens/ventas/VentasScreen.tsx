import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, RefreshControl,
    Modal, FlatList, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useEmprendimiento } from '../../context/EmprendimientoContext';
import { getVentas, crearVenta, getProductos, getClientes } from '../../services/api';
import { colors, spacing, radius, shadow, typography } from '../../theme';

interface Venta {
    id: number;
    total: string;
    fecha: string;
    estado: string;
    notas?: string;
    medioPago?: string;
    detalles?: { producto?: { nombre: string }; cantidad: number; precioUnitario: string }[];
    cliente?: { nombre: string };
}

interface Producto {
  id: number;
  nombre: string;
  precio: string;
  stockTotal: number;
  variantes?: { id: number; nombre: string; stock: number }[];
}

interface Cliente {
    id: number;
    nombre: string;
}

interface ItemCarrito {
    producto: Producto;
    cantidad: number;
}

type MedioPago = 'efectivo' | 'tarjeta' | 'transferencia';

const formatMonto = (m: string | number) =>
    '$' + Number(m).toLocaleString('es-AR', { minimumFractionDigits: 0 });

const formatFecha = (f: string) => {
    const d = new Date(f);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' });
};

const calcularStats = (ventas: Venta[]) => {
    const hoy = new Date();
    const mesActual = ventas.filter(v => {
        const f = new Date(v.fecha);
        return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    });
    const mesAnterior = ventas.filter(v => {
        const f = new Date(v.fecha);
        const mes = hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1;
        const anio = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
        return f.getMonth() === mes && f.getFullYear() === anio;
    });
    const totalActual = mesActual.reduce((acc, v) => acc + Number(v.total), 0);
    const totalAnterior = mesAnterior.reduce((acc, v) => acc + Number(v.total), 0);
    const pct = totalAnterior > 0
        ? Math.round(((totalActual - totalAnterior) / totalAnterior) * 100)
        : null;
    const pedidosActivos = ventas.filter(v => v.estado === 'PENDIENTE').length;
    return { totalActual, pct, pedidosActivos };
};

const MEDIOS_PAGO: { key: MedioPago; label: string }[] = [
    { key: 'efectivo', label: 'Efectivo' },
    { key: 'tarjeta', label: 'Tarjeta' },
    { key: 'transferencia', label: 'Transferencia' },
];

export default function VentasScreen({ onNavigate }: { onNavigate?: (key: string) => void }) {
    const { emprendimientoActivo } = useEmprendimiento();
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [showForm, setShowForm] = useState(false);

    const [objetivoMensual, setObjetivoMensual] = useState<number | null>(null);
    const [editandoObjetivo, setEditandoObjetivo] = useState(false);
    const [objetivoInput, setObjetivoInput] = useState('');

    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [cobrado, setCobrado] = useState(false);
    const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
    const [esPedido, setEsPedido] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [showClienteModal, setShowClienteModal] = useState(false);

    const cargar = useCallback(async () => {
        if (!emprendimientoActivo) return;
        try {
            const [v, p, c] = await Promise.all([
                getVentas(emprendimientoActivo.id),
                getProductos(emprendimientoActivo.id),
                getClientes(emprendimientoActivo.id),
            ]);
            setVentas(v);
            setProductos(p);
            setClientes(c);
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos cargar las ventas');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [emprendimientoActivo]);

    useEffect(() => { cargar(); }, [cargar]);
    const onRefresh = () => { setRefreshing(true); cargar(); };

    const agregarAlCarrito = (producto: Producto) => {
        setCarrito(prev => {
            const existe = prev.find(i => i.producto.id === producto.id);
            if (existe) return prev.map(i =>
                i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
            );
            return [...prev, { producto, cantidad: 1 }];
        });
    };

    const cambiarCantidad = (productoId: number, cantidad: number) => {
        if (cantidad <= 0) {
            setCarrito(prev => prev.filter(i => i.producto.id !== productoId));
        } else {
            setCarrito(prev => prev.map(i =>
                i.producto.id === productoId ? { ...i, cantidad } : i
            ));
        }
    };

    const totalCarrito = carrito.reduce(
        (acc, i) => acc + Number(i.producto.precio) * i.cantidad, 0
    );

    const handleGuardar = async () => {
        if (carrito.length === 0) { Alert.alert('Error', 'Agregá al menos un producto'); return; }
        if (!emprendimientoActivo) return;
        setGuardando(true);
    try {
      // Verificar que todos los productos tienen variante
      const detallesConVariante = carrito.map(i => {
        const varianteId = i.producto.variantes?.[0]?.id;
        if (!varianteId) throw new Error(`El producto "${i.producto.nombre}" no tiene variantes configuradas`);
        return {
          varianteId,
          cantidad: i.cantidad,
          precioUnitario: Number(i.producto.precio),
        };
      });

      await crearVenta(emprendimientoActivo.id, {
                total: totalCarrito,
                estado: cobrado ? 'COBRADA' : 'PENDIENTE',
                medioPago: cobrado ? medioPago : undefined,
                clienteId: clienteSeleccionado?.id ?? undefined,
                esPedido,
                fecha: new Date().toISOString(),
                detalles: carrito.map(i => ({
          varianteId: i.producto.variantes?.[0]?.id,
          cantidad: i.cantidad,
          precioUnitario: Number(i.producto.precio),
        })),
            });
            setCarrito([]);
            setClienteSeleccionado(null);
            setCobrado(false);
            setMedioPago('efectivo');
            setEsPedido(false);
            setShowForm(false);
            cargar();
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos registrar la venta');
        } finally {
            setGuardando(false);
        }
    };

    const ventasFiltradas = ventas.filter(v => {
        if (!busqueda) return true;
        const q = busqueda.toLowerCase();
        const prod = v.detalles?.[0]?.producto?.nombre?.toLowerCase() ?? '';
        const cli = v.cliente?.nombre?.toLowerCase() ?? '';
        return prod.includes(q) || cli.includes(q);
    });

    if (loading) {
        return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    const { totalActual, pct, pedidosActivos } = calcularStats(ventas);
    const progreso = objetivoMensual && objetivoMensual > 0
        ? Math.min((totalActual / objetivoMensual) * 100, 100) : 0;

    return (
        <View style={s.safe}>
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.titleRow}>
                    <Text style={s.heading}>Gestión de Ventas</Text>
                    <Text style={s.sub}>Gestioná y monitoreá el rendimiento en tiempo real</Text>
                </View>

                <TouchableOpacity style={s.newBtn} onPress={() => setShowForm(v => !v)} activeOpacity={0.85}>
                    <Text style={s.newBtnText}>{showForm ? '✕ Cerrar' : '+ Nueva Venta'}</Text>
                </TouchableOpacity>

                {/* ── Formulario ── */}
                {showForm && (
                    <View style={s.formCard}>
                        <Text style={s.formTitle}>Registrar Venta</Text>

                        {/* Productos en carrito */}
                        {carrito.length > 0 && (
                            <View style={s.carritoWrap}>
                                {carrito.map(item => (
                                    <View key={item.producto.id} style={s.carritoItem}>
                                        <Text style={s.carritoNombre} numberOfLines={1}>{item.producto.nombre}</Text>
                                        <Text style={s.carritoPrecio}>{formatMonto(Number(item.producto.precio) * item.cantidad)}</Text>
                                        <View style={s.cantidadRow}>
                                            <TouchableOpacity style={s.cantBtn} onPress={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}>
                                                <Text style={s.cantBtnText}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={s.cantidad}>{item.cantidad}</Text>
                                            <TouchableOpacity style={s.cantBtn} onPress={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}>
                                                <Text style={s.cantBtnText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                                <View style={s.totalCarritoRow}>
                                    <Text style={s.totalCarritoLabel}>Total:</Text>
                                    <Text style={s.totalCarritoValue}>{formatMonto(totalCarrito)}</Text>
                                </View>
                            </View>
                        )}

                        {/* Dropdown productos */}
                        <Text style={s.fieldLabel}>
                            {carrito.length > 0 ? 'AGREGAR MÁS PRODUCTOS' : 'SELECCIONÁ UN PRODUCTO'}
                        </Text>

                        {productos.length === 0 ? (
                            <View style={s.sinProductos}>
                                <Text style={s.sinProductosText}>No tenés productos cargados</Text>
                            </View>
                        ) : (
                            <View style={s.dropdownWrap}>
                                {productos.map(p => {
                                    const enCarrito = carrito.find(i => i.producto.id === p.id);
                                    return (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={s.dropdownItem}
                                            onPress={() => agregarAlCarrito(p)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.dropdownItemNombre}>{p.nombre}</Text>
                                                <Text style={s.dropdownItemMeta}>
                                                    {formatMonto(p.precio)} • Stock: {p.stockTotal}
                                                </Text>
                                            </View>
                                            {enCarrito ? (
                                                <View style={s.dropdownBadge}>
                                                    <Text style={s.dropdownBadgeText}>x{enCarrito.cantidad}</Text>
                                                </View>
                                            ) : (
                                                <Text style={s.dropdownAdd}>+</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}

                            </View>
                        )}

                        {onNavigate && (
                            <TouchableOpacity
                                style={s.irStockBtn}
                                onPress={() => { setShowForm(false); onNavigate('stock'); }}
                                activeOpacity={0.8}
                            >
                                <Text style={s.irStockBtnText}>+ Crear nuevo producto en Stock</Text>
                            </TouchableOpacity>
                        )}

                        {/* Cliente */}
                        <Text style={s.fieldLabel}>CLIENTE (opcional)</Text>
                        <TouchableOpacity style={s.selector} onPress={() => setShowClienteModal(true)}>
                            <Text style={clienteSeleccionado ? s.selectorText : s.selectorPlaceholder}>
                                {clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin cliente / Cliente final'}
                            </Text>
                            <Text style={s.selectorArrow}>▼</Text>
                        </TouchableOpacity>

                        {/* Es pedido */}
                        <View style={s.switchRow}>
                            <Text style={s.switchLabel}>Es un pedido</Text>
                            <Switch
                                value={esPedido}
                                onValueChange={setEsPedido}
                                trackColor={{ false: colors.border, true: colors.primaryLight }}
                                thumbColor={esPedido ? colors.primary : '#f4f3f4'}
                            />
                        </View>

                        {/* Cobrado */}
                        <View style={s.switchRow}>
                            <Text style={s.switchLabel}>¿Ya fue cobrado?</Text>
                            <Switch
                                value={cobrado}
                                onValueChange={setCobrado}
                                trackColor={{ false: colors.border, true: colors.primaryLight }}
                                thumbColor={cobrado ? colors.primary : '#f4f3f4'}
                            />
                        </View>

                        {/* Medio de pago */}
                        {cobrado && (
                            <>
                                <Text style={s.fieldLabel}>MEDIO DE PAGO</Text>
                                <View style={s.mediosPagoRow}>
                                    {MEDIOS_PAGO.map(m => (
                                        <TouchableOpacity
                                            key={m.key}
                                            style={[s.medioPagoBtn, medioPago === m.key && s.medioPagoBtnActive]}
                                            onPress={() => setMedioPago(m.key)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[s.medioPagoBtnText, medioPago === m.key && s.medioPagoBtnTextActive]}>
                                                {m.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={[s.guardarBtn, guardando && s.disabled]}
                            onPress={handleGuardar} disabled={guardando} activeOpacity={0.85}
                        >
                            {guardando
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.guardarBtnText}>Confirmar venta</Text>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Métricas ── */}
                <View style={s.metricCard}>
                    <View style={s.metricIcon}>
                        <Text style={s.metricIconText}>$</Text>
                    </View>
                    {pct !== null && (
                        <Text style={[s.metricBadge, { color: pct >= 0 ? colors.primary : colors.error }]}>
                            {pct >= 0 ? '+' : ''}{pct}%
                        </Text>
                    )}
                    <Text style={s.metricLabel}>Ventas Totales</Text>
                    <Text style={s.metricValue}>{formatMonto(totalActual)}</Text>
                </View>

                <View style={s.metricCard}>
                    <View style={[s.metricIcon, { backgroundColor: '#EEF2FF' }]}>
                        <Text style={[s.metricIconText, { color: '#6366F1' }]}>P</Text>
                    </View>
                    <Text style={s.metricLabel}>Pedidos Activos</Text>
                    <Text style={s.metricValue}>{pedidosActivos}</Text>
                </View>

                <View style={s.metricCard}>
                    <View style={s.metricHeader}>
                        <Text style={s.metricLabel}>Objetivo Mensual</Text>
                        <TouchableOpacity onPress={() => {
                            setObjetivoInput(objetivoMensual?.toString() ?? '');
                            setEditandoObjetivo(true);
                        }}>
                            <Text style={s.verMas}>{objetivoMensual ? 'Editar' : 'Agregar'}</Text>
                        </TouchableOpacity>
                    </View>
                    {objetivoMensual ? (
                        <>
                            <Text style={s.metricValue}>{Math.round(progreso)}% Completado</Text>
                            <View style={s.progressBar}>
                                <View style={[s.progressFill, { width: `${progreso}%` as any }]} />
                            </View>
                            <Text style={s.objetivoSub}>{formatMonto(totalActual)} de {formatMonto(objetivoMensual)}</Text>
                        </>
                    ) : (
                        <Text style={s.objetivoVacio}>Todavía no definiste un objetivo para este mes</Text>
                    )}
                </View>

                {/* ── Buscador ── */}
                <View style={s.searchRow}>
                    <View style={s.searchInput}>
                        <Text style={s.searchIcon}>🔍</Text>
                        <TextInput
                            style={s.searchText}
                            placeholder="Buscar por producto o cliente..."
                            placeholderTextColor={colors.placeholder}
                            value={busqueda}
                            onChangeText={setBusqueda}
                        />
                        {busqueda.length > 0 && (
                            <TouchableOpacity onPress={() => setBusqueda('')}>
                                <Text style={{ color: colors.placeholder, fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Lista ventas ── */}
                <View style={s.section}>
                    <View style={s.tableHeader}>
                        <Text style={[s.tableHeaderText, { flex: 2 }]}>PRODUCTO</Text>
                        <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'center' }]}>ESTADO</Text>
                        <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
                    </View>

                    {ventasFiltradas.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={s.emptyText}>No hay ventas registradas</Text>
                        </View>
                    ) : (
                        ventasFiltradas.slice(0, 20).map((v, i) => {
                            const nombreProducto = v.detalles?.[0]?.producto?.nombre ?? v.notas ?? `Venta #${v.id}`;
                            const esCobrada = v.estado === 'COBRADA';
                            return (
                                <View key={v.id} style={[s.ventaRow, i > 0 && s.ventaRowBorder]}>
                                    <View style={s.ventaIconWrap}>
                                        <Text style={s.ventaIconText}>V</Text>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={s.ventaNombre} numberOfLines={1}>{nombreProducto}</Text>
                                        <Text style={s.ventaSku}>
                                            {formatFecha(v.fecha)}{v.cliente ? ` • ${v.cliente.nombre}` : ''}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'center' }}>
                                        <View style={[s.estadoBadge, { backgroundColor: esCobrada ? colors.primaryLight : '#FFF3E0' }]}>
                                            <Text style={[s.estadoBadgeText, { color: esCobrada ? colors.primary : colors.warning }]}>
                                                {esCobrada ? 'COBRADA' : 'PEND'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[s.ventaTotal, { flex: 1, textAlign: 'right' }]}>
                                        {formatMonto(v.total)}
                                    </Text>
                                </View>
                            );
                        })
                    )}

                    {ventasFiltradas.length > 0 && (
                        <Text style={s.mostrando}>
                            Mostrando {Math.min(ventasFiltradas.length, 20)} de {ventasFiltradas.length} ventas
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* ── Modal objetivo mensual ── */}
            <Modal visible={editandoObjetivo} transparent animationType="slide">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditandoObjetivo(false)}>
                        <View style={s.modalSheet}>
                            <Text style={s.modalTitle}>{objetivoMensual ? 'Editar' : 'Agregar'} objetivo mensual</Text>
                            <Text style={s.fieldLabel}>MONTO ($)</Text>
                            <TextInput
                                style={s.textInput}
                                placeholder="Ej: 500000"
                                placeholderTextColor={colors.placeholder}
                                value={objetivoInput}
                                onChangeText={setObjetivoInput}
                                keyboardType="decimal-pad"
                                autoFocus
                            />
                            <TouchableOpacity
                                style={[s.guardarBtn, { marginTop: spacing.md }]}
                                onPress={() => {
                                    const val = Number(objetivoInput);
                                    if (!isNaN(val) && val > 0) {
                                        setObjetivoMensual(val);
                                        setEditandoObjetivo(false);
                                    } else {
                                        Alert.alert('Error', 'Ingresá un monto válido');
                                    }
                                }}
                                activeOpacity={0.85}
                            >
                                <Text style={s.guardarBtnText}>Guardar objetivo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalCancel} onPress={() => setEditandoObjetivo(false)}>
                                <Text style={s.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Modal clientes ── */}
            <Modal visible={showClienteModal} transparent animationType="slide">
                <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowClienteModal(false)}>
                    <View style={s.modalSheet}>
                        <Text style={s.modalTitle}>Seleccioná un cliente</Text>
                        <TouchableOpacity
                            style={[s.modalItem, !clienteSeleccionado && { backgroundColor: colors.primaryLight }]}
                            onPress={() => { setClienteSeleccionado(null); setShowClienteModal(false); }}
                        >
                            <Text style={[s.modalItemText, { color: colors.primary }]}>Sin cliente / Cliente final</Text>
                            {!clienteSeleccionado && <Text style={{ color: colors.primary, fontWeight: '700' }}>✓</Text>}
                        </TouchableOpacity>
                        {clientes.length > 0 && (
                            <FlatList
                                data={clientes}
                                keyExtractor={c => String(c.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[s.modalItem, clienteSeleccionado?.id === item.id && { backgroundColor: colors.primaryLight }]}
                                        onPress={() => { setClienteSeleccionado(item); setShowClienteModal(false); }}
                                    >
                                        <Text style={[s.modalItemText, clienteSeleccionado?.id === item.id && { color: colors.primary, fontWeight: '600' }]}>
                                            {item.nombre}
                                        </Text>
                                        {clienteSeleccionado?.id === item.id && <Text style={{ color: colors.primary, fontWeight: '700' }}>✓</Text>}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                        <TouchableOpacity style={s.modalCancel} onPress={() => setShowClienteModal(false)}>
                            <Text style={s.modalCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: spacing.xxl },
    titleRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
    heading: { ...typography.h2 },
    sub: { ...typography.bodySecondary, marginTop: 2 },

    newBtn: {
        marginHorizontal: spacing.lg, marginBottom: spacing.lg,
        backgroundColor: colors.primary, borderRadius: radius.md,
        height: 48, alignItems: 'center', justifyContent: 'center', ...shadow.primary,
    },
    newBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    formCard: {
        marginHorizontal: spacing.lg, marginBottom: spacing.lg,
        backgroundColor: colors.white, borderRadius: radius.lg,
        padding: spacing.lg, ...shadow.sm,
    },
    formTitle: { ...typography.h4, marginBottom: spacing.md },
    fieldLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.sm },

    carritoWrap: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        padding: spacing.sm, marginBottom: spacing.sm,
    },
    carritoItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    carritoNombre: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
    carritoPrecio: { fontSize: 13, color: colors.textSecondary, marginRight: spacing.sm },
    cantidadRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    cantBtn: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    cantBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
    cantidad: { fontSize: 15, fontWeight: '600', color: colors.text, minWidth: 20, textAlign: 'center' },
    totalCarritoRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingTop: spacing.sm, marginTop: spacing.xs,
    },
    totalCarritoLabel: { ...typography.body, fontWeight: '600' },
    totalCarritoValue: { fontSize: 16, fontWeight: '700', color: colors.primary },

    dropdownWrap: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white, overflow: 'hidden',
    },
    dropdown: { flex: 1 },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dropdownItemNombre: { fontSize: 14, fontWeight: '500', color: colors.text },
    dropdownItemMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    dropdownBadge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.sm, paddingVertical: 2,
        borderRadius: radius.full,
    },
    dropdownBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
    dropdownAdd: { fontSize: 22, color: colors.primary, fontWeight: '600', paddingHorizontal: spacing.sm },

    sinProductos: {
        padding: spacing.md, borderWidth: 1.5, borderColor: colors.border,
        borderRadius: radius.md, alignItems: 'center',
    },
    sinProductosText: { ...typography.bodySecondary },

    irStockBtn: {
        marginTop: spacing.sm, height: 40, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.primary,
        borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    },
    irStockBtnText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

    selector: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 48,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    selectorText: { fontSize: 15, color: colors.text },
    selectorPlaceholder: { fontSize: 15, color: colors.placeholder },
    selectorArrow: { fontSize: 12, color: colors.placeholder },

    switchRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.sm, marginTop: spacing.xs,
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    switchLabel: { ...typography.body, fontWeight: '500' },

    mediosPagoRow: { flexDirection: 'row', gap: spacing.sm },
    medioPagoBtn: {
        flex: 1, height: 40, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    medioPagoBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    medioPagoBtnText: { fontSize: 13, fontWeight: '500', color: colors.text },
    medioPagoBtnTextActive: { color: '#fff' },

    guardarBtn: {
        backgroundColor: colors.primary, borderRadius: radius.md,
        height: 48, alignItems: 'center', justifyContent: 'center',
        marginTop: spacing.lg, ...shadow.primary,
    },
    disabled: { opacity: 0.7 },
    guardarBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    metricCard: {
        marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.white, borderRadius: radius.lg,
        padding: spacing.lg, ...shadow.sm,
    },
    metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metricIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
    },
    metricIconText: { fontSize: 18, fontWeight: '700', color: colors.primary },
    metricBadge: { position: 'absolute', top: spacing.lg, right: spacing.lg, fontSize: 12, fontWeight: '600' },
    metricLabel: { ...typography.bodySecondary, marginBottom: 4 },
    metricValue: { fontSize: 28, fontWeight: '700', color: colors.text },
    verMas: { fontSize: 13, color: colors.primary, fontWeight: '500' },
    progressBar: {
        height: 8, backgroundColor: colors.border,
        borderRadius: radius.full, marginTop: spacing.sm, overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
    objetivoSub: { ...typography.caption, marginTop: spacing.xs },
    objetivoVacio: { ...typography.bodySecondary, fontStyle: 'italic', marginTop: spacing.xs },

    searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    searchInput: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.white, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 44,
    },
    searchIcon: { fontSize: 16, marginRight: spacing.sm },
    searchText: { flex: 1, fontSize: 14, color: colors.text },

    section: { marginHorizontal: spacing.lg },
    tableHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingBottom: spacing.sm, marginBottom: spacing.xs,
        borderBottomWidth: 1.5, borderBottomColor: colors.border,
    },
    tableHeaderText: { ...typography.label },
    ventaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
    ventaRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    ventaIconWrap: {
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
    },
    ventaIconText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    ventaNombre: { fontSize: 14, fontWeight: '500', color: colors.text },
    ventaSku: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
    estadoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
    estadoBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
    ventaTotal: { fontSize: 14, fontWeight: '600', color: colors.text },
    mostrando: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg },

    empty: { paddingVertical: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.bodySecondary },

    textInput: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 48,
        fontSize: 15, color: colors.text,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
        padding: spacing.lg, maxHeight: '70%',
    },
    modalTitle: { ...typography.h4, marginBottom: spacing.md },
    modalItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        borderRadius: radius.sm,
    },
    modalItemText: { fontSize: 15, color: colors.text },
    modalCancel: {
        marginTop: spacing.md, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    modalCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
});
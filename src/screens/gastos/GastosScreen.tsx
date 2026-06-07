import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, RefreshControl,
    Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useEmprendimiento } from '../../context/EmprendimientoContext';
import { getGastos, crearGasto, getCategoriasGasto, crearCategoriaGasto } from '../../services/api';
import { colors, spacing, radius, shadow, typography } from '../../theme';

interface Gasto {
    id: number;
    descripcion: string;
    monto: string;
    fecha: string;
    estado?: string;
    categoria?: { id: number; nombre: string };
}

interface Categoria {
    id: number;
    nombre: string;
}

const formatMonto = (m: string | number) =>
    '$' + Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2 });

const formatFecha = (f: string) => {
    const d = new Date(f);
    const hoy = new Date();
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return 'Hoy';
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const totalMensual = (gastos: Gasto[]) => {
    const hoy = new Date();
    return gastos
        .filter(g => {
            const f = new Date(g.fecha);
            return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
        })
        .reduce((acc, g) => acc + Number(g.monto), 0);
};

export default function GastosScreen() {
    const { emprendimientoActivo } = useEmprendimiento();
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [guardando, setGuardando] = useState(false);

    // Modal categorías
    const [showCatModal, setShowCatModal] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [creandoCategoria, setCreandoCategoria] = useState(false);
    const [showNuevaCat, setShowNuevaCat] = useState(false);

    const cargar = useCallback(async () => {
        if (!emprendimientoActivo) return;
        try {
            const [g, c] = await Promise.all([
                getGastos(emprendimientoActivo.id),
                getCategoriasGasto(emprendimientoActivo.id),
            ]);
            setGastos(g);
            setCategorias(c);
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos cargar los gastos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [emprendimientoActivo]);

    useEffect(() => { cargar(); }, [cargar]);
    const onRefresh = () => { setRefreshing(true); cargar(); };

    const handleCrearCategoria = async () => {
        if (!nuevaCategoria.trim()) {
            Alert.alert('Error', 'Ingresá un nombre para la categoría');
            return;
        }
        if (!emprendimientoActivo) return;
        setCreandoCategoria(true);
        try {
            const nueva = await crearCategoriaGasto(emprendimientoActivo.id, {
                nombre: nuevaCategoria.trim(),
            });
            setCategorias(prev => [...prev, nueva]);
            setCategoriaSeleccionada(nueva);
            setNuevaCategoria('');
            setShowNuevaCat(false);
            setShowCatModal(false);
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos crear la categoría');
        } finally {
            setCreandoCategoria(false);
        }
    };

    const handleGuardar = async () => {
        if (!monto || isNaN(Number(monto))) {
            Alert.alert('Error', 'Ingresá un monto válido'); return;
        }
        if (!descripcion.trim()) {
            Alert.alert('Error', 'Ingresá una descripción'); return;
        }
        if (!emprendimientoActivo) return;

        setGuardando(true);
        try {
            await crearGasto(emprendimientoActivo.id, {
                descripcion: descripcion.trim(),
                monto: Number(monto),
                fecha: new Date(fecha).toISOString(),
                ...(categoriaSeleccionada ? { categoriaId: categoriaSeleccionada.id } : {}),
            });
            setMonto('');
            setDescripcion('');
            setCategoriaSeleccionada(null);
            setFecha(new Date().toISOString().split('T')[0]);
            setShowForm(false);
            cargar();
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos registrar el gasto');
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    const total = totalMensual(gastos);
    const gastosRecientes = [...gastos]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 10);

    return (
        <View style={s.safe}>
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Título */}
                <View style={s.titleRow}>
                    <Text style={s.heading}>Gestión de Gastos</Text>
                    <Text style={s.sub}>Controlá las salidas de dinero en tiempo real</Text>
                </View>

                <TouchableOpacity style={s.newBtn} onPress={() => setShowForm(v => !v)} activeOpacity={0.85}>
                    <Text style={s.newBtnText}>{showForm ? '✕ Cerrar' : '+ Nuevo Gasto'}</Text>
                </TouchableOpacity>

                {/* Formulario */}
                {showForm && (
                    <View style={s.formCard}>
                        <Text style={s.formTitle}>Agregar Gasto</Text>

                        <Text style={s.fieldLabel}>MONTO ($)</Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="0.00"
                            placeholderTextColor={colors.placeholder}
                            value={monto}
                            onChangeText={setMonto}
                            keyboardType="decimal-pad"
                        />

                        <Text style={s.fieldLabel}>CATEGORÍA</Text>
                        <TouchableOpacity style={s.selector} onPress={() => setShowCatModal(true)}>
                            <Text style={categoriaSeleccionada ? s.selectorText : s.selectorPlaceholder}>
                                {categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Seleccioná o creá una categoría'}
                            </Text>
                            <Text style={s.selectorArrow}>▼</Text>
                        </TouchableOpacity>

                        <Text style={s.fieldLabel}>DESCRIPCIÓN</Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="Ej: Compra de harina"
                            placeholderTextColor={colors.placeholder}
                            value={descripcion}
                            onChangeText={setDescripcion}
                        />

                        <Text style={s.fieldLabel}>FECHA</Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor={colors.placeholder}
                            value={fecha}
                            onChangeText={setFecha}
                        />

                        <TouchableOpacity
                            style={[s.guardarBtn, guardando && s.disabled]}
                            onPress={handleGuardar}
                            disabled={guardando}
                            activeOpacity={0.85}
                        >
                            {guardando
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.guardarBtnText}>Registrar Gasto</Text>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* Card total mensual */}
                <View style={s.totalCard}>
                    <Text style={s.totalLabel}>TOTAL MENSUAL</Text>
                    <Text style={s.totalMonto}>{formatMonto(total)}</Text>
                </View>

                {/* Gastos recientes */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Gastos Recientes</Text>
                        <TouchableOpacity>
                            <Text style={s.verTodo}>Ver todo</Text>
                        </TouchableOpacity>
                    </View>

                    {gastosRecientes.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={s.emptyText}>No hay gastos registrados</Text>
                        </View>
                    ) : (
                        gastosRecientes.map((g, i) => (
                            <View key={g.id} style={[s.gastoRow, i > 0 && s.gastoRowBorder]}>
                                <View style={s.gastoIconWrap}>
                                    <Text style={s.gastoIconText}>
                                        {g.categoria?.nombre?.[0]?.toUpperCase() ?? 'G'}
                                    </Text>
                                </View>
                                <View style={s.gastoInfo}>
                                    <Text style={s.gastoDescripcion} numberOfLines={1}>{g.descripcion}</Text>
                                    <Text style={s.gastoMeta}>
                                        {g.categoria?.nombre ?? 'Sin categoría'} • {formatFecha(g.fecha)}
                                    </Text>
                                </View>
                                <View style={s.gastoRight}>
                                    <Text style={s.gastoMonto}>{formatMonto(g.monto)}</Text>
                                    {g.estado && (
                                        <View style={[
                                            s.estadoBadge,
                                            { backgroundColor: g.estado === 'PAGADO' ? colors.primaryLight : '#FFF3E0' }
                                        ]}>
                                            <Text style={[
                                                s.estadoBadgeText,
                                                { color: g.estado === 'PAGADO' ? colors.primary : colors.warning }
                                            ]}>
                                                {g.estado}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Modal categorías */}
            <Modal visible={showCatModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => {
                        setShowCatModal(false);
                        setShowNuevaCat(false);
                        setNuevaCategoria('');
                    }}>
                        <View style={s.modalSheet}>
                            <Text style={s.modalTitle}>Categorías de gasto</Text>

                            {/* Lista de categorías existentes */}
                            {categorias.length > 0 && (
                                <FlatList
                                    data={categorias}
                                    keyExtractor={c => String(c.id)}
                                    style={{ maxHeight: 200 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={s.modalItem}
                                            onPress={() => {
                                                setCategoriaSeleccionada(item);
                                                setShowCatModal(false);
                                                setShowNuevaCat(false);
                                            }}
                                        >
                                            <Text style={[
                                                s.modalItemText,
                                                categoriaSeleccionada?.id === item.id && s.modalItemActive
                                            ]}>
                                                {item.nombre}
                                            </Text>
                                            {categoriaSeleccionada?.id === item.id && (
                                                <Text style={s.modalItemCheck}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            )}

                            {categorias.length === 0 && !showNuevaCat && (
                                <Text style={s.emptyText}>No hay categorías todavía</Text>
                            )}

                            {/* Formulario nueva categoría */}
                            {showNuevaCat ? (
                                <View style={s.nuevaCatWrap}>
                                    <Text style={s.fieldLabel}>NOMBRE DE LA CATEGORÍA</Text>
                                    <TextInput
                                        style={s.textInput}
                                        placeholder="Ej: Insumos, Servicios..."
                                        placeholderTextColor={colors.placeholder}
                                        value={nuevaCategoria}
                                        onChangeText={setNuevaCategoria}
                                        autoFocus
                                        autoCapitalize="words"
                                    />
                                    <View style={s.nuevaCatBtns}>
                                        <TouchableOpacity
                                            style={s.cancelBtn}
                                            onPress={() => { setShowNuevaCat(false); setNuevaCategoria(''); }}
                                        >
                                            <Text style={s.cancelBtnText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[s.createBtn, creandoCategoria && s.disabled]}
                                            onPress={handleCrearCategoria}
                                            disabled={creandoCategoria}
                                            activeOpacity={0.85}
                                        >
                                            {creandoCategoria
                                                ? <ActivityIndicator color="#fff" size="small" />
                                                : <Text style={s.createBtnText}>Crear</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={s.nuevaCatBtn}
                                    onPress={() => setShowNuevaCat(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={s.nuevaCatBtnText}>+ Crear nueva categoría</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={s.modalCancel} onPress={() => {
                                setShowCatModal(false);
                                setShowNuevaCat(false);
                                setNuevaCategoria('');
                            }}>
                                <Text style={s.modalCancelText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
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
    textInput: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 48,
        fontSize: 15, color: colors.text,
    },
    selector: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 48,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    selectorText: { fontSize: 15, color: colors.text },
    selectorPlaceholder: { fontSize: 15, color: colors.placeholder },
    selectorArrow: { fontSize: 12, color: colors.placeholder },
    guardarBtn: {
        backgroundColor: colors.primary, borderRadius: radius.md,
        height: 48, alignItems: 'center', justifyContent: 'center',
        marginTop: spacing.lg, ...shadow.primary,
    },
    disabled: { opacity: 0.7 },
    guardarBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    totalCard: {
        margin: spacing.lg, marginTop: spacing.sm,
        backgroundColor: colors.primary, borderRadius: radius.lg,
        padding: spacing.lg, ...shadow.md,
    },
    totalLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8 },
    totalMonto: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 4 },

    section: { marginHorizontal: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { ...typography.h4 },
    verTodo: { fontSize: 13, color: colors.primary, fontWeight: '500' },

    gastoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
    gastoRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    gastoIconWrap: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    },
    gastoIconText: { fontSize: 16, fontWeight: '700', color: colors.primary },
    gastoInfo: { flex: 1 },
    gastoDescripcion: { ...typography.body, fontWeight: '500' },
    gastoMeta: { ...typography.caption, marginTop: 2 },
    gastoRight: { alignItems: 'flex-end', gap: spacing.xs },
    gastoMonto: { fontSize: 15, fontWeight: '600', color: colors.error },
    estadoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
    estadoBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

    empty: { paddingVertical: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.bodySecondary },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
        padding: spacing.lg, maxHeight: '75%',
    },
    modalTitle: { ...typography.h4, marginBottom: spacing.md },
    modalItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    modalItemText: { fontSize: 15, color: colors.text },
    modalItemActive: { color: colors.primary, fontWeight: '600' },
    modalItemCheck: { fontSize: 16, color: colors.primary, fontWeight: '700' },

    nuevaCatWrap: { marginTop: spacing.md },
    nuevaCatBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    cancelBtn: {
        flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    cancelBtnText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    createBtn: {
        flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.primary, ...shadow.primary,
    },
    createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    nuevaCatBtn: {
        marginTop: spacing.md, height: 44, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.primary,
        borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    },
    nuevaCatBtnText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

    modalCancel: {
        marginTop: spacing.md, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    modalCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
});
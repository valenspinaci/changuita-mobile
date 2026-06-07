import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, RefreshControl, Modal,
} from 'react-native';
import { useEmprendimiento } from '../../context/EmprendimientoContext';
import { getProductos, crearProducto } from '../../services/api';
import { colors, spacing, radius, shadow, typography } from '../../theme';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: string;
    stockTotal: number;
    stockMinimo: number;
    activo: boolean;
    categoria?: { id: number; nombre: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrecio = (p: string) =>
    '$' + Number(p).toLocaleString('es-AR', { minimumFractionDigits: 0 });

const getEstadoStock = (stock: number, minimo: number) => {
    if (stock === 0) return 'AGOTADO';
    if (stock <= minimo) return 'BAJO';
    return 'OK';
};

const getBadgeStyle = (estado: string) => {
    switch (estado) {
        case 'AGOTADO': return { bg: '#FDECEA', text: colors.stockAgotado };
        case 'BAJO': return { bg: '#FFF3E0', text: colors.stockBajo };
        default: return { bg: colors.primaryLight, text: colors.stockOk };
    }
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function StockScreen() {
    const { emprendimientoActivo } = useEmprendimiento();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaActiva, setCategoriaActiva] = useState('Todos');
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [stockMinimo, setStockMinimo] = useState('5');
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        if (!emprendimientoActivo) return;
        try {
            const data = await getProductos(emprendimientoActivo.id);
            setProductos(data);
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos cargar los productos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [emprendimientoActivo]);

    useEffect(() => { cargar(); }, [cargar]);

    const onRefresh = () => { setRefreshing(true); cargar(); };

    const handleGuardar = async () => {
        if (!nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
        if (!precio || isNaN(Number(precio))) { Alert.alert('Error', 'Ingresá un precio válido'); return; }
        if (!stock || isNaN(Number(stock))) { Alert.alert('Error', 'Ingresá el stock inicial'); return; }
        if (!emprendimientoActivo) return;

        setGuardando(true);
        try {
            await crearProducto(emprendimientoActivo.id, {
                nombre: nombre.trim(),
                precio: Number(precio),
                stockTotal: Number(stock),
                stockMinimo: Number(stockMinimo),
            });
            setNombre(''); setPrecio(''); setStock(''); setStockMinimo('5');
            setShowForm(false);
            cargar();
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos crear el producto');
        } finally {
            setGuardando(false);
        }
    };

    // Categorías dinámicas
    const categorias = ['Todos', ...Array.from(new Set(
        productos.map(p => p.categoria?.nombre).filter(Boolean) as string[]
    ))];

    const productosFiltrados = productos.filter(p => {
        const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const matchCategoria = categoriaActiva === 'Todos' || p.categoria?.nombre === categoriaActiva;
        return matchBusqueda && matchCategoria;
    });

    const totalStock = productos.reduce((acc, p) => acc + p.stockTotal, 0);

    if (loading) {
        return (
            <View style={s.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={s.safe}>
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Título */}
                <View style={s.titleRow}>
                    <View>
                        <Text style={s.heading}>Productos y Stock</Text>
                        <Text style={s.sub}>Administrá tu inventario y precios</Text>
                    </View>
                    <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(v => !v)} activeOpacity={0.85}>
                        <Text style={s.addBtnText}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Buscador */}
                <View style={s.searchWrap}>
                    <Text style={s.searchIcon}>🔍</Text>
                    <TextInput
                        style={s.searchInput}
                        placeholder="Buscar productos"
                        placeholderTextColor={colors.placeholder}
                        value={busqueda}
                        onChangeText={setBusqueda}
                    />
                </View>

                {/* Card total */}
                <View style={s.totalCard}>
                    <View>
                        <Text style={s.totalLabel}>TOTAL PRODUCTOS EN STOCK</Text>
                        <Text style={s.totalValue}>{totalStock}</Text>
                    </View>
                </View>

                {/* Filtros por categoría */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoriasScroll} contentContainerStyle={s.categoriasContent}>
                    {categorias.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[s.categoriaBtn, categoriaActiva === cat && s.categoriaBtnActive]}
                            onPress={() => setCategoriaActiva(cat)}
                            activeOpacity={0.75}
                        >
                            <Text style={[s.categoriaBtnText, categoriaActiva === cat && s.categoriaBtnTextActive]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Formulario nuevo producto */}
                {showForm && (
                    <View style={s.formCard}>
                        <Text style={s.formTitle}>Nuevo Producto</Text>

                        <Text style={s.fieldLabel}>NOMBRE</Text>
                        <TextInput style={s.textInput} placeholder="Ej: Leche Entera 1L"
                            placeholderTextColor={colors.placeholder} value={nombre}
                            onChangeText={setNombre} autoCapitalize="words" />

                        <Text style={s.fieldLabel}>PRECIO ($)</Text>
                        <TextInput style={s.textInput} placeholder="0.00"
                            placeholderTextColor={colors.placeholder} value={precio}
                            onChangeText={setPrecio} keyboardType="decimal-pad" />

                        <Text style={s.fieldLabel}>STOCK INICIAL</Text>
                        <TextInput style={s.textInput} placeholder="0"
                            placeholderTextColor={colors.placeholder} value={stock}
                            onChangeText={setStock} keyboardType="number-pad" />

                        <Text style={s.fieldLabel}>STOCK MÍNIMO</Text>
                        <TextInput style={s.textInput} placeholder="5"
                            placeholderTextColor={colors.placeholder} value={stockMinimo}
                            onChangeText={setStockMinimo} keyboardType="number-pad" />

                        <TouchableOpacity
                            style={[s.guardarBtn, guardando && s.disabled]}
                            onPress={handleGuardar} disabled={guardando} activeOpacity={0.85}
                        >
                            {guardando
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.guardarBtnText}>Guardar Producto</Text>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* Lista productos */}
                <View style={s.lista}>
                    {productosFiltrados.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={s.emptyText}>
                                {productos.length === 0 ? 'No hay productos cargados' : 'Sin resultados'}
                            </Text>
                        </View>
                    ) : (
                        productosFiltrados.map((p, i) => {
                            const estado = getEstadoStock(p.stockTotal, p.stockMinimo);
                            const badge = getBadgeStyle(estado);
                            const ref = `REF: ${String(p.id).padStart(3, '0')}`;
                            return (
                                <View key={p.id} style={[s.productoCard, i > 0 && s.productoCardBorder]}>
                                    <View style={s.productoRow}>
                                        <View style={s.productoIconWrap}>
                                            <Text style={s.productoIconText}>
                                                {p.nombre[0].toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={s.productoInfo}>
                                            <Text style={s.productoNombre} numberOfLines={1}>{p.nombre}</Text>
                                            <Text style={s.productoRef}>{ref}</Text>
                                        </View>
                                        <TouchableOpacity style={s.menuBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Text style={s.menuBtnText}>•••</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={s.productoDetails}>
                                        <View style={s.stockRow}>
                                            <Text style={s.stockLabel}>Stock: </Text>
                                            <Text style={s.stockValue}>{p.stockTotal}</Text>
                                            <View style={[s.badge, { backgroundColor: badge.bg }]}>
                                                <Text style={[s.badgeText, { color: badge.text }]}>{estado}</Text>
                                            </View>
                                        </View>
                                        <Text style={s.precio}>Precio: <Text style={s.precioValue}>{formatPrecio(p.precio)}</Text></Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: spacing.xxl },

    titleRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
    },
    heading: { ...typography.h2 },
    sub: { ...typography.bodySecondary, marginTop: 2 },
    addBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
        ...shadow.primary,
    },
    addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300', marginTop: -2 },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.white, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 44,
    },
    searchIcon: { fontSize: 16, marginRight: spacing.sm },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },

    totalCard: {
        marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.primary, borderRadius: radius.lg,
        padding: spacing.lg, ...shadow.primary,
    },
    totalLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8 },
    totalValue: { fontSize: 36, fontWeight: '700', color: '#fff', marginTop: 4 },

    categoriasScroll: { marginBottom: spacing.md },
    categoriasContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    categoriaBtn: {
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        borderRadius: radius.full, backgroundColor: colors.white,
        borderWidth: 1.5, borderColor: colors.border,
    },
    categoriaBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoriaBtnText: { fontSize: 13, fontWeight: '500', color: colors.text },
    categoriaBtnTextActive: { color: '#fff' },

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
    guardarBtn: {
        backgroundColor: colors.primary, borderRadius: radius.md,
        height: 48, alignItems: 'center', justifyContent: 'center',
        marginTop: spacing.lg, ...shadow.primary,
    },
    disabled: { opacity: 0.7 },
    guardarBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    lista: { paddingHorizontal: spacing.lg },
    empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
    emptyText: { ...typography.bodySecondary },

    productoCard: { paddingVertical: spacing.md },
    productoCardBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    productoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    productoIconWrap: {
        width: 44, height: 44, borderRadius: radius.sm,
        backgroundColor: '#FFF3E0',
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
    },
    productoIconText: { fontSize: 18, fontWeight: '700', color: '#E65100' },
    productoInfo: { flex: 1 },
    productoNombre: { ...typography.body, fontWeight: '600' },
    productoRef: { ...typography.caption, marginTop: 1 },
    menuBtn: { padding: spacing.sm },
    menuBtnText: { fontSize: 16, color: colors.textSecondary, letterSpacing: 2 },

    productoDetails: { paddingLeft: 44 + spacing.md },
    stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    stockLabel: { ...typography.bodySecondary },
    stockValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginRight: spacing.sm },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
    badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    precio: { ...typography.bodySecondary },
    precioValue: { fontWeight: '600', color: colors.text },
});
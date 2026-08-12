import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, RefreshControl, Modal,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { useEmprendimiento } from '../../context/EmprendimientoContext';
import { getClientes, crearCliente, actualizarCliente, eliminarCliente } from '../../services/api';
import { colors, spacing, radius, shadow, typography } from '../../theme';

interface VentaResumen {
    total: string;
    creadoEn: string;
    estado: string;
}

interface Cliente {
    id: number;
    nombre: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    notas?: string;
    ventas?: VentaResumen[];
}

const formatMonto = (m: string | number) =>
    '$' + Number(m).toLocaleString('es-AR', { minimumFractionDigits: 0 });

const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ClientesScreen() {
    const { emprendimientoActivo } = useEmprendimiento();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [detalleCliente, setDetalleCliente] = useState<Cliente | null>(null);

    // Form state
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [notas, setNotas] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        if (!emprendimientoActivo) return;
        try {
            const data = await getClientes(emprendimientoActivo.id);
            setClientes(data);
        } catch (err: any) {
            showAlert('Error', err.message ?? 'No pudimos cargar los clientes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [emprendimientoActivo]);

    useEffect(() => { cargar(); }, [cargar]);
    const onRefresh = () => { setRefreshing(true); cargar(); };

    const limpiarForm = () => {
        setNombre(''); setEmail(''); setTelefono(''); setDireccion(''); setNotas('');
        setEditandoId(null);
    };

    const abrirEdicion = (cliente: Cliente) => {
        setNombre(cliente.nombre);
        setEmail(cliente.email ?? '');
        setTelefono(cliente.telefono ?? '');
        setDireccion(cliente.direccion ?? '');
        setNotas(cliente.notas ?? '');
        setEditandoId(cliente.id);
        setDetalleCliente(null);
        setShowForm(true);
    };

    const handleGuardar = async () => {
        if (!nombre.trim()) {
            showAlert('Error', 'Ingresá el nombre del cliente'); return;
        }
        if (!emprendimientoActivo) return;

        const data = {
            nombre: nombre.trim(),
            ...(email.trim() ? { email: email.trim() } : {}),
            ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
            ...(direccion.trim() ? { direccion: direccion.trim() } : {}),
            ...(notas.trim() ? { notas: notas.trim() } : {}),
        };

        setGuardando(true);
        try {
            if (editandoId) {
                await actualizarCliente(emprendimientoActivo.id, editandoId, data);
            } else {
                await crearCliente(emprendimientoActivo.id, data);
            }
            limpiarForm();
            setShowForm(false);
            cargar();
        } catch (err: any) {
            showAlert('Error', err.message ?? 'No pudimos guardar el cliente');
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = (cliente: Cliente) => {
        showAlert(
            'Eliminar cliente',
            `¿Seguro que querés eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive', onPress: async () => {
                        if (!emprendimientoActivo) return;
                        try {
                            await eliminarCliente(emprendimientoActivo.id, cliente.id);
                            setDetalleCliente(null);
                            cargar();
                        } catch (err: any) {
                            showAlert('Error', err.message ?? 'No pudimos eliminar el cliente');
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
                keyboardShouldPersistTaps="handled"
            >
                <View style={s.titleRow}>
                    <Text style={s.heading}>Clientes</Text>
                    <Text style={s.sub}>Gestioná tu cartera de clientes</Text>
                </View>

                <TouchableOpacity
                    style={s.newBtn}
                    onPress={() => { if (showForm) { limpiarForm(); } setShowForm(v => !v); }}
                    activeOpacity={0.85}
                >
                    <Text style={s.newBtnText}>{showForm ? '✕ Cerrar' : '+ Nuevo Cliente'}</Text>
                </TouchableOpacity>

                {showForm && (
                    <View style={s.formCard}>
                        <Text style={s.formTitle}>{editandoId ? 'Editar Cliente' : 'Agregar Cliente'}</Text>

                        <Text style={s.fieldLabel}>NOMBRE</Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="Nombre del cliente"
                            placeholderTextColor={colors.placeholder}
                            value={nombre}
                            onChangeText={setNombre}
                            autoCapitalize="words"
                        />

                        <Text style={s.fieldLabel}>EMAIL (OPCIONAL)</Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="nombre@ejemplo.com"
                            placeholderTextColor={colors.placeholder}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={s.fieldLabel}>TELÉFONO (OPCIONAL)</Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="Ej: 11 2345-6789"
                            placeholderTextColor={colors.placeholder}
                            value={telefono}
                            onChangeText={setTelefono}
                            keyboardType="phone-pad"
                        />

                        <Text style={s.fieldLabel}>DIRECCIÓN (OPCIONAL)</Text>
                        <TextInput
                            style={s.textInput}
                            placeholder="Dirección"
                            placeholderTextColor={colors.placeholder}
                            value={direccion}
                            onChangeText={setDireccion}
                        />

                        <Text style={s.fieldLabel}>NOTAS (OPCIONAL)</Text>
                        <TextInput
                            style={[s.textInput, s.textArea]}
                            placeholder="Preferencias, observaciones..."
                            placeholderTextColor={colors.placeholder}
                            value={notas}
                            onChangeText={setNotas}
                            multiline
                        />

                        <TouchableOpacity
                            style={[s.guardarBtn, guardando && s.disabled]}
                            onPress={handleGuardar}
                            disabled={guardando}
                            activeOpacity={0.85}
                        >
                            {guardando
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.guardarBtnText}>{editandoId ? 'Guardar Cambios' : 'Registrar Cliente'}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Todos los clientes</Text>
                        <Text style={s.contador}>{clientes.length}</Text>
                    </View>

                    {clientes.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={s.emptyText}>No hay clientes registrados</Text>
                        </View>
                    ) : (
                        clientes.map((c, i) => {
                            const totalCompras = (c.ventas ?? []).length;
                            const montoTotal = (c.ventas ?? []).reduce((acc, v) => acc + Number(v.total), 0);
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[s.clienteRow, i > 0 && s.clienteRowBorder]}
                                    onPress={() => setDetalleCliente(c)}
                                    activeOpacity={0.7}
                                >
                                    <View style={s.clienteIconWrap}>
                                        <Text style={s.clienteIconText}>{c.nombre[0]?.toUpperCase() ?? '?'}</Text>
                                    </View>
                                    <View style={s.clienteInfo}>
                                        <Text style={s.clienteNombre} numberOfLines={1}>{c.nombre}</Text>
                                        <Text style={s.clienteMeta} numberOfLines={1}>
                                            {c.telefono ?? c.email ?? 'Sin datos de contacto'}
                                        </Text>
                                    </View>
                                    <View style={s.clienteRight}>
                                        <Text style={s.clienteMonto}>{formatMonto(montoTotal)}</Text>
                                        <Text style={s.clienteComprasCount}>
                                            {totalCompras} compra{totalCompras !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Modal detalle / historial */}
            <Modal visible={!!detalleCliente} transparent animationType="slide">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setDetalleCliente(null)}>
                        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
                            {detalleCliente && (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Text style={s.modalTitle}>{detalleCliente.nombre}</Text>

                                    {(detalleCliente.email || detalleCliente.telefono || detalleCliente.direccion) && (
                                        <View style={s.detalleContacto}>
                                            {detalleCliente.email && <Text style={s.detalleContactoText}>✉ {detalleCliente.email}</Text>}
                                            {detalleCliente.telefono && <Text style={s.detalleContactoText}>☎ {detalleCliente.telefono}</Text>}
                                            {detalleCliente.direccion && <Text style={s.detalleContactoText}>📍 {detalleCliente.direccion}</Text>}
                                        </View>
                                    )}

                                    {detalleCliente.notas && (
                                        <View style={s.detalleNotas}>
                                            <Text style={s.detalleNotasLabel}>NOTAS</Text>
                                            <Text style={s.detalleNotasText}>{detalleCliente.notas}</Text>
                                        </View>
                                    )}

                                    <Text style={s.detalleHistorialLabel}>HISTORIAL DE COMPRAS</Text>
                                    {(detalleCliente.ventas ?? []).length === 0 ? (
                                        <Text style={s.emptyText}>Todavía no tiene compras registradas</Text>
                                    ) : (
                                        [...(detalleCliente.ventas ?? [])]
                                            .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
                                            .map((v, i) => (
                                                <View key={i} style={[s.ventaRow, i > 0 && s.clienteRowBorder]}>
                                                    <View>
                                                        <Text style={s.ventaFecha}>{formatFecha(v.creadoEn)}</Text>
                                                        <Text style={s.ventaEstado}>{v.estado}</Text>
                                                    </View>
                                                    <Text style={s.ventaMonto}>{formatMonto(v.total)}</Text>
                                                </View>
                                            ))
                                    )}

                                    <View style={s.detalleAcciones}>
                                        <TouchableOpacity style={s.editarBtn} onPress={() => abrirEdicion(detalleCliente)} activeOpacity={0.85}>
                                            <Text style={s.editarBtnText}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={s.eliminarBtn} onPress={() => handleEliminar(detalleCliente)} activeOpacity={0.85}>
                                            <Text style={s.eliminarBtnText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity style={s.modalCancel} onPress={() => setDetalleCliente(null)}>
                                        <Text style={s.modalCancelText}>Cerrar</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
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
    textArea: { height: 80, paddingTop: spacing.sm, textAlignVertical: 'top' },
    guardarBtn: {
        backgroundColor: colors.primary, borderRadius: radius.md,
        height: 48, alignItems: 'center', justifyContent: 'center',
        marginTop: spacing.lg, ...shadow.primary,
    },
    disabled: { opacity: 0.7 },
    guardarBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    section: { marginHorizontal: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { ...typography.h4 },
    contador: { ...typography.bodySecondary, fontWeight: '600' },

    clienteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
    clienteRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    clienteIconWrap: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    },
    clienteIconText: { fontSize: 16, fontWeight: '700', color: colors.primary },
    clienteInfo: { flex: 1 },
    clienteNombre: { ...typography.body, fontWeight: '500' },
    clienteMeta: { ...typography.caption, marginTop: 2 },
    clienteRight: { alignItems: 'flex-end' },
    clienteMonto: { fontSize: 15, fontWeight: '600', color: colors.text },
    clienteComprasCount: { ...typography.caption, marginTop: 2 },

    empty: { paddingVertical: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.bodySecondary },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
        padding: spacing.lg, maxHeight: '80%',
    },
    modalTitle: { ...typography.h3, marginBottom: spacing.sm },
    detalleContacto: { gap: 4, marginBottom: spacing.md },
    detalleContactoText: { ...typography.bodySecondary },
    detalleNotas: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        padding: spacing.md, marginBottom: spacing.md,
    },
    detalleNotasLabel: { ...typography.label, marginBottom: spacing.xs },
    detalleNotasText: { ...typography.body },
    detalleHistorialLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.sm },
    ventaRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    ventaFecha: { ...typography.body },
    ventaEstado: { ...typography.caption, marginTop: 2 },
    ventaMonto: { fontSize: 15, fontWeight: '600', color: colors.text },

    detalleAcciones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    editarBtn: {
        flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary,
    },
    editarBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    eliminarBtn: {
        flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.errorLight,
    },
    eliminarBtnText: { color: colors.error, fontSize: 14, fontWeight: '600' },

    modalCancel: {
        marginTop: spacing.md, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    modalCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
});

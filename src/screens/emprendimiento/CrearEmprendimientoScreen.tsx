import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
    ActivityIndicator, Alert,
} from 'react-native';
import { useEmprendimiento, Emprendimiento } from '../../context/EmprendimientoContext';
import { crearEmprendimiento } from '../../services/api';
import { ChanguitaLogo } from '../../components/ui/ChanguitaLogo';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, radius, shadow, typography } from '../../theme';

export default function SeleccionEmprendimientoScreen() {
    const { emprendimientos, setEmprendimientoActivo, recargar } = useEmprendimiento();
    const { logout } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ nombre?: string }>({});

    const handleSeleccionar = (e: Emprendimiento) => {
        setEmprendimientoActivo(e);
    };

    const handleCrear = async () => {
        if (!nombre.trim()) {
            setErrors({ nombre: 'El nombre es obligatorio' });
            return;
        }
        setLoading(true);
        try {
            const nuevo = await crearEmprendimiento({
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
            });
            await recargar();
            setEmprendimientoActivo(nuevo);
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No pudimos crear el emprendimiento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                    <View style={s.logoWrap}>
                        <ChanguitaLogo size={44} />
                    </View>

                    {emprendimientos.length > 0 && (
                        <>
                            <Text style={s.heading}>Seleccioná tu emprendimiento</Text>
                            <Text style={s.sub}>Elegí con cuál querés trabajar hoy.</Text>

                            <View style={s.lista}>
                                {emprendimientos.map(e => (
                                    <TouchableOpacity
                                        key={e.id}
                                        style={s.emprendimientoCard}
                                        onPress={() => handleSeleccionar(e)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={s.emprendimientoIconWrap}>
                                            <Text style={s.emprendimientoIconText}>{e.nombre[0].toUpperCase()}</Text>
                                        </View>
                                        <View style={s.emprendimientoInfo}>
                                            <Text style={s.emprendimientoNombre}>{e.nombre}</Text>
                                            {e.descripcion ? (
                                                <Text style={s.emprendimientoDesc} numberOfLines={1}>{e.descripcion}</Text>
                                            ) : null}
                                        </View>
                                        <Text style={s.emprendimientoArrow}>→</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={s.divider}>
                                <View style={s.dividerLine} />
                                <Text style={s.dividerText}>O TAMBIÉN</Text>
                                <View style={s.dividerLine} />
                            </View>
                        </>
                    )}

                    {emprendimientos.length === 0 && (
                        <>
                            <Text style={s.heading}>Creá tu emprendimiento</Text>
                            <Text style={s.sub}>Antes de empezar, contanos un poco sobre tu negocio.</Text>
                        </>
                    )}

                    {!showForm ? (
                        <TouchableOpacity
                            style={[s.newBtn, emprendimientos.length === 0 && s.newBtnPrimary]}
                            onPress={() => setShowForm(true)}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.newBtnText, emprendimientos.length === 0 && s.newBtnTextPrimary]}>
                                + Crear nuevo emprendimiento
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={s.formCard}>
                            <Text style={s.formTitle}>Nuevo emprendimiento</Text>

                            <Text style={s.label}>NOMBRE DEL NEGOCIO</Text>
                            <TextInput
                                style={[s.input, errors.nombre && s.inputErr]}
                                placeholder="Ej: Panadería La Esquina"
                                placeholderTextColor={colors.placeholder}
                                value={nombre}
                                onChangeText={t => { setNombre(t); setErrors({}); }}
                                autoCapitalize="words"
                            />
                            {errors.nombre ? <Text style={s.errText}>{errors.nombre}</Text> : null}

                            <Text style={s.label}>DESCRIPCIÓN (opcional)</Text>
                            <TextInput
                                style={[s.input, s.inputMultiline]}
                                placeholder="¿A qué se dedica tu negocio?"
                                placeholderTextColor={colors.placeholder}
                                value={descripcion}
                                onChangeText={setDescripcion}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            <View style={s.formBtns}>
                                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                                    <Text style={s.cancelBtnText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.createBtn, loading && s.disabled]}
                                    onPress={handleCrear}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={s.createBtnText}>Crear →</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={s.logoutBtn}
                        onPress={logout}
                        activeOpacity={0.75}
                    >
                        <Text style={s.logoutText}>Cerrar sesión</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
    logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
    heading: { ...typography.h1, fontSize: 26, textAlign: 'center', marginBottom: spacing.sm },
    sub: { ...typography.bodySecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl },

    lista: { gap: spacing.sm, marginBottom: spacing.lg },
    emprendimientoCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.white, borderRadius: radius.lg,
        padding: spacing.md, borderWidth: 1.5, borderColor: colors.border,
        ...shadow.sm,
    },
    emprendimientoIconWrap: {
        width: 44, height: 44, borderRadius: radius.md,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
    },
    emprendimientoIconText: { fontSize: 20, fontWeight: '700', color: colors.primary },
    emprendimientoInfo: { flex: 1 },
    emprendimientoNombre: { ...typography.body, fontWeight: '600' },
    emprendimientoDesc: { ...typography.caption, marginTop: 2 },
    emprendimientoArrow: { fontSize: 18, color: colors.primary, fontWeight: '600' },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { ...typography.label, marginHorizontal: spacing.sm, color: colors.placeholder },

    newBtn: {
        borderRadius: radius.md, height: 52,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: colors.primary,
    },
    newBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow.primary },
    newBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
    newBtnTextPrimary: { color: '#fff' },

    formCard: {
        backgroundColor: colors.white, borderRadius: radius.lg,
        padding: spacing.lg, ...shadow.sm, marginTop: spacing.sm,
    },
    formTitle: { ...typography.h4, marginBottom: spacing.md },
    label: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.sm },
    input: {
        backgroundColor: colors.bg, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: spacing.md, height: 52,
        fontSize: 15, color: colors.text,
    },
    inputMultiline: { height: 90, paddingTop: spacing.md },
    inputErr: { borderColor: colors.error },
    errText: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 2 },
    formBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    cancelBtn: {
        flex: 1, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    cancelBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
    createBtn: {
        flex: 1, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.primary, ...shadow.primary,
    },
    disabled: { opacity: 0.7 },
    createBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    logoutBtn: {
        marginTop: spacing.xl, paddingVertical: spacing.md, alignItems: 'center',
    },
    logoutText: { fontSize: 14, color: colors.error, fontWeight: '500' },
});
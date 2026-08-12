import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { useAuth } from '../../hooks/useAuth';
import { useEmprendimiento } from '../../context/EmprendimientoContext';
import { actualizarPerfil } from '../../services/api';
import { colors, spacing, radius, shadow, typography } from '../../theme';

export default function PerfilScreen() {
    const { user, logout, updateNombre } = useAuth();
    const { emprendimientoActivo } = useEmprendimiento();
    const [editando, setEditando] = useState(false);
    const [nombre, setNombre] = useState(user?.name ?? '');
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        if (!nombre.trim()) {
            showAlert('Error', 'El nombre no puede estar vacío');
            return;
        }
        setGuardando(true);
        try {
            await actualizarPerfil(nombre.trim());
            await updateNombre(nombre.trim());
            setEditando(false);
        } catch (err: any) {
            showAlert('Error', err.message ?? 'No pudimos actualizar tu perfil');
        } finally {
            setGuardando(false);
        }
    };

    const handleCancelar = () => {
        setNombre(user?.name ?? '');
        setEditando(false);
    };

    const handleLogout = () => {
        showAlert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <View style={s.safe}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={s.titleRow}>
                    <Text style={s.heading}>Perfil</Text>
                    <Text style={s.sub}>Tu información de cuenta</Text>
                </View>

                <View style={s.avatarWrap}>
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>{(user?.name ?? user?.email ?? '?')[0]?.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={s.card}>
                    <Text style={s.fieldLabel}>NOMBRE</Text>
                    {editando ? (
                        <TextInput
                            style={s.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Tu nombre"
                            placeholderTextColor={colors.placeholder}
                            autoCapitalize="words"
                            autoFocus
                        />
                    ) : (
                        <Text style={s.fieldValue}>{user?.name ?? 'Sin nombre'}</Text>
                    )}

                    <Text style={[s.fieldLabel, s.fieldLabelSpaced]}>CORREO ELECTRÓNICO</Text>
                    <Text style={s.fieldValue}>{user?.email ?? '—'}</Text>

                    {emprendimientoActivo && (
                        <>
                            <Text style={[s.fieldLabel, s.fieldLabelSpaced]}>EMPRENDIMIENTO ACTIVO</Text>
                            <Text style={s.fieldValue}>{emprendimientoActivo.nombre}</Text>
                        </>
                    )}

                    {editando ? (
                        <View style={s.editBtns}>
                            <TouchableOpacity style={s.cancelBtn} onPress={handleCancelar} disabled={guardando}>
                                <Text style={s.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.saveBtn, guardando && s.disabled]}
                                onPress={handleGuardar}
                                disabled={guardando}
                                activeOpacity={0.85}
                            >
                                {guardando
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={s.saveBtnText}>Guardar</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={s.editBtn} onPress={() => setEditando(true)} activeOpacity={0.85}>
                            <Text style={s.editBtnText}>Editar nombre</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <Text style={s.logoutBtnText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingBottom: spacing.xxl },

    titleRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2 },
    sub: { ...typography.bodySecondary, marginTop: 2 },

    avatarWrap: { alignItems: 'center', marginBottom: spacing.lg },
    avatar: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },

    card: {
        marginHorizontal: spacing.lg, marginBottom: spacing.lg,
        backgroundColor: colors.white, borderRadius: radius.lg,
        padding: spacing.lg, ...shadow.sm,
    },
    fieldLabel: { ...typography.label },
    fieldLabelSpaced: { marginTop: spacing.lg },
    fieldValue: { ...typography.body, marginTop: spacing.xs },
    input: {
        marginTop: spacing.xs,
        backgroundColor: colors.bg, borderRadius: radius.sm,
        borderWidth: 1.5, borderColor: colors.borderFocus,
        paddingHorizontal: spacing.md, height: 48,
        fontSize: 15, color: colors.text,
    },

    editBtn: {
        marginTop: spacing.lg, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary,
    },
    editBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

    editBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    disabled: { opacity: 0.7 },
    cancelBtn: {
        flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    cancelBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
    saveBtn: {
        flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.primary, ...shadow.primary,
    },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    logoutBtn: {
        marginHorizontal: spacing.lg, height: 48,
        alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.errorLight,
    },
    logoutBtnText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});

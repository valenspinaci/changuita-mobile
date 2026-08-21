import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../../theme';
import { ONBOARDING_STEPS } from '../../data/onboardingSteps';

interface Props {
    visible: boolean;
    onFinish: () => void;
}

export function OnboardingOverlay({ visible, onFinish }: Props) {
    const [paso, setPaso] = useState(0);
    const esUltimo = paso === ONBOARDING_STEPS.length - 1;
    const step = ONBOARDING_STEPS[paso];

    const cerrar = () => {
        setPaso(0);
        onFinish();
    };

    if (!step) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={s.overlay}>
                <View style={s.card}>
                    <TouchableOpacity style={s.saltarBtn} onPress={cerrar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={s.saltarText}>Saltar</Text>
                    </TouchableOpacity>

                    <View style={s.emojiWrap}>
                        <Text style={s.emoji}>{step.emoji}</Text>
                    </View>

                    <Text style={s.titulo}>{step.titulo}</Text>
                    <Text style={s.descripcion}>{step.descripcion}</Text>

                    <View style={s.dots}>
                        {ONBOARDING_STEPS.map((s2, i) => (
                            <View key={s2.key} style={[s.dot, i === paso && s.dotActive]} />
                        ))}
                    </View>

                    <View style={s.botones}>
                        {paso > 0 && (
                            <TouchableOpacity style={s.anteriorBtn} onPress={() => setPaso(p => p - 1)} activeOpacity={0.8}>
                                <Text style={s.anteriorText}>Anterior</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[s.siguienteBtn, paso === 0 && { flex: 1 }]}
                            onPress={() => esUltimo ? cerrar() : setPaso(p => p + 1)}
                            activeOpacity={0.85}
                        >
                            <Text style={s.siguienteText}>{esUltimo ? 'Empezar →' : 'Siguiente'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 420,
        ...shadow.md,
    },
    saltarBtn: { alignSelf: 'flex-end', marginBottom: spacing.sm },
    saltarText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    emojiWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        alignSelf: 'center', marginBottom: spacing.lg,
    },
    emoji: { fontSize: 32 },
    titulo: { ...typography.h2, textAlign: 'center', marginBottom: spacing.sm },
    descripcion: { ...typography.bodySecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.lg },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 18 },
    botones: { flexDirection: 'row', gap: spacing.sm },
    anteriorBtn: {
        flex: 1, height: 50, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    },
    anteriorText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
    siguienteBtn: {
        flex: 2, height: 50, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.primary, ...shadow.primary,
    },
    siguienteText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

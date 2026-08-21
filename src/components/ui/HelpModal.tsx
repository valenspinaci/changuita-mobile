import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { AYUDA_CONTEXTUAL } from '../../data/ayudaContextual';

interface Props {
    visible: boolean;
    screenKey: string;
    onClose: () => void;
}

export function HelpModal({ visible, screenKey, onClose }: Props) {
    const contenido = AYUDA_CONTEXTUAL[screenKey];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={s.sheet}>
                    <Text style={s.titulo}>¿Cómo se usa {contenido?.titulo ?? 'esta pantalla'}?</Text>
                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                        {(contenido?.tips ?? []).map((tip, i) => (
                            <View key={i} style={s.tipRow}>
                                <Text style={s.tipBullet}>•</Text>
                                <Text style={s.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={s.cerrarBtn} onPress={onClose} activeOpacity={0.85}>
                        <Text style={s.cerrarBtnText}>Entendido</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
        padding: spacing.lg,
    },
    titulo: { ...typography.h3, marginBottom: spacing.md },
    tipRow: { flexDirection: 'row', marginBottom: spacing.md, paddingRight: spacing.sm },
    tipBullet: { color: colors.primary, fontSize: 16, fontWeight: '700', marginRight: spacing.sm },
    tipText: { ...typography.body, flex: 1, lineHeight: 21 },
    cerrarBtn: {
        marginTop: spacing.sm, height: 48, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.md, backgroundColor: colors.primary,
    },
    cerrarBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

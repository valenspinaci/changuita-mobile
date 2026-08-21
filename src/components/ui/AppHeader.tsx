import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ChanguitaLogo } from './ChanguitaLogo';
import { MenuIcon, BellIcon, HelpIcon } from './Icons';
import { HelpModal } from './HelpModal';
import { colors, spacing } from '../../theme';

interface Props {
    onMenuPress: () => void;
    onNotificationsPress?: () => void;
    activeScreen: string;
}

export function AppHeader({ onMenuPress, onNotificationsPress, activeScreen }: Props) {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <View style={s.container}>
            <TouchableOpacity
                style={s.iconBtn}
                onPress={onMenuPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <MenuIcon />
            </TouchableOpacity>

            <ChanguitaLogo size={28} />

            <View style={s.rightGroup}>
                <TouchableOpacity
                    style={s.iconBtn}
                    onPress={() => setShowHelp(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <HelpIcon />
                </TouchableOpacity>
                <TouchableOpacity
                    style={s.iconBtn}
                    onPress={onNotificationsPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <BellIcon />
                </TouchableOpacity>
            </View>

            <HelpModal visible={showHelp} screenKey={activeScreen} onClose={() => setShowHelp(false)} />
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 4,
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

const h = StyleSheet.create({
    wrap: { gap: 5 },
    line: {
        width: 22,
        height: 2,
        backgroundColor: colors.text,
        borderRadius: 2,
    },
});

const b = StyleSheet.create({
    wrap: { width: 22, height: 24, alignItems: 'center', position: 'relative' },
    body: {
        width: 18,
        height: 16,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: colors.text,
        marginTop: 2,
    },
    base: {
        width: 22,
        height: 2,
        backgroundColor: colors.text,
        borderRadius: 1,
        marginTop: -1,
    },
    dot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.error,
        borderWidth: 1.5,
        borderColor: colors.bg,
    },
});
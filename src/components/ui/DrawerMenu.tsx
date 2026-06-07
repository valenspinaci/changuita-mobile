import React, { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Animated,
    Dimensions, TouchableWithoutFeedback, SafeAreaView,
} from 'react-native';
import { ChanguitaLogo } from './ChanguitaLogo';
import {
    NegocioIcon, VentasIcon, PedidosIcon,
    GastosIcon, ClientesIcon, StockIcon,
} from './Icons';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useEmprendimiento } from '../../context/EmprendimientoContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

interface MenuItem {
    key: string;
    label: string;
    icon: (active: boolean) => React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
    { key: 'negocio', label: 'Mi Negocio', icon: (a) => <NegocioIcon color={a ? colors.white : colors.primary} /> },
    { key: 'ventas', label: 'Ventas', icon: (a) => <VentasIcon color={a ? colors.white : colors.primary} /> },
    { key: 'pedidos', label: 'Pedidos', icon: (a) => <PedidosIcon color={a ? colors.white : colors.primary} /> },
    { key: 'gastos', label: 'Gastos', icon: (a) => <GastosIcon color={a ? colors.white : colors.primary} /> },
    { key: 'clientes', label: 'Clientes', icon: (a) => <ClientesIcon color={a ? colors.white : colors.primary} /> },
    { key: 'stock', label: 'Stock', icon: (a) => <StockIcon color={a ? colors.white : colors.primary} /> },
];

interface Props {
    visible: boolean;
    activeKey: string;
    onClose: () => void;
    onNavigate: (key: string) => void;
}

export function DrawerMenu({ visible, activeKey, onClose, onNavigate }: Props) {
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { logout } = useAuth();
    const { emprendimientoActivo } = useEmprendimiento();

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={s.overlay}>
            {/* Fondo oscuro */}
            <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={s.backdropTouch} />
                </TouchableWithoutFeedback>
            </Animated.View>

            {/* Panel lateral */}
            <Animated.View style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}>
                <SafeAreaView style={s.drawerInner}>
                    {/* Logo + emprendimiento */}
                    <View style={s.drawerHeader}>
                        <ChanguitaLogo size={32} />
                        {emprendimientoActivo && (
                            <Text style={s.emprendimientoNombre} numberOfLines={1}>
                                {emprendimientoActivo.nombre}
                            </Text>
                        )}
                    </View>

                    {/* Items */}
                    <View style={s.menuList}>
                        {MENU_ITEMS.map(item => {
                            const active = item.key === activeKey;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[s.menuItem, active && s.menuItemActive]}
                                    onPress={() => { onNavigate(item.key); onClose(); }}
                                    activeOpacity={0.75}
                                >
                                    <View style={s.menuIcon}>{item.icon(active)}</View>
                                    <Text style={[s.menuLabel, active && s.menuLabelActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Cerrar sesión */}
                    <TouchableOpacity
                        style={s.logoutBtn}
                        onPress={async () => { onClose(); await logout(); }}
                        activeOpacity={0.75}
                    >
                        <Text style={s.logoutText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        flexDirection: 'row',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    backdropTouch: { flex: 1 },
    drawer: {
        width: DRAWER_WIDTH,
        backgroundColor: colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    drawerInner: { flex: 1 },
    drawerHeader: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    emprendimientoNombre: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    menuList: {
        flex: 1,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        marginBottom: spacing.xs,
    },
    menuItemActive: {
        backgroundColor: colors.primary,
    },
    menuIcon: {
        width: 28,
        alignItems: 'center',
        marginRight: spacing.md,
    },
    menuLabel: {
        ...typography.body,
        fontWeight: '500',
        color: colors.text,
    },
    menuLabelActive: {
        color: colors.white,
        fontWeight: '600',
    },
    logoutBtn: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.xl,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 14,
        color: colors.error,
        fontWeight: '500',
    },
});
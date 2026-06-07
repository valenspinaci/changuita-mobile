export const colors = {
    primary: '#1A6B3C',
    primaryDark: '#145730',
    primaryLight: '#E8F5EE',
    bg: '#F2F4F3',
    white: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#5A5A5A',
    placeholder: '#A0A0A0',
    border: '#E0E0E0',
    borderFocus: '#1A6B3C',
    error: '#D32F2F',
    errorLight: '#FDECEA',
    warning: '#E65100',
    warningLight: '#FFF3E0',
    success: '#1A6B3C',
    successLight: '#E8F5EE',
    stockOk: '#1A6B3C',
    stockBajo: '#E65100',
    stockAgotado: '#D32F2F',
    pagado: '#1A6B3C',
    pendiente: '#E65100',
};

export const spacing = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
    sm: 8, md: 12, lg: 16, full: 999,
};

export const typography = {
    h1: { fontSize: 32, fontWeight: '700' as const, color: colors.text },
    h2: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
    h3: { fontSize: 20, fontWeight: '600' as const, color: colors.text },
    h4: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
    body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
    bodySecondary: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
    label: { fontSize: 11, fontWeight: '600' as const, color: colors.textSecondary, letterSpacing: 0.8 },
    caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary },
    money: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
    moneyLarge: { fontSize: 36, fontWeight: '700' as const, color: colors.text },
};

export const shadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    primary: {
        shadowColor: '#1A6B3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
};
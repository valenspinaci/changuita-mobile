import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { ChanguitaLogo } from '../../components/ui/ChanguitaLogo';
import { UserIcon, MailIcon, LockIcon, EyeIcon } from '../../components/ui/Icons';
import { colors, spacing, radius, shadow, typography } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

interface PwdStrength { length: boolean; upper: boolean; lower: boolean; number: boolean; special: boolean }
const checkPwd = (p: string): PwdStrength => ({
  length: p.length >= 8,
  upper: /[A-Z]/.test(p),
  lower: /[a-z]/.test(p),
  number: /[0-9]/.test(p),
  special: /[^A-Za-z0-9]/.test(p),
});
const allOk = (s: PwdStrength) => Object.values(s).every(Boolean);

function Req({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: ok ? colors.primary : colors.placeholder, marginRight: 6 }}>
        {ok ? '✓' : '○'}
      </Text>
      <Text style={{ fontSize: 12, color: ok ? colors.primary : colors.textSecondary }}>{text}</Text>
    </View>
  );
}

export default function RegisterScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register } = useAuth();
  const strength = checkPwd(password);
  const clearErr = (f: string) => setErrors(p => { const e = { ...p }; delete e[f]; return e; });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!email) e.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Formato inválido';
    if (!password) e.password = 'La contraseña es obligatoria';
    else if (!allOk(strength)) e.password = 'No cumple los requisitos de seguridad';
    if (!confirm) e.confirm = 'Confirmá tu contraseña';
    else if (password !== confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, nombre.trim());
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No pudimos crear tu cuenta. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.logoWrap}>
            <ChanguitaLogo size={44} />
          </View>

          <Text style={s.heading}>Creá tu cuenta</Text>
          <Text style={s.sub}>Registrate gratis y empezá a gestionar tu emprendimiento</Text>

          {/* Nombre */}
          <View style={s.field}>
            <Text style={s.label}>NOMBRE</Text>
            <View style={[s.inputRow, errors.nombre && s.inputErr]}>
              <View style={s.iconWrap}><UserIcon /></View>
              <TextInput style={s.input} placeholder="Tu nombre o el del negocio"
                placeholderTextColor={colors.placeholder} value={nombre}
                onChangeText={t => { setNombre(t); clearErr('nombre'); }}
                autoCapitalize="words" />
            </View>
            {errors.nombre ? <Text style={s.errText}>{errors.nombre}</Text> : null}
          </View>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.label}>CORREO ELECTRÓNICO</Text>
            <View style={[s.inputRow, errors.email && s.inputErr]}>
              <View style={s.iconWrap}><MailIcon /></View>
              <TextInput style={s.input} placeholder="nombre@ejemplo.com"
                placeholderTextColor={colors.placeholder} value={email}
                onChangeText={t => { setEmail(t); clearErr('email'); }}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>
            {errors.email ? <Text style={s.errText}>{errors.email}</Text> : null}
          </View>

          {/* Contraseña */}
          <View style={s.field}>
            <Text style={s.label}>CONTRASEÑA</Text>
            <View style={[s.inputRow, errors.password && s.inputErr]}>
              <View style={s.iconWrap}><LockIcon /></View>
              <TextInput style={s.input} placeholder="••••••••"
                placeholderTextColor={colors.placeholder} value={password}
                onChangeText={t => { setPassword(t); clearErr('password'); }}
                secureTextEntry={!showPwd} autoCapitalize="none"
                onFocus={() => setPwdFocused(true)}
                onBlur={() => setPwdFocused(false)} />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={s.iconWrap}>
                <EyeIcon />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errText}>{errors.password}</Text> : null}
            {(pwdFocused || password.length > 0) && (
              <View style={s.requirements}>
                <Req ok={strength.length} text="Mínimo 8 caracteres" />
                <Req ok={strength.upper} text="Al menos una mayúscula" />
                <Req ok={strength.lower} text="Al menos una minúscula" />
                <Req ok={strength.number} text="Al menos un número" />
                <Req ok={strength.special} text="Al menos un carácter especial (!@#$...)" />
              </View>
            )}
          </View>

          {/* Confirmar */}
          <View style={s.field}>
            <Text style={s.label}>CONFIRMAR CONTRASEÑA</Text>
            <View style={[s.inputRow, errors.confirm && s.inputErr]}>
              <View style={s.iconWrap}><LockIcon /></View>
              <TextInput style={s.input} placeholder="••••••••"
                placeholderTextColor={colors.placeholder} value={confirm}
                onChangeText={t => { setConfirm(t); clearErr('confirm'); }}
                secureTextEntry={!showConf} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowConf(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={s.iconWrap}>
                <EyeIcon />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={s.errText}>{errors.confirm}</Text> : null}
          </View>

          <TouchableOpacity style={[s.primaryBtn, loading && s.disabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Crear cuenta →</Text>}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>¿Ya tenés cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.link}>Ingresá acá</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  heading: { ...typography.h1, fontSize: 28, textAlign: 'center', marginBottom: spacing.sm },
  sub: { ...typography.bodySecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl },
  field: { marginBottom: spacing.md + 4 },
  label: { ...typography.label, marginBottom: spacing.sm },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 56,
  },
  inputErr: { borderColor: colors.error },
  iconWrap: { marginRight: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
  errText: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 2 },
  requirements: {
    backgroundColor: '#F8FBF9', borderRadius: radius.sm,
    padding: spacing.sm + 4, marginTop: spacing.sm,
    borderWidth: 1, borderColor: '#E0EDE6',
  },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 56, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm, ...shadow.primary,
  },
  disabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  footerText: { ...typography.bodySecondary },
  link: { fontSize: 14, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
});
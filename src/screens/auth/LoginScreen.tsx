import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { ChanguitaLogo } from '../../components/ui/ChanguitaLogo';
import { MailIcon, LockIcon, EyeIcon, GoogleIcon } from '../../components/ui/Icons';
import { colors, spacing, radius, shadow, typography } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Formato de correo inválido';
    if (!password) e.password = 'La contraseña es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Error al ingresar', err.message ?? 'Revisá tus datos e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof typeof errors) =>
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoWrap}>
            <ChanguitaLogo size={44} />
          </View>

          {/* Heading */}
          <Text style={s.heading}>Bienvenido!</Text>
          <Text style={s.sub}>Ingresá tus datos para gestionar tu emprendimiento</Text>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.label}>CORREO ELECTRÓNICO</Text>
            <View style={[s.inputRow, errors.email && s.inputErr]}>
              <View style={s.iconWrap}><MailIcon /></View>
              <TextInput
                style={s.input}
                placeholder="nombre@ejemplo.com"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={(t) => { setEmail(t); clearError('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email ? <Text style={s.errText}>{errors.email}</Text> : null}
          </View>

          {/* Contraseña */}
          <View style={s.field}>
            <View style={s.labelRow}>
              <Text style={s.label}>CONTRASEÑA</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={s.link}>¿Te la olvidaste?</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.inputRow, errors.password && s.inputErr]}>
              <View style={s.iconWrap}><LockIcon /></View>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={(t) => { setPassword(t); clearError('password'); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={s.iconWrap}
              >
                <EyeIcon />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errText}>{errors.password}</Text> : null}
          </View>

          {/* CTA principal */}
          <TouchableOpacity
            style={[s.primaryBtn, loading && s.disabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryBtnText}>Ingresar al sistema  →</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>O TAMBIÉN</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity style={s.googleBtn} activeOpacity={0.85}>
            <GoogleIcon />
            <Text style={s.googleText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>¿No tenés una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}>Creá una hoy</Text>
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={s.legal}>
            <TouchableOpacity><Text style={s.legalLink}>TÉRMINOS</Text></TouchableOpacity>
            <TouchableOpacity><Text style={s.legalLink}>PRIVACIDAD</Text></TouchableOpacity>
            <Text style={s.legalText}>ARGENTINA</Text>
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
  heading: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
  sub: { ...typography.bodySecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
  field: { marginBottom: spacing.md + 4 },
  label: { ...typography.label, marginBottom: spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  link: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 56,
  },
  inputErr: { borderColor: colors.error },
  iconWrap: { marginRight: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
  errText: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 2 },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 56, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm, ...shadow.primary,
  },
  disabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.label, marginHorizontal: spacing.sm, color: colors.placeholder },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    height: 56, borderWidth: 1.5, borderColor: colors.border, gap: 10,
  },
  googleText: { fontSize: 15, fontWeight: '500', color: colors.text },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  footerText: { ...typography.bodySecondary },
  legal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xxl, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  legalLink: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  legalText: { fontSize: 11, color: colors.textSecondary },
});
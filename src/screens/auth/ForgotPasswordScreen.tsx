import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChanguitaLogo } from '../../components/ui/ChanguitaLogo';
import { MailIcon } from '../../components/ui/Icons';
import { colors, spacing, radius, shadow, typography } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '';
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email) { setError('Ingresá tu correo'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Formato de correo inválido'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/change_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: AUTH0_CLIENT_ID,
          email: email.trim().toLowerCase(),
          connection: 'Username-Password-Authentication',
        }),
      });
      if (!res.ok) throw new Error('No pudimos enviar el correo');
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Volver</Text>
          </TouchableOpacity>

          <View style={s.logoWrap}>
            <ChanguitaLogo size={44} />
          </View>

          {!sent ? (
            <>
              <Text style={s.heading}>¿Olvidaste tu contraseña?</Text>
              <Text style={s.sub}>
                Ingresá tu correo y te mandamos un link para crear una nueva contraseña.
              </Text>

              <View style={s.field}>
                <Text style={s.label}>CORREO ELECTRÓNICO</Text>
                <View style={[s.inputRow, error ? s.inputErr : null]}>
                  <View style={s.iconWrap}><MailIcon /></View>
                  <TextInput
                    style={s.input}
                    placeholder="nombre@ejemplo.com"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={t => { setEmail(t); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {error ? <Text style={s.errText}>{error}</Text> : null}
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, loading && s.disabled]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Enviar link de recuperación</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.success}>
              <View style={s.successIconWrap}>
                <MailIcon />
              </View>
              <Text style={s.heading}>Revisá tu correo</Text>
              <Text style={s.sub}>
                Enviamos un link a{' '}
                <Text style={s.emailHighlight}>{email}</Text>.{'\n'}
                Tiene validez por tiempo limitado.
              </Text>
              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Text style={s.primaryBtnText}>Volver al inicio de sesión</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  back: { marginBottom: spacing.md },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
  logoWrap: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  heading: { ...typography.h2, textAlign: 'center', marginBottom: spacing.sm },
  sub: { ...typography.bodySecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl },
  field: { marginBottom: spacing.md },
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
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 56, alignItems: 'center', justifyContent: 'center', ...shadow.primary,
  },
  disabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  success: { alignItems: 'center', paddingTop: spacing.lg },
  successIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emailHighlight: { color: colors.primary, fontWeight: '600' },
});
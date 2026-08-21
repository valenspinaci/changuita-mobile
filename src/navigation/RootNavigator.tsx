import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useEmprendimiento } from '../context/EmprendimientoContext';
import { chequearRecordatorios } from '../utils/notifications';
import AuthNavigator from './AuthNavigator';
import GastosScreen from '../screens/gastos/GastosScreen';
import SeleccionEmprendimientoScreen from '../screens/emprendimiento/CrearEmprendimientoScreen';
import { EmprendimientoProvider } from '../context/EmprendimientoContext';
import { AppHeader } from '../components/ui/AppHeader';
import { DrawerMenu } from '../components/ui/DrawerMenu';
import { OnboardingOverlay } from '../components/ui/OnboardingOverlay';
import { colors } from '../theme';
import VentasScreen from '../screens/ventas/VentasScreen';
import StockScreen from '../screens/stock/StockScreen';
import ClientesScreen from '../screens/clientes/ClientesScreen';
import PedidosScreen from '../screens/pedidos/PedidosScreen';
import MiNegocioScreen from '../screens/negocio/MiNegocioScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';


const Stack = createNativeStackNavigator();

function AppContent() {
  const { emprendimientoActivo, loading, error, recargar, mostrarOnboarding, cerrarOnboarding } = useEmprendimiento();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('negocio');

  useEffect(() => {
    if (emprendimientoActivo) {
      chequearRecordatorios(emprendimientoActivo.id).catch(() => {});
    }
  }, [emprendimientoActivo?.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !emprendimientoActivo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 15, color: colors.text, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          onPress={recargar}
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!emprendimientoActivo) {
    return <SeleccionEmprendimientoScreen />;
  }

const renderScreen = () => {
    switch (activeScreen) {
      case 'negocio': return <MiNegocioScreen onNavigate={setActiveScreen} />;
      case 'ventas': return <VentasScreen onNavigate={setActiveScreen} />;
      case 'pedidos': return <PedidosScreen />;
      case 'gastos': return <GastosScreen />;
      case 'clientes': return <ClientesScreen />;
      case 'stock': return <StockScreen />;
      case 'perfil': return <PerfilScreen />;
      default: return <MiNegocioScreen onNavigate={setActiveScreen} />;
    }
  };

return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} activeScreen={activeScreen} />
      {renderScreen()}
      <DrawerMenu
        visible={drawerOpen}
        activeKey={activeScreen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(key) => setActiveScreen(key)}
      />
      <OnboardingOverlay visible={mostrarOnboarding} onFinish={cerrarOnboarding} />
    </SafeAreaView>
  );
}

function AppNavigator() {
  return (
    <EmprendimientoProvider>
      <AppContent />
    </EmprendimientoProvider>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}
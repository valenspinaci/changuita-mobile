import React, { useState } from 'react';
import { View, ActivityIndicator, SafeAreaView } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useEmprendimiento } from '../context/EmprendimientoContext';
import AuthNavigator from './AuthNavigator';
import GastosScreen from '../screens/gastos/GastosScreen';
import SeleccionEmprendimientoScreen from '../screens/emprendimiento/CrearEmprendimientoScreen';
import { EmprendimientoProvider } from '../context/EmprendimientoContext';
import { AppHeader } from '../components/ui/AppHeader';
import { DrawerMenu } from '../components/ui/DrawerMenu';
import { colors } from '../theme';
import VentasScreen from '../screens/ventas/VentasScreen';
import StockScreen from '../screens/stock/StockScreen';


const Stack = createNativeStackNavigator();

function AppContent() {
  const { emprendimientoActivo, loading } = useEmprendimiento();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('gastos');

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!emprendimientoActivo) {
    return <SeleccionEmprendimientoScreen />;
  }

const renderScreen = () => {
    switch (activeScreen) {
      case 'ventas': return <VentasScreen onNavigate={setActiveScreen} />;
      case 'gastos': return <GastosScreen />;
      case 'stock': return <StockScreen />;
      default: return <GastosScreen />;
    }
  };

return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      {renderScreen()}
      <DrawerMenu
        visible={drawerOpen}
        activeKey={activeScreen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(key) => setActiveScreen(key)}
      />
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
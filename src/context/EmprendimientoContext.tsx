import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMisEmprendimientos } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export interface Emprendimiento {
    id: number;
    nombre: string;
    descripcion?: string;
}

interface EmprendimientoContextValue {
    emprendimientoActivo: Emprendimiento | null;
    emprendimientos: Emprendimiento[];
    loading: boolean;
    error: string | null;
    setEmprendimientoActivo: (e: Emprendimiento) => void;
    recargar: () => Promise<void>;
    mostrarOnboarding: boolean;
    cerrarOnboarding: () => Promise<void>;
    reiniciarOnboarding: () => void;
}

const EmprendimientoContext = createContext<EmprendimientoContextValue | null>(null);

export function EmprendimientoProvider({ children }: { children: React.ReactNode }) {
    const { user, marcarOnboardingCompletado } = useAuth();
    const [emprendimientos, setEmprendimientos] = useState<Emprendimiento[]>([]);
    const [emprendimientoActivo, setEmprendimientoActivo] = useState<Emprendimiento | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mostrarOnboarding, setMostrarOnboarding] = useState(false);

    useEffect(() => {
        // El flag vive en la cuenta (Usuario.onboardingCompletado), no en el
        // dispositivo, para que no se pierda al cambiar de celular ni se
        // "contamine" entre cuentas distintas que usan el mismo dispositivo.
        if (emprendimientoActivo && user && !user.onboardingCompletado) {
            setMostrarOnboarding(true);
        }
    }, [emprendimientoActivo?.id, user?.onboardingCompletado]);

    const cerrarOnboarding = useCallback(async () => {
        setMostrarOnboarding(false);
        await marcarOnboardingCompletado();
    }, [marcarOnboardingCompletado]);

    const reiniciarOnboarding = useCallback(() => {
        setMostrarOnboarding(true);
    }, []);

    const recargar = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getMisEmprendimientos();
            setEmprendimientos(data);
            setError(null);
            if (data.length === 1) setEmprendimientoActivo(data[0]);
        } catch (err: any) {
            setError(err.message ?? 'No pudimos cargar tus emprendimientos');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        recargar();
    }, [recargar]);

    return (
        <EmprendimientoContext.Provider value={{
            emprendimientoActivo,
            emprendimientos,
            loading,
            error,
            setEmprendimientoActivo,
            recargar,
            mostrarOnboarding,
            cerrarOnboarding,
            reiniciarOnboarding,
        }}>
            {children}
        </EmprendimientoContext.Provider>
    );
}

export function useEmprendimiento() {
    const ctx = useContext(EmprendimientoContext);
    if (!ctx) throw new Error('useEmprendimiento debe usarse dentro de <EmprendimientoProvider>');
    return ctx;
}
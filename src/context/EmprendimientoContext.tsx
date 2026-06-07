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
    setEmprendimientoActivo: (e: Emprendimiento) => void;
    recargar: () => Promise<void>;
}

const EmprendimientoContext = createContext<EmprendimientoContextValue | null>(null);

export function EmprendimientoProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [emprendimientos, setEmprendimientos] = useState<Emprendimiento[]>([]);
    const [emprendimientoActivo, setEmprendimientoActivo] = useState<Emprendimiento | null>(null);
    const [loading, setLoading] = useState(true);

    const recargar = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getMisEmprendimientos();
            setEmprendimientos(data);
            if (data.length === 1) setEmprendimientoActivo(data[0]);
        } catch {
            // ignorar
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
            setEmprendimientoActivo,
            recargar,
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
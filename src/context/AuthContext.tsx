import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncUsuario } from '../services/api';

export interface AuthUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '';
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '';
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? '';

const TOKEN_KEY = 'changuita_access_token';
const USER_KEY = 'changuita_user';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // ignorar
      } finally {
        setLoading(false);
      }
    })();
  }, []);

const saveSession = async (accessToken: string, authUser: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setToken(accessToken);
    setUser(authUser);
    // Sincronizar usuario con la DB
try {
      await syncUsuario(accessToken);
    } catch (e: any) {
      console.log('[sync] error:', e.message);
    }
  };

const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        username: email,
        password,
        audience: AUTH0_AUDIENCE,
        scope: 'openid profile email',
        client_id: AUTH0_CLIENT_ID,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error_description ?? 'Credenciales incorrectas');
    }

    const data = await res.json();
    const authUser = parseJwt(data.access_token);
    await saveSession(data.access_token, authUser);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: AUTH0_CLIENT_ID,
        email,
        password,
        connection: 'Username-Password-Authentication',
        name,
      }),
    });

if (!res.ok) {
      const err = await res.json();
      console.log('Error registro Auth0:', JSON.stringify(err));
      throw new Error(err.description ?? err.message ?? 'No pudimos crear tu cuenta');
    }

    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function parseJwt(token: string): AuthUser {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json);
}
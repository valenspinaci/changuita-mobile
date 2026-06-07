# Changuita – Mobile App

Aplicación móvil del sistema Changuita, una plataforma de gestión para emprendedores. Desarrollada en React Native con Expo, compatible con Android e iOS. Consume la misma API REST del backend que la Web App.

---

## Descripción del proyecto

Changuita Mobile está pensada para el uso cotidiano del emprendedor en el campo: registrar ventas rápidas, controlar el stock, gestionar gastos y seguir los pedidos desde el celular. Comparte la lógica de negocio con la versión web a través de la API REST del backend.

---

## Requisitos previos

- Node.js 18 o superior
- Expo CLI: `npm install -g expo-cli`
- Para Android: Android Studio con emulador configurado, o dispositivo físico con Expo Go
- Para iOS: Xcode con simulador configurado (solo macOS), o dispositivo físico con Expo Go

---

## Instalación de dependencias

```bash
npm install
```

---

## Cómo correr el proyecto en local

```bash
# Iniciar el servidor de desarrollo de Expo
npx expo start

# Abrir directamente en Android
npx expo start --android

# Abrir directamente en iOS
npx expo start --ios
```

Una vez que el servidor esté corriendo, podés:
- Escanear el QR con la app **Expo Go** desde el celular
- Presionar `a` para abrir en el emulador de Android
- Presionar `i` para abrir en el simulador de iOS

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
EXPO_PUBLIC_AUTH0_DOMAIN=dev-yhoe6u1lccz83eud.us.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=F5johdgAfw9B3oPd6IBt7YXGOdjH6Vvo
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.changuita.app

# Backend (reemplazar con la IP local de tu máquina en desarrollo)
EXPO_PUBLIC_API_URL=http://192.168.0.22:3001
```

> ⚠️ Nunca subir el archivo `.env` al repositorio.

---

## Arquitectura técnica

```
changuita-mobile/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx       # Contexto de autenticación (token, login, logout)
│   ├── screens/                  # Pantallas de la aplicación
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── SeleccionEmprendimiento.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── VentasScreen.tsx
│   │   ├── GastosScreen.tsx
│   │   └── StockScreen.tsx
│   ├── components/               # Componentes reutilizables (Drawer, Cards, etc.)
│   ├── services/                 # Funciones para llamadas a la API REST
│   └── helpers/                  # Funciones utilitarias
├── App.tsx                       # Entry point y configuración de navegación
├── .env                          # Variables de entorno (no incluido en el repo)
├── .gitignore
├── app.json                      # Configuración de Expo
└── package.json
```

---

## Flujo de autenticación

El login utiliza **Resource Owner Password Grant** directamente contra Auth0, sin redirigir a pantallas externas. El flujo es:

1. El usuario ingresa email y contraseña en `LoginScreen.tsx`
2. Se llama al endpoint de token de Auth0 para obtener el JWT
3. Se llama a `POST /auth/sync` en el backend para registrar/actualizar el usuario
4. Se redirige a la selección de emprendimiento

---

## Módulos implementados

| Módulo | Estado |
|---|---|
| Login / Registro | ✅ Completo |
| Selección de emprendimiento | ✅ Completo |
| Dashboard | ✅ Completo |
| Gestión de Ventas (con carrito, cliente, medio de pago) | ✅ Completo |
| Gestión de Gastos (con categorías) | ✅ Completo |
| Stock y Productos (con variantes) | ✅ Completo |

---

## Librerías principales

| Librería | Uso |
|---|---|
| `react-native` | Framework móvil multiplataforma |
| `expo` | Toolchain y runtime |
| `@react-navigation/native` | Navegación entre pantallas |
| `@react-navigation/drawer` | Menú lateral con animación |
| `axios` / `fetch` | Llamadas a la API REST |
| `react-native-async-storage` | Persistencia local del token |

interface Auth0ErrorBody {
  code?: string;
  error?: string;
  error_description?: string;
  description?: string;
  policy?: string;
}

export function isNetworkError(err: any): boolean {
  return err instanceof TypeError || err?.message === 'Failed to fetch' || err?.message === 'Network request failed';
}

const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor. Revisá tu conexión a internet e intentá de nuevo.';

export function getLoginErrorMessage(err: any): string {
  if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;

  const body: Auth0ErrorBody = err ?? {};
  switch (body.error ?? body.code) {
    case 'invalid_grant':
      return 'El correo o la contraseña son incorrectos.';
    case 'too_many_attempts':
      return 'Bloqueamos tu cuenta temporalmente por demasiados intentos fallidos. Probá de nuevo en unos minutos o restablecé tu contraseña.';
    case 'unauthorized':
      return 'Necesitás verificar tu correo antes de iniciar sesión. Revisá tu bandeja de entrada.';
    default:
      return body.error_description || 'No pudimos iniciar sesión. Intentá de nuevo.';
  }
}

export function getRegisterErrorMessage(err: any): string {
  if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;

  const body: Auth0ErrorBody = err ?? {};
  switch (body.code) {
    case 'invalid_signup':
      return 'Ya existe una cuenta con ese correo, o los datos no cumplen los requisitos para registrarse. Si ya tenés cuenta, iniciá sesión.';
    case 'invalid_password':
      return body.policy
        ? `La contraseña no cumple los requisitos del servidor: ${body.policy}`
        : 'La contraseña no cumple los requisitos de seguridad del servidor.';
    default:
      return body.description || body.error_description || 'No pudimos crear tu cuenta. Intentá de nuevo.';
  }
}

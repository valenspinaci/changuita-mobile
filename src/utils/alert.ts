import { Alert, Platform } from 'react-native';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

// Alert.alert no se renderiza en absoluto en react-native-web: en la web,
// todo mensaje de error y toda confirmación quedan invisibles y la acción
// parece "no hacer nada". Este wrapper cae a window.alert/confirm en web.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') {
        Alert.alert(title, message, buttons);
        return;
    }

    const texto = [title, message].filter(Boolean).join('\n\n');

    if (!buttons || buttons.length <= 1) {
        window.alert(texto);
        buttons?.[0]?.onPress?.();
        return;
    }

    const confirmBtn = buttons.find(b => b.style === 'destructive') ?? buttons.find(b => b.style !== 'cancel');
    const cancelBtn = buttons.find(b => b.style === 'cancel');

    if (window.confirm(texto)) {
        confirmBtn?.onPress?.();
    } else {
        cancelBtn?.onPress?.();
    }
}

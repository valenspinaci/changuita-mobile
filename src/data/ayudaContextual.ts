export interface AyudaContenido {
    titulo: string;
    tips: string[];
}

export const AYUDA_CONTEXTUAL: Record<string, AyudaContenido> = {
    negocio: {
        titulo: 'Mi Negocio',
        tips: [
            'Acá ves un resumen de tu negocio: ventas totales, gastos y ganancia estimada según el período elegido (hoy, semana o mes).',
            'Tocá "Editar" junto al nombre del negocio para cambiar nombre o descripción.',
            'Si hay stock crítico, aparece una alerta que te lleva directo a Stock.',
            'Usá los accesos rápidos para registrar una venta o un gasto sin salir de esta pantalla.',
        ],
    },
    ventas: {
        titulo: 'Ventas',
        tips: [
            'Tocá "+ Nueva Venta" y elegí los productos para armar el carrito.',
            'Activá "Es un pedido" si es una orden a futuro: no descuenta stock y aparece en la sección Pedidos, no acá.',
            'Si la venta no se cobró todavía, quedará como "PEND" — podés marcarla como cobrada más tarde desde la lista.',
        ],
    },
    pedidos: {
        titulo: 'Pedidos',
        tips: [
            'Acá aparecen los pedidos creados desde Ventas (activando "Es un pedido").',
            'Los pedidos están organizados por estado: pendientes, activos y entregados.',
            'Tocá "Marcar como activo/entregado" para avanzar el estado, o "Cancelar" si no va a concretarse.',
        ],
    },
    gastos: {
        titulo: 'Gastos',
        tips: [
            'Registrá cada gasto con monto, descripción y una categoría para poder analizarlos después.',
            'Podés crear categorías nuevas al momento de cargar un gasto.',
            'La tarjeta superior muestra el total gastado en el mes actual.',
        ],
    },
    clientes: {
        titulo: 'Clientes',
        tips: [
            'Tocá "+ Nuevo Cliente" para cargar nombre, contacto y notas.',
            'Tocá cualquier cliente de la lista para ver su historial de compras completo.',
            'Desde el detalle de un cliente podés editarlo o eliminarlo.',
        ],
    },
    stock: {
        titulo: 'Productos y Stock',
        tips: [
            'Cada producto muestra su stock actual y un indicador de color: OK, BAJO o AGOTADO según el stock mínimo que configures.',
            'Tocá "•••" en un producto para editarlo o eliminarlo.',
            'Filtrá por categoría con los botones debajo del buscador.',
        ],
    },
    perfil: {
        titulo: 'Perfil',
        tips: [
            'Tocá "Editar nombre" para cambiar cómo te ves en la app.',
            'Acá también podés ver el emprendimiento activo y cerrar sesión.',
        ],
    },
};

export interface OnboardingStep {
    key: string;
    titulo: string;
    descripcion: string;
    emoji: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        key: 'bienvenida',
        titulo: '¡Bienvenido a Changuita!',
        descripcion: 'Te ayudamos a gestionar tu emprendimiento en un solo lugar. Este es un recorrido rápido por las funciones principales — podés saltarlo cuando quieras.',
        emoji: '👋',
    },
    {
        key: 'negocio',
        titulo: 'Mi Negocio',
        descripcion: 'Tu panel principal: ventas, gastos y ganancia del período, además de alertas cuando algún producto tiene stock crítico.',
        emoji: '📊',
    },
    {
        key: 'ventas',
        titulo: 'Ventas',
        descripcion: 'Registrá ventas en segundos. Si es una orden a futuro (no una venta inmediata), marcala como pedido y no te va a descontar stock todavía.',
        emoji: '🛒',
    },
    {
        key: 'stock',
        titulo: 'Stock',
        descripcion: 'Cargá tus productos y controlá el inventario. Te avisamos cuando el stock esté bajo o agotado.',
        emoji: '📦',
    },
    {
        key: 'gastos',
        titulo: 'Gastos',
        descripcion: 'Anotá cada gasto y agrupalo por categoría para entender mejor en qué se va la plata del negocio.',
        emoji: '💳',
    },
    {
        key: 'clientes',
        titulo: 'Clientes',
        descripcion: 'Guardá los datos de tus clientes y consultá el historial de compras de cada uno cuando lo necesites.',
        emoji: '👥',
    },
    {
        key: 'pedidos',
        titulo: 'Pedidos',
        descripcion: 'Seguí el estado de tus pedidos de un vistazo: pendientes, activos y entregados.',
        emoji: '🧾',
    },
];

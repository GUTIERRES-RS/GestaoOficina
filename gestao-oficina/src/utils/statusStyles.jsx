/**
 * Mapeia os status das O.S. para suas respectivas classes CSS.
 */
export const STATUS_CLASS_MAP = {
    'Aberto': 'status-aberto',
    'Em Andamento': 'status-andamento',
    'Em andamento': 'status-andamento',
    'Aguardando Peça': 'status-peca',
    'Orçamento': 'status-orcamento',
    'Finalizado': 'status-finalizado',
    'Entregue': 'status-entregue',
    'Cancelado': 'status-cancelado',
};

/**
 * Mapeia os status para cores (hex ou variáveis CSS) para uso em gráficos ou elementos que não aceitam classes.
 */
export const STATUS_COLORS = {
    'Aberto': 'var(--warning-color)',
    'Em Andamento': 'var(--info-color)',
    'Em andamento': 'var(--info-color)',
    'Aguardando Peça': 'var(--purple-text)',
    'Orçamento': '#7e22ce',
    'Finalizado': 'var(--success-color)',
    'Entregue': 'var(--text-secondary)',
    'Cancelado': 'var(--danger-color)',
};

/**
 * Retorna a classe CSS para um dado status de OS.
 * @param {string} status - Status da OS
 * @returns {string} Classe CSS
 */
export const getStatusClass = (status) =>
    STATUS_CLASS_MAP[status] || 'status-andamento';

/**
 * Retorna a cor sólida do status (para gráficos).
 * @param {string} status - Status da OS
 * @returns {string} Cor (hex ou var)
 */
export const getStatusColor = (status) =>
    STATUS_COLORS[status] || 'var(--info-color)';

/**
 * Componente: renderiza o badge de status completo utilizando classes CSS globais.
 * Uso: <StatusBadge status={os.status} />
 */
export const StatusBadge = ({ status }) => (
    <span className={`status-badge ${getStatusClass(status)}`}>
        {status}
    </span>
);

/**
 * Legado: Mantido por compatibilidade com outros componentes que possam usar getStatusStyle.
 * Agora retorna apenas um objeto vazio pois os estilos estão no CSS.
 */
export const getStatusStyle = () => ({});
export const STATUS_BADGE_BASE = {};

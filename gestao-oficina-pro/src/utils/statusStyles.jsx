/**
 * Retorna o estilo inline (background, color, border) correspondente ao status de uma OS.
 * Usado em todas as páginas para garantir cores consistentes.
 */
export const STATUS_STYLE_MAP = {
    'Aberto': { background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' },
    'Em Andamento': { background: '#dbeafe', color: '#1e40af', border: '1px solid #3b82f6' },
    'Em andamento': { background: '#dbeafe', color: '#1e40af', border: '1px solid #3b82f6' },
    'Aguardando Peça': { background: '#ede9fe', color: '#5b21b6', border: '1px solid #8b5cf6' },
    'Orçamento': { background: '#f3e8ff', color: '#7e22ce', border: '1px solid #a855f7' },
    'Finalizado': { background: '#d1fae5', color: '#065f46', border: '1px solid #10b981' },
    'Entregue': { background: '#f1f5f9', color: '#334155', border: '1px solid #64748b' },
    'Cancelado': { background: '#fee2e2', color: '#991b1b', border: '1px solid #ef4444' },
};

const DEFAULT_STYLE = { background: '#dbeafe', color: '#1e40af', border: '1px solid #3b82f6' };

/**
 * Retorna o objeto de estilo CSS para um dado status de OS.
 * @param {string} status - Status da OS (ex: 'Aberto', 'Entregue')
 * @returns {object} Objeto de estilo CSS
 */
export const getStatusStyle = (status) =>
    STATUS_STYLE_MAP[status] || DEFAULT_STYLE;

/**
 * Estilo base para o badge de status (aplicar junto com getStatusStyle via spread).
 */
export const STATUS_BADGE_BASE = {
    display: 'inline-block',
    padding: '0.2rem 0.65rem',
    borderRadius: '9999px',
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
};

/**
 * Componente inline: renderiza o badge de status completo.
 * Uso: <StatusBadge status={os.status} />
 */
export const StatusBadge = ({ status }) => (
    <span style={{ ...STATUS_BADGE_BASE, ...getStatusStyle(status) }}>
        {status}
    </span>
);

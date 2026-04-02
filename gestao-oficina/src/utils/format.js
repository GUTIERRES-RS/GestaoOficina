/**
 * Formata um valor numérico para moeda Brasileira (BRL).
 * @param {number|string} value - O valor a ser formatado.
 * @returns {string} Valor formatado (ex: R$ 1.250,00).
 */
export const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(value) || 0);
};

/**
 * Formata uma string de data para o padrão Brasileiro (DD/MM/AAAA).
 * @param {string|Date} dateString - A data a ser formatada.
 * @param {boolean} includeTime - Se deve incluir a hora (HH:mm).
 * @returns {string} Data formatada.
 */
export const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--';

    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return date.toLocaleString('pt-BR', options);
};

/**
 * Formata uma porcentagem.
 * @param {number|string} value - O valor residual (ex: 0.1 para 10%).
 * @returns {string} Porcentagem formatada.
 */
export const formatPercent = (value) => {
    return `${(Number(value) || 0).toFixed(1)}%`;
};

/**
 * Resume um UUID para exibição amigável (ex: #5ec309fe).
 * @param {string} uuid - O UUID completo.
 * @returns {string} UUID resumido com prefixo #.
 */
export const formatUUID = (uuid) => {
    if (!uuid) return '--';
    const cleanUuid = uuid.replace(/-/g, '');
    return `#${cleanUuid.substring(0, 8).toUpperCase()}`;
};

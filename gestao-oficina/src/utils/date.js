/**
 * Retorna as datas de início e fim para um período pré-definido.
 * @param {string} period - O período (ex: 'month', 'lastmonth', 'quarter', 'year').
 * @returns {object} Objeto com start e end formatado como YYYY-MM-DD.
 */
export const getPeriodDates = (period) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'month' || period === 'este_mes' || period === 'Este Mês') {
        return {
            start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
            end: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
        };
    }

    if (period === 'lastmonth' || period === 'mes_anterior' || period === 'Mês Anterior') {
        return {
            start: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
            end: fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
        };
    }

    if (period === 'quarter' || period === 'este_trimestre' || period === 'Este Trimestre') {
        const q = Math.floor(now.getMonth() / 3);
        return {
            start: fmt(new Date(now.getFullYear(), q * 3, 1)),
            end: fmt(new Date(now.getFullYear(), q * 3 + 3, 0)),
        };
    }

    if (period === 'year' || period === 'este_ano' || period === 'Este Ano') {
        return {
            start: fmt(new Date(now.getFullYear(), 0, 1)),
            end: fmt(new Date(now.getFullYear(), 11, 31)),
        };
    }

    return { start: '', end: '' };
};

export const PERIODS = [
    { key: 'month', label: 'Este Mês' },
    { key: 'lastmonth', label: 'Mês Anterior' },
    { key: 'quarter', label: 'Este Trimestre' },
    { key: 'year', label: 'Este Ano' },
    { key: 'custom', label: 'Personalizado' },
];

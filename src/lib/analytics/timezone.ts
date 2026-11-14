/**
 * Utilidades de Zona Horaria para Analíticas de 90+5 Store
 * Zona horaria predeterminada: America/Tegucigalpa (UTC-6)
 */

export const STORE_TIMEZONE = process.env.NEXT_PUBLIC_STORE_TIMEZONE || 'America/Tegucigalpa';

/**
 * Obtiene las partes de fecha y hora actuales en la zona horaria de la tienda.
 */
export function getStoreDateParts(date: Date = new Date(), timeZone: string = STORE_TIMEZONE) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

    return {
        year: parseInt(getPart('year'), 10),
        month: parseInt(getPart('month'), 10), // 1-12
        day: parseInt(getPart('day'), 10),
        hour: parseInt(getPart('hour'), 10),
        minute: parseInt(getPart('minute'), 10),
        second: parseInt(getPart('second'), 10),
    };
}

/**
 * Calcula el objeto Date (en UTC) que corresponde al inicio exacto del día (00:00:00.000)
 * en la zona horaria de la tienda.
 * 
 * En America/Tegucigalpa (UTC-6), las 00:00:00 del día actual corresponden a las 06:00:00 UTC del mismo día.
 */
export function getStartOfDayInStoreTz(referenceDate: Date = new Date(), timeZone: string = STORE_TIMEZONE): Date {
    const parts = getStoreDateParts(referenceDate, timeZone);
    
    // Crear un string con formato ISO local en la zona horaria de la tienda
    const yyyy = String(parts.year).padStart(4, '0');
    const mm = String(parts.month).padStart(2, '0');
    const dd = String(parts.day).padStart(2, '0');
    
    // Obtenemos el offset actual de esa zona horaria con respecto a UTC
    const dateLocalMidnightStr = `${yyyy}-${mm}-${dd}T00:00:00`;
    
    // Calculamos la diferencia de minutos entre UTC y la zona horaria en esa fecha
    const utcDate = new Date(`${dateLocalMidnightStr}Z`);
    const tzDateParts = getStoreDateParts(utcDate, timeZone);
    const tzDateAsUtc = new Date(Date.UTC(tzDateParts.year, tzDateParts.month - 1, tzDateParts.day, tzDateParts.hour, tzDateParts.minute, tzDateParts.second));
    const offsetMs = tzDateAsUtc.getTime() - utcDate.getTime();

    // El inicio del día en tiempo universal (UTC)
    return new Date(utcDate.getTime() - offsetMs);
}

/**
 * Convierte un timestamp UTC (Date o string ISO) a la fecha 'YYYY-MM-DD' en la zona horaria de la tienda.
 */
export function formatDateKeyInStoreTz(dateOrIso: Date | string, timeZone: string = STORE_TIMEZONE): string {
    const date = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(date.getTime())) return 'Fecha inválida';

    const parts = getStoreDateParts(date, timeZone);
    const yyyy = String(parts.year).padStart(4, '0');
    const mm = String(parts.month).padStart(2, '0');
    const dd = String(parts.day).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Genera una lista de N días recientes en formato 'YYYY-MM-DD' en la zona horaria de la tienda.
 * Ordenados cronológicamente (del más antiguo al más reciente).
 */
export function getRecentDaysInStoreTz(daysCount: number, referenceDate: Date = new Date(), timeZone: string = STORE_TIMEZONE): string[] {
    const days: string[] = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
        const targetDate = new Date(referenceDate.getTime() - i * 24 * 60 * 60 * 1000);
        days.push(formatDateKeyInStoreTz(targetDate, timeZone));
    }
    
    return days;
}

/**
 * Convierte 'YYYY-MM-DD' al instante UTC ISO exacto del inicio del día (00:00:00.000) en la zona horaria de la tienda.
 */
export function getStoreDayStartIso(dateStr: string, timeZone: string = STORE_TIMEZONE): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return new Date(dateStr).toISOString();
    // Usar mediodía UTC del día para evitar saltos por diferencia de fecha al calcular inicio de día en STORE_TIMEZONE
    const approxUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return getStartOfDayInStoreTz(approxUtc, timeZone).toISOString();
}

/**
 * Convierte 'YYYY-MM-DD' al instante UTC ISO exacto del fin del día (23:59:59.999) en la zona horaria de la tienda.
 */
export function getStoreDayEndIso(dateStr: string, timeZone: string = STORE_TIMEZONE): string {
    const startMs = new Date(getStoreDayStartIso(dateStr, timeZone)).getTime();
    return new Date(startMs + 24 * 60 * 60 * 1000 - 1).toISOString();
}



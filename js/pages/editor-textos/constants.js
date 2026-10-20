/**
 * constants.js — Constantes globales del Editor de Textos
 * EduConta SV — Módulo sin dependencias externas.
 */

// ── Almacenamiento Local ───────────────────────────────────────────────────
export const STORAGE_KEY = 'educonta_projects_textos';
export const LAST_ID_KEY = 'educonta_last_project_id';
export const MAX_HISTORY = 30;

// ── Dimensiones de Papel (mm) ──────────────────────────────────────────────
export const PAGE_DIMENSIONS = {
    letter: { width: 215.9, height: 279.4, label: 'Carta (Letter)' },
    oficio: { width: 215.9, height: 330.2, label: 'Oficio (Folio)' },
    legal:  { width: 215.9, height: 355.6, label: 'Legal' },
    a4:     { width: 210.0, height: 297.0, label: 'A4' },
    a5:     { width: 148.0, height: 210.0, label: 'A5' }
};

// ── Preajustes de Márgenes (mm) ────────────────────────────────────────────
export const MARGIN_PRESETS = {
    normal:   { top: 25, bottom: 25, left: 25, right: 25 },
    narrow:   { top: 15, bottom: 15, left: 15, right: 15 },
    moderate: { top: 20, bottom: 20, left: 20, right: 20 },
    wide:     { top: 30, bottom: 30, left: 30, right: 30 }
};

// ── Símbolos especiales ────────────────────────────────────────────────────
export const SPECIAL_SYMBOLS = [
    '$', '¢', '€', '£', '¥', '©', '®', '™', '§', '¶',
    '±', '≠', '≤', '≥', '÷', '×', '‰', '°', 'µ', 'π',
    '✓', '✗', '—', '–', '…', '«', '»', '"', '"', '¿',
    '¡', '•', '→', '←', '↑', '↓', '↔', '▲', '▼', '◆'
];

// ── Paleta de colores glassmorphic ────────────────────────────────────────
export const EDUCONTA_COLOR_PRESETS = [
    // Neutros / Grises
    '#000000', '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#ffffff',
    // Ámbar (Documentos / Advertencias)
    '#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fef3c7',
    // Esmeralda (Activos / Positivos)
    '#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#d1fae5',
    // Celeste (Proyectos / Bancos)
    '#082f49', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#e0f2fe',
    // Índigo (Catálogos / Cuentas)
    '#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#e0e7ff',
    // Rojo / Rosa (Pasivos / Gastos)
    '#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fee2e2',
    // Violeta / Púrpura (Patrimonio)
    '#3b0764', '#581c87', '#6b21a8', '#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#f3e8ff',
    // Turquesa / Teal (Caja Chica)
    '#042f2e', '#115e59', '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1'
];

// ── Factor de conversión mm → px (96 DPI) ─────────────────────────────────
export function mmToPx(mm) {
    return (mm * 96) / 25.4;
}

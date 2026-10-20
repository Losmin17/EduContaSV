/**
 * audit.js — AuditModeHandler
 * Modo solo-lectura (window.isAuditMode). Sin dependencias de otros módulos.
 * EduConta SV
 */

const AuditModeHandler = {
    apply() {
        document.querySelectorAll('.page-editor-surface').forEach(surface => {
            surface.setAttribute('contenteditable', 'false');
        });

        document.querySelectorAll('.tool-btn, .toolbar-btn, #font-family-select, #font-size-select, #block-style-select, #page-size-select, #page-margins-select, #page-spacing-select, #text-color-input, #bg-color-input').forEach(el => {
            el.disabled = true;
            el.style.opacity = '0.4';
            el.style.pointerEvents = 'none';
        });

        const saveBtn = document.getElementById('btn-save-doc');
        if (saveBtn) saveBtn.style.display = 'none';
        const saveToolbarBtn = document.getElementById('btn-save-toolbar');
        if (saveToolbarBtn) saveToolbarBtn.style.display = 'none';
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) undoBtn.style.display = 'none';
        const redoBtn = document.getElementById('btn-redo');
        if (redoBtn) redoBtn.style.display = 'none';
    }
};

export { AuditModeHandler };
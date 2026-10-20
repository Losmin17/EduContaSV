/**
 * export.js — DocExportManager
 * Exportación multiformato: .EDC, .HTML, .TXT, PDF (window.print).
 * EduConta SV
 */
import { MultiPageEngine } from './engine.js';
import { TextDocStateManager } from './state.js';
    const DocExportManager = {
        openExportModal() {
            const modal = document.getElementById('export-modal');
            if (modal) modal.style.display = 'flex';
        },

        closeExportModal() {
            const modal = document.getElementById('export-modal');
            if (modal) modal.style.display = 'none';
        },

        printPDF() {
            this.closeExportModal();
            window.print();
        },

        exportEDC() {
            this.closeExportModal();
            const project = TextDocStateManager.currentProject;
            if (!project) return;

            if (project.sheets[TextDocStateManager.activeSheetIndex]) {
                project.sheets[TextDocStateManager.activeSheetIndex].content = MultiPageEngine.getCleanHTML();
            }

            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `${project.name || 'documento'}_backup.edc`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            TextDocStateManager.showToast('Copia de seguridad .EDC descargada');
        },

        exportHTML() {
            this.closeExportModal();
            const project = TextDocStateManager.currentProject;
            if (!project) return;

            const sheet = project.sheets?.[TextDocStateManager.activeSheetIndex];
            const fontName = (sheet?.fontFamily || 'Plus Jakarta Sans').trim().replace(/^['"]|['"]$/g, '');
            const fontParam = encodeURIComponent(fontName).replace(/%20/g, '+');

            const docContent = MultiPageEngine.getCleanHTML();

            const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${project.name || 'Documento EduConta SV'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono&family=${fontParam}:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: '${fontName}', 'Plus Jakarta Sans', sans-serif; line-height: 1.6; color: #1e293b; max-width: 850px; margin: 0 auto; padding: 25mm; background: #ffffff; }
        h1 { font-size: 2rem; font-weight: 800; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; }
        h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; }
        h3 { font-size: 1.25rem; font-weight: 600; }
        blockquote { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px 18px; font-style: italic; margin: 16px 0; border-radius: 0 8px 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
        code { font-family: 'JetBrains Mono', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .edu-callout { padding: 12px 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b; background: #fffbeb; }
    </style>
</head>
<body>
    ${docContent}
</body>
</html>`;

            const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name || 'documento'}.html`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            TextDocStateManager.showToast('Documento .HTML descargado');
        },

        exportTXT() {
            this.closeExportModal();
            const project = TextDocStateManager.currentProject;
            if (!project) return;

            const editors = MultiPageEngine.getAllEditors();
            let text = '';
            editors.forEach(ed => {
                const clone = ed.cloneNode(true);
                clone.querySelectorAll('.toc-block').forEach(el => el.remove());
                text += '\n\n' + (clone.innerText || clone.textContent || '');
            });

            const blob = new Blob([text.trim()], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name || 'documento'}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            TextDocStateManager.showToast('Texto plano .TXT descargado');
        }
    };
export { DocExportManager };
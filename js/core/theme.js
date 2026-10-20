/**
 * EduConta SV — Theme Manager
 * Maneja el modo oscuro/claro con localStorage + prefers-color-scheme
 * Inyecta el botón de toggle en el header compartido
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'educonta-theme';
    const DARK = 'dark';
    const LIGHT = 'light';

    // ─── Cronómetro de inicio para preloader de alta fidelidad ────────────
    if (typeof window !== 'undefined' && !window._educontaPreloaderStartTime) {
        window._educontaPreloaderStartTime = Date.now();
    }

    // ─── Aplicar tema ANTES del primer paint (evita flash) ───────────────
    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === DARK || stored === LIGHT) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === DARK) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem(STORAGE_KEY, theme);
        updateToggleIcon(theme);
    }

    // ─── Aplica el tema inmediatamente al cargar ──────────────────────────
    applyTheme(getPreferredTheme());

    // ─── Actualizar ícono del botón ───────────────────────────────────────
    function updateToggleIcon(theme) {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;

        if (theme === DARK) {
            icon.className = 'fas fa-sun';
            btn.title = 'Cambiar a modo claro';
        } else {
            icon.className = 'fas fa-moon';
            btn.title = 'Cambiar a modo oscuro';
        }

        // Micro-animación de rotación al cambiar
        icon.style.transform = 'rotate(360deg) scale(0.5)';
        icon.style.opacity = '0';
        setTimeout(() => {
            icon.style.transform = 'rotate(0deg) scale(1)';
            icon.style.opacity = '1';
        }, 150);
    }

    // ─── Toggle ───────────────────────────────────────────────────────────
    window.toggleTheme = function() {
        const current = document.documentElement.getAttribute('data-theme') || LIGHT;
        const next = current === DARK ? LIGHT : DARK;
        
        // Agregar clase ligera para transiciones de fondo en contenedores principales
        document.documentElement.classList.add('theme-in-transition');
        applyTheme(next);
        
        // Remover la clase de transición tras 300ms sin sobrecarga de timeouts anidados
        setTimeout(() => {
            document.documentElement.classList.remove('theme-in-transition');
        }, 300);
    };

    // ─── Inyectar botón en el header una vez que esté disponible ─────────
    function injectToggleButton() {
        // Evitar duplicados
        if (document.getElementById('theme-toggle-btn')) {
            updateToggleIcon(document.documentElement.getAttribute('data-theme') || LIGHT);
            return;
        }

        // El header se inyecta por components.js, esperar que exista
        const headerRightZone = document.querySelector('.main-header .flex.items-center.gap-4');
        if (!headerRightZone) return;

        const btn = document.createElement('button');
        btn.id = 'theme-toggle-btn';
        btn.onclick = window.toggleTheme;
        btn.setAttribute('aria-label', 'Cambiar tema');

        const icon = document.createElement('i');
        const current = document.documentElement.getAttribute('data-theme') || LIGHT;
        icon.className = current === DARK ? 'fas fa-sun' : 'fas fa-moon';
        btn.title = current === DARK ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        btn.appendChild(icon);

        // Insertar antes del primer hijo (a la izquierda del área derecha)
        headerRightZone.insertBefore(btn, headerRightZone.firstChild);
    }

    // ─── Escuchar cambios en preferencia del SO ───────────────────────────
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Solo reaccionar si el usuario no eligió manualmente
        if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(e.matches ? DARK : LIGHT);
        }
    });

    // Fallback: si el header se inyecta dinámicamente (MutationObserver)
    function initObserver() {
        if (!document.body) return;
        const observer = new MutationObserver(() => {
            if (!document.getElementById('theme-toggle-btn')) {
                injectToggleButton();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Detener el observer después de 5s para no consumir recursos
        setTimeout(() => observer.disconnect(), 5000);
    }

    // ─── Inicializar botón cuando el DOM esté listo ───────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Esperar un tick para que components.js inyecte el header
            requestAnimationFrame(() => {
                setTimeout(injectToggleButton, 0);
            });
            initObserver();
        });
    } else {
        requestAnimationFrame(() => {
            setTimeout(injectToggleButton, 0);
        });
        initObserver();
    }

})();

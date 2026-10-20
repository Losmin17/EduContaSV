/**
 * EduConta SV - Gestor de Fuentes Dinámico (Google Fonts Manager)
 * Proporciona el catálogo de 200+ fuentes gratuitas y su carga asíncrona optimizada por lotes.
 */

(function () {
    const loadedGoogleFonts = new Set([
        'Plus Jakarta Sans', 'Outfit', 'Inter', 'Roboto', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'
    ]);

    function addPreconnectLinks() {
        if (!document.getElementById('gfonts-preconnect-1')) {
            const link1 = document.createElement('link');
            link1.id = 'gfonts-preconnect-1';
            link1.rel = 'preconnect';
            link1.href = 'https://fonts.googleapis.com';
            document.head.appendChild(link1);

            const link2 = document.createElement('link');
            link2.id = 'gfonts-preconnect-2';
            link2.rel = 'preconnect';
            link2.href = 'https://fonts.gstatic.com';
            link2.crossOrigin = 'anonymous';
            document.head.appendChild(link2);
        }
    }

    /**
     * Carga dinámicamente una fuente individual de Google Fonts si no está en caché
     */
    function ensureGoogleFontLoaded(fontName) {
        if (!fontName || typeof fontName !== 'string') return;
        const cleanFont = fontName.trim().replace(/^['"]|['"]$/g, '');
        if (!cleanFont || loadedGoogleFonts.has(cleanFont)) return;

        loadedGoogleFonts.add(cleanFont);
        const linkId = `gfont-${cleanFont.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            const fontParam = encodeURIComponent(cleanFont).replace(/%20/g, '+');
            link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
            document.head.appendChild(link);
        }
    }

    // Catálogo organizado de 200+ fuentes gratuitas de Google Fonts
    const FONT_CATALOG_200 = [
        {
            category: "Populares & Destacadas",
            fonts: [
                "Plus Jakarta Sans", "Outfit", "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", 
                "Raleway", "Nunito", "Playfair Display", "Fira Code", "Dancing Script", "Bebas Neue", "Pacifico"
            ]
        },
        {
            category: "Sans-Serif (Modernas & Limpias)",
            fonts: [
                "Work Sans", "Ubuntu", "Rubik", "Quicksand", "Kanit", "PT Sans", "Fira Sans", "Oswald", 
                "DM Sans", "Barlow", "Noto Sans", "Titillium Web", "Heebo", "Josefin Sans", "Cabin", 
                "Arimo", "Hind", "Manrope", "Space Grotesk", "Syne", "Urbanist", "Sora", "Red Hat Display", 
                "Lexend", "Figtree", "Be Vietnam Pro", "Public Sans", "Albert Sans", "Spline Sans", "Readex Pro", 
                "Lexend Deca", "Epilogue", "Plus Jakarta Sans", "Inter", "Outfit", "DM Sans", "Jost", 
                "Mukta", "Asap", "Questrial", "Catamaran", "Signika", "Maven Pro", "Archivo", "Dosis", 
                "Expletus Sans", "Hind Siliguri", "Hanken Grotesk", "Mulish", "Overpass", "Karla", "Varela Round",
                "Tenor Sans", "Sen", "Yantramanav", "Tajawal", "Chivo", "Monda", "Gantari", "Mplus 1p"
            ]
        },
        {
            category: "Serif (Elegantes & Contables)",
            fonts: [
                "Merriweather", "Lora", "PT Serif", "Noto Serif", "Cinzel", "Crimson Text", "EB Garamond", 
                "Cormorant Garamond", "Libre Baskerville", "Arvo", "Bodoni Moda", "Spectral", "Frank Ruhl Libre", 
                "Zilla Slab", "Bitter", "Prata", "Domine", "Faustina", "Alata", "Volkhov", "Crimson Pro", 
                "BioRhyme", "Cardo", "Alegreya", "Alice", "Antic Didone", "Aboreto", "Amiri", "Castoro", 
                "Della Respira", "Goudy Bookletter 1911", "Inria Serif", "Instrument Serif", "Newsreader", 
                "Oranienbaum", "Petrona", "Quattrocento", "Rozha One", "Cinzel Decorative", "Vollkorn"
            ]
        },
        {
            category: "Monospace (Código & Celdas Exactas)",
            fonts: [
                "JetBrains Mono", "Roboto Mono", "Source Code Pro", "Space Mono", "Inconsolata", "Ubuntu Mono", 
                "PT Mono", "Anonymous Pro", "Share Tech Mono", "Cousine", "Cutive Mono", "Major Mono Display", 
                "Nova Mono", "B612 Mono", "Red Hat Mono", "Martian Mono", "Chivo Mono", "Azeret Mono", 
                "Syne Mono", "Overpass Mono", "Fira Mono", "Spline Sans Mono", "Xanh Mono", "Nanum Gothic Coding", 
                "Fantasque Sans Mono", "IBM Plex Mono", "Victor Mono", "Code Saver", "Fragment Mono", "VT323"
            ]
        },
        {
            category: "Cursivas & Manuscritas (Firmas)",
            fonts: [
                "Great Vibes", "Satisfy", "Sacramento", "Caveat", "Alex Brush", "Lobster", "Lobster Two", 
                "Allura", "Yellowtail", "Kaushan Script", "Parisienne", "Cookie", "Rochester", "Marck Script", 
                "Bad Script", "Courgette", "Tangerine", "Clicker Script", "Damion", "Homemade Apple", 
                "Italianno", "Herr Von Muellerhoff", "Mrs Saint Delafield", "Pinyon Script", "Playball", 
                "Qwigley", "Reenie Beanie", "Windsong", "Zeyada", "Charm", "Cedarville Cursive", 
                "La Belle Aurore", "Meddon", "Nothing You Could Do", "Shadows Into Light"
            ]
        },
        {
            category: "Decorativas & Display (Títulos)",
            fonts: [
                "Abril Fatface", "Alfa Slab One", "Righteous", "Changa One", "Anton", "Bangers", "Bungee", 
                "Concert One", "Creepster", "Permanent Marker", "Press Start 2P", "Luckiest Guy", "Monoton", 
                "Special Elite", "Staatliches", "Audiowide", "Black Ops One", "Bungee Shade", "Faster One", 
                "Metal Mania", "Modak", "Nosifer", "Orbitron", "Plaster", "Rationale", 
                "Ruslan Display", "Shrikhand", "Syncopate", "Wallpoet", "Zilla Slab Highlight", 
                "Vampiro One", "Shojumaru", "Ribeye", "Rye", "Sancreek"
            ]
        }
    ];

    let _allFontBatchesPreloaded = false;

    /**
     * Precarga todas las fuentes del catálogo en batches consolidados bajo demanda (al abrir el selector)
     */
    function preloadAllFontBatches() {
        if (_allFontBatchesPreloaded) return;
        _allFontBatchesPreloaded = true;
        addPreconnectLinks();
        const allFonts = [];
        FONT_CATALOG_200.forEach(cat => {
            cat.fonts.forEach(f => {
                if (!allFonts.includes(f)) {
                    allFonts.push(f);
                    loadedGoogleFonts.add(f);
                }
            });
        });

        const batchSize = 15;
        for (let i = 0; i < allFonts.length; i += batchSize) {
            const batch = allFonts.slice(i, i + batchSize);
            const batchId = `gfont-batch-${Math.floor(i / batchSize)}`;
            if (!document.getElementById(batchId)) {
                const link = document.createElement('link');
                link.id = batchId;
                link.rel = 'stylesheet';
                const params = batch.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;700`).join('&');
                link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
                document.head.appendChild(link);
            }
        }
    }

    /**
     * Poblador del elemento <select> con los 200+ ítems organizados
     */
    function populateFontSelect(selectEl) {
        if (!selectEl) return;
        const currentVal = selectEl.value || 'Plus Jakarta Sans';

        let html = '';
        FONT_CATALOG_200.forEach(group => {
            html += `<optgroup label="${group.category}">`;
            group.fonts.forEach(f => {
                html += `<option value="${f}" style="font-family: '${f}', sans-serif;">${f}</option>`;
            });
            html += `</optgroup>`;
        });

        selectEl.innerHTML = html;
        selectEl.value = currentVal;

        if (!selectEl.dataset.lazyFontBound) {
            selectEl.dataset.lazyFontBound = 'true';
            const triggerPreload = () => preloadAllFontBatches();
            selectEl.addEventListener('mousedown', triggerPreload, { once: true });
            selectEl.addEventListener('focus', triggerPreload, { once: true });
            selectEl.addEventListener('click', triggerPreload, { once: true });
        }
    }

    function initAllFontSelects() {
        addPreconnectLinks();
        const fontSelects = document.querySelectorAll('#tool-font-name, #font-family-select, #fmt-font-family, select[data-font-catalog="true"]');
        fontSelects.forEach(fs => {
            populateFontSelect(fs);
        });
    }

    // Exponer globalmente
    window.ensureGoogleFontLoaded = ensureGoogleFontLoaded;
    window.preloadAllFontBatches = preloadAllFontBatches;
    window.preloadAllFontBatchesOnce = preloadAllFontBatches;
    window.FONT_CATALOG_200 = FONT_CATALOG_200;
    window.populateFontSelect = populateFontSelect;
    window.initAllFontSelects = initAllFontSelects;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllFontSelects);
    } else {
        initAllFontSelects();
    }
})();

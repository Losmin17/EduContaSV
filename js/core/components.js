window.parseLocalFloat = function(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
};

window.fmt = function(num) {
    return (typeof num === 'number' ? num : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

window.fmtUI = window.fmt;

window.fmtNegUI = function(num) {
    return '$ (' + window.fmt(num) + ')';
};

window.showModal = function(title, message, onConfirm, isDanger = false) {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-msg');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const pwdContainer = document.getElementById('modal-password-container');
    const pwdInput = document.getElementById('modal-password-input');

    if (modal && modalTitle && modalMessage && confirmBtn) {
        modal.style.display = 'flex';
        modalTitle.innerText = title;
        modalMessage.innerHTML = message;
        confirmBtn.onclick = onConfirm;

        if (isDanger) {
            confirmBtn.classList.remove('bg-sky-500', 'hover:bg-sky-600');
            confirmBtn.classList.add('bg-rose-600', 'hover:bg-rose-700');
            if (pwdContainer) {
                pwdContainer.classList.remove('hidden');
                pwdContainer.classList.add('flex');
            }
        } else {
            confirmBtn.classList.remove('bg-rose-600', 'hover:bg-rose-700', 'bg-sky-500', 'hover:bg-sky-600');
            confirmBtn.classList.add('bg-rose-500', 'hover:bg-rose-600');
            if (pwdContainer) {
                pwdContainer.classList.add('hidden');
                pwdContainer.classList.remove('flex');
            }
        }
        if (pwdInput) pwdInput.value = '';
        modal.style.display = 'flex';
    }
};

window.showAlert = function(title, message) {
    window.showModal(title, message, window.closeModal, false);
};

window.closeModal = function() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
    }
};

window.openTermsModal = function() {
    const modal = document.getElementById('terms-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeTermsModal = function() {
    const modal = document.getElementById('terms-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
    }
};

// =========================================================================
// === MODAL DE ACTUALIZACIÓN DE POLÍTICAS Y AVISO DE DESARROLLO (v7.0) ===
// =========================================================================
window.openPolicyUpdateModal = function() {
    const modal = document.getElementById('policy-update-modal');
    if (!modal) return;
    if (typeof window.goToPolicyStep === 'function') {
        window.goToPolicyStep(1);
    }
    modal.style.display = 'flex';
};

window.closePolicyUpdateModal = function(markAsAccepted = true) {
    const modal = document.getElementById('policy-update-modal');
    if (markAsAccepted) {
        try {
            localStorage.setItem('educonta_policy_update_v7_accepted', 'true');
            localStorage.setItem('educonta_policy_update_v7_date', new Date().toISOString());
        } catch (e) {
            console.warn('No se pudo guardar la aceptación de políticas en localStorage:', e);
        }
    }
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 280);
    }
};

window.goToPolicyStep = function(step) {
    const step1 = document.getElementById('policy-step-1');
    const step2 = document.getElementById('policy-step-2');
    const dot1 = document.getElementById('policy-dot-1');
    const dot2 = document.getElementById('policy-dot-2');
    const indicatorText = document.getElementById('policy-indicator-text');
    const scrollContainer = document.getElementById('policy-scroll-container');

    if (scrollContainer) {
        scrollContainer.scrollTop = 0;
    }

    if (step === 1) {
        if (step1) step1.classList.remove('hidden');
        if (step2) step2.classList.add('hidden');
        if (dot1) {
            dot1.className = 'w-2 h-2 rounded-full bg-sky-500 transition-all duration-300';
        }
        if (dot2) {
            dot2.className = 'w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all duration-300';
        }
        if (indicatorText) {
            indicatorText.innerText = 'Paso 1 de 2';
            indicatorText.className = 'text-[9px] font-black text-sky-600 dark:text-sky-400 tracking-widest uppercase';
        }
    } else if (step === 2) {
        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');
        if (dot1) {
            dot1.className = 'w-2 h-2 rounded-full bg-emerald-500 transition-all duration-300';
        }
        if (dot2) {
            dot2.className = 'w-2 h-2 rounded-full bg-amber-500 transition-all duration-300';
        }
        if (indicatorText) {
            indicatorText.innerText = 'Paso 2 de 2';
            indicatorText.className = 'text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-widest uppercase';
        }
    }
};

window.togglePolicyNextBtn = function(isChecked) {
    const btn = document.getElementById('btn-policy-next');
    if (!btn) return;
    if (isChecked) {
        btn.disabled = false;
        btn.classList.remove('opacity-40', 'cursor-not-allowed');
        btn.classList.add('hover:bg-sky-600', 'hover:scale-[1.01]', 'active:scale-[0.99]');
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-40', 'cursor-not-allowed');
        btn.classList.remove('hover:bg-sky-600', 'hover:scale-[1.01]', 'active:scale-[0.99]');
    }
};

window.acceptAndOpenSupport = function() {
    window.closePolicyUpdateModal(true);
    setTimeout(() => {
        if (typeof window.openSupportModal === 'function') {
            window.openSupportModal();
        }
    }, 320);
};

window.checkPolicyUpdateAnnouncement = function() {
    const POLICY_KEY = 'educonta_policy_update_v7_accepted';
    try {
        if (localStorage.getItem(POLICY_KEY)) {
            return;
        }
    } catch (e) {
        console.warn('Error comprobando aceptación de políticas:', e);
    }

    const checkAndShow = () => {
        const modal = document.getElementById('policy-update-modal');
        if (!modal) return;
        if (window._educontaPreloaderDismissed || !document.getElementById('global-preloader')) {
            window.openPolicyUpdateModal();
        } else {
            setTimeout(checkAndShow, 200);
        }
    };

    setTimeout(checkAndShow, 700);
};

window.injectSharedUI = function(containerId) {
    const container = document.getElementById(containerId) || document.body;
    
    const uiHTML = `
<div class="main-header-wrapper no-print">
<header class="main-header glowinglass">
        <div class="logo-wrap glow flex items-center gap-1 cursor-pointer" onclick="window.location.href='index.html'" title="EduConta SV">
            <!-- Parte 1: Gráfica de Barras -->
            <svg class="icon-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="0" />
                    </filter>
                    <filter id="glowG" x="-400%" y="-100%" width="900%" height="300%" color-interpolation-filters="sRGB">
                        <feDropShadow class="fx" id="gs1" dx="0" dy="0" stdDeviation="1" style="flood-color:var(--gc)" result="a" />
                        <feDropShadow class="fx" id="gs2" in="a" dx="0" dy="0" stdDeviation="3" style="flood-color:var(--gc)" />
                    </filter>
                </defs>
                <rect class="bar bar-1" x="28.5" y="55" width="11" height="16" rx="1" fill="var(--b1)" />
                <rect class="bar bar-2" x="44.5" y="42" width="11" height="29" rx="1" fill="var(--b2)" />
                <g class="glow-g">
                    <rect class="bar bar-3" x="60.5" y="27" width="11" height="44" rx="1" fill="var(--celeste-sv)" />
                </g>
                <rect class="base-line" x="20" y="70" width="60" height="5" rx="1" fill="var(--base)" />
            </svg>

            <!-- Parte 2: Texto EduConta SV -->
            <svg class="text-svg" id="text-svg" viewBox="0 0 472 100" xmlns="http://www.w3.org/2000/svg">
                <g id="chars" font-family="'Plus Jakarta Sans', sans-serif" font-size="78">
                    <!-- Elementos con glow: SV (trazo y relleno) -->
                    <g class="glow-g">
                        <text x="365.05" y="75" font-weight="800" class="char-stroke d-s" style="color: var(--celeste-sv);">S</text>
                        <text x="414.02" y="75" font-weight="800" class="char-stroke d-v" style="color: var(--celeste-sv);">V</text>
                        <text x="365.05" y="75" font-weight="800" class="char-fill d-s-f" style="color: var(--celeste-sv);">S</text>
                        <text x="414.02" y="75" font-weight="800" class="char-fill d-v-f" style="color: var(--celeste-sv);">V</text>
                    </g>

                    <!-- Capa de Trazo (Stroke) -->
                    <text x="0" y="75" font-weight="800" class="char-stroke d-e" style="color: var(--azul-corporativo);">E</text>
                    <text x="44.44" y="75" font-weight="800" class="char-stroke d-d" style="color: var(--azul-corporativo);">d</text>
                    <text x="95.44" y="75" font-weight="800" class="char-stroke d-u" style="color: var(--azul-corporativo);">u</text>
                    <text x="140.66" y="75" font-weight="300" class="char-stroke d-c" style="color: var(--azul-corporativo);">C</text>
                    <text x="200.39" y="75" font-weight="300" class="char-stroke d-o" style="color: var(--azul-corporativo);">o</text>
                    <text x="250.29" y="75" font-weight="300" class="char-stroke d-n" style="color: var(--azul-corporativo);">n</text>
                    <text x="293.41" y="75" font-weight="300" class="char-stroke d-t" style="color: var(--azul-corporativo);">t</text>
                    <text x="321.86" y="75" font-weight="300" class="char-stroke d-a" style="color: var(--azul-corporativo);">a</text>

                    <!-- Capa de Relleno (Fill) -->
                    <text x="0" y="75" font-weight="800" class="char-fill d-e-f" style="color: var(--azul-corporativo);">E</text>
                    <text x="44.44" y="75" font-weight="800" class="char-fill d-d-f" style="color: var(--azul-corporativo);">d</text>
                    <text x="95.44" y="75" font-weight="800" class="char-fill d-u-f" style="color: var(--azul-corporativo);">u</text>
                    <text x="140.66" y="75" font-weight="300" class="char-fill d-c-f" style="color: var(--azul-corporativo);">C</text>
                    <text x="200.39" y="75" font-weight="300" class="char-fill d-o-f" style="color: var(--azul-corporativo);">o</text>
                    <text x="250.29" y="75" font-weight="300" class="char-fill d-n-f" style="color: var(--azul-corporativo);">n</text>
                    <text x="293.41" y="75" font-weight="300" class="char-fill d-t-f" style="color: var(--azul-corporativo);">t</text>
                    <text x="321.86" y="75" font-weight="300" class="char-fill d-a-f" style="color: var(--azul-corporativo);">a</text>
                </g>
            </svg>
        </div>

        <!-- ADMIN CONTROLS INJECTED INTO MAIN HEADER -->
        <div id="header-admin-controls" class="hidden flex-1 items-center justify-center gap-3 px-2 md:px-4">
            <span
                class="hidden lg:inline-block px-2 py-0.5 bg-sky-500/20 text-sky-400 font-bold text-[9px] uppercase tracking-widest rounded-[36px]">Admin</span>
            <h2 id="header-admin-title"
                class="hidden md:block text-base lg:text-lg font-black text-white tracking-tight leading-none whitespace-nowrap">
                Gestión <span class="text-sky-400">Maestra</span></h2>

            <div class="w-[1px] h-6 bg-slate-700 hidden md:block mx-1 lg:mx-2"></div>

            <button id="btn-master-back" onclick="renderMasterUserList()"
                class="hidden px-3 lg:px-4 py-2 bg-slate-800 text-white rounded-[36px] font-bold text-[10px] uppercase hover:bg-slate-700 transition-all shadow-md items-center justify-center gap-2 whitespace-nowrap">
                <i class="fas fa-arrow-left"></i> <span class="hidden xl:inline">Usuarios</span>
            </button>

            <form id="master-search-form" autocomplete="off" onsubmit="return false;" class="relative w-full max-w-sm m-0 p-0">
                <i class="fas fa-search absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none"></i>
                <input type="search" id="master-search" name="educonta_search_filter"
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                    data-lpignore="true" data-1p-ignore="true" role="searchbox"
                    class="w-full bg-slate-800 border-none rounded-[36px] pl-9 pr-8 py-2 text-xs md:text-sm text-white focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500 transition-all"
                    placeholder="Filtrar archivos o ID..." oninput="if(typeof handleMasterSearch==='function'){handleMasterSearch();}else if(typeof renderMasterUserList==='function'){renderMasterUserList();}">
                <button id="btn-clear-master-search" type="button" onclick="if(typeof clearMasterSearch==='function')clearMasterSearch();"
                    class="hidden absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs transition-colors"
                    title="Limpiar filtro">
                    <i class="fas fa-times-circle"></i>
                </button>
            </form>

            <button onclick="downloadMasterBackup()"
                class="px-3 lg:px-4 py-2 bg-sky-500 text-white rounded-[36px] font-bold text-[10px] uppercase hover:bg-sky-400 transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                title="Bóveda global de auditoría">
                <i class="fas fa-download"></i> <span class="hidden xl:inline">Backup</span>
            </button>
        </div>

        <div class="flex items-center gap-4">
            <!-- Auth Container -->
            <div id="auth-container" class="flex items-center gap-3">
                <button id="btn-exit-audit" onclick="exitAuditMode()"
                    class="hidden px-4 py-2 rounded-[36px] bg-rose-600 text-white font-bold text-[10px] uppercase hover:bg-rose-500 transition-colors shadow-lg tracking-widest">
                    <i class="fas fa-sign-out-alt mr-1 hidden md:inline"></i> Salir de Auditoría
                </button>
                <button onclick="openAuthModal()" id="btn-login-header"
                    class="px-4 py-2 rounded-[36px] bg-slate-800 text-white font-bold text-[10px] uppercase hover:bg-slate-700 transition-colors shadow-md hidden md:block tracking-widest">
                    Iniciar Sesión / Registro
                </button>
                <button onclick="openAuthModal()" id="btn-login-header-mobile"
                    class="p-2 rounded-[36px] bg-slate-800 text-white hover:bg-slate-700 transition-colors md:hidden shadow-md">
                    <i class="fas fa-user-circle text-lg"></i>
                </button>
                <div id="user-info-header"
                    class="hidden items-center gap-3 cursor-pointer p-1.5 pr-4 rounded-[36px] bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    onclick="openProfileModal()" style="display: none;" title="Mi Perfil">
                    <div
                        class="w-8 h-8 rounded-[36px] bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm">
                        <i class="fas fa-user"></i>
                    </div>
                    <span id="user-email-display" class="text-xs font-bold text-slate-600 hidden md:block"></span>
                </div>
            </div>

            <div class="flex gap-4">
                <button id="btn-volver" onclick="window.location.href='index.html'"
                    class="hidden text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                    <i class="fas fa-chevron-left mr-0 sm:mr-2"></i> <span class="hidden sm:inline">Inicio</span>
                </button>
            </div>

            <!-- Theme Toggle -->
            <button id="theme-toggle-btn" title="Cambiar tema"
                onclick="if(typeof window.toggleTheme==='function') window.toggleTheme()">
                <i id="theme-icon" class="fas fa-moon"></i>
            </button>
        </div>
    </header>
</div>
<div id="custom-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="educonta-modal-content max-w-sm w-full">
            <h4 id="modal-title" class="text-xl font-bold text-slate-900 mb-2">Confirmación</h4>
            <p id="modal-msg" class="text-slate-500 text-sm mb-6"></p>
            <form id="modal-password-form" autocomplete="off" onsubmit="return false;" class="w-full m-0 p-0">
                <div id="modal-password-container" class="hidden mb-6">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contraseña de
                        Administrador</label>
                    <input type="password" id="modal-password-input" autocomplete="new-password"
                        class="w-full bg-slate-50 border border-slate-200 rounded-[36px] px-4 py-3 text-sm text-slate-700 font-bold focus:border-sky-400 focus:bg-white outline-none transition-all"
                        placeholder="••••••••">
                </div>
            </form>
            <div class="flex gap-3">
                <button id="modal-cancel-btn" onclick="closeModal()"
                    class="flex-1 px-4 py-3 rounded-[36px] bg-slate-100 text-slate-600 font-bold text-xs uppercase hover:bg-slate-200">Cancelar</button>
                <button id="modal-confirm-btn"
                    class="flex-1 px-4 py-3 rounded-[36px] bg-rose-500 text-white font-bold text-xs uppercase shadow-lg hover:bg-rose-600">Confirmar</button>
            </div>
        </div>
    </div>
</div>

<div id="auth-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">

        <div class="educonta-modal-content w-full max-w-[420px] p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto terms-scrollable">
            <!-- Icono Neomórfico superior -->
            <div class="mx-auto w-16 h-16 rounded-[28px] bg-white dark:bg-slate-850 mb-6 flex items-center justify-center border border-slate-100 dark:border-slate-800"
                style="box-shadow: -6px -6px 14px rgba(255,255,255,0.9), 6px 6px 14px rgba(15, 23, 42, 0.06);">
                <i class="fas fa-fingerprint text-2xl text-slate-700 dark:text-sky-400"></i>
            </div>

            <button onclick="closeAuthModal()"
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-transform hover:rotate-90"><i
                    class="fas fa-times"></i></button>
            <h4 id="auth-modal-title" class="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-6 text-center">Bienvenido</h4>

            <div id="auth-error-msg"
                class="hidden mb-4 p-3.5 bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/60 rounded-[20px] text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed break-words shadow-[inset_2px_2px_5px_rgba(225,29,72,0.06)]">
            </div>
            <div id="auth-success-msg"
                class="hidden mb-4 p-3.5 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 rounded-[20px] text-emerald-600 dark:text-emerald-400 text-xs font-bold leading-relaxed break-words shadow-[inset_2px_2px_5px_rgba(16,185,129,0.06)]">
            </div>

            <!-- Botón de Inicio de Sesión Biométrico Rápido (Touch ID / Face ID / Windows Hello) -->
            <div id="biometric-login-container" class="hidden mb-5">
                <button type="button" id="btn-biometric-login" onclick="handleBiometricLogin()"
                    class="w-full group p-3.5 rounded-[28px] bg-slate-900 dark:bg-slate-800/90 border border-sky-500/40 hover:border-sky-400 text-white shadow-lg hover:shadow-sky-500/20 transition-all flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                            <i class="fas fa-fingerprint text-xl"></i>
                        </div>
                        <div class="text-left">
                            <div class="text-[11px] font-black uppercase tracking-wider text-white">Ingreso con Huella / Face ID</div>
                            <div id="biometric-user-hint" class="text-[10px] text-sky-300 font-medium truncate max-w-[190px]">Dispositivo verificado</div>
                        </div>
                    </div>
                    <i class="fas fa-arrow-right text-xs text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all mr-2"></i>
                </button>
                <div class="flex items-center my-4">
                    <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span class="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">o con tu contraseña</span>
                    <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>
            </div>

            <form id="form-auth" class="space-y-5">
                <div id="auth-name-container" class="hidden">
                    <label
                        class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 px-2">Nombre
                        Completo</label>
                    <input type="text" id="auth-name"
                        class="w-full bg-slate-50 border border-slate-200 rounded-[36px] px-5 py-3.5 text-sm text-slate-700 font-bold focus:border-sky-400 focus:bg-white outline-none transition-all"
                        placeholder="Tu nombre">
                </div>
                <div>
                    <label
                        class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 px-2">Correo
                        Electrónico</label>
                    <input type="email" id="auth-email"
                        class="w-full bg-slate-50 border border-slate-200 rounded-[36px] px-5 py-3.5 text-sm text-slate-700 font-bold focus:border-sky-400 focus:bg-white outline-none transition-all"
                        placeholder="tucorreo@ejemplo.com">
                </div>
                <div>
                    <label
                        class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 px-2">Contraseña</label>
                    <div class="relative">
                        <input type="password" id="auth-password"
                            class="w-full bg-slate-50 border border-slate-200 rounded-[36px] px-5 py-3.5 text-sm text-slate-700 font-bold focus:border-sky-400 focus:bg-white outline-none transition-all pr-12"
                            placeholder="••••••••">
                        <button type="button"
                            onclick="event.preventDefault(); event.stopPropagation(); togglePasswordVisibility('auth-password', 'auth-password-icon')"
                            class="absolute right-5 top-3.5 text-slate-400 hover:text-sky-500 transition-colors focus:outline-none">
                            <i id="auth-password-icon" class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div id="auth-forgot-pwd-container" class="mt-2 text-right px-2">
                    <button type="button" onclick="handleRecoverPassword()"
                        class="text-[11px] font-bold text-sky-500 hover:text-sky-600 focus:outline-none transition-colors">¿Olvidaste
                        tu contraseña?</button>
                </div>

                <div id="auth-terms-container" class="hidden mt-4 px-2">
                    <label class="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" id="auth-terms-checkbox"
                            class="mt-1 w-4 h-4 rounded text-sky-500 border-slate-300 focus:ring-sky-500 focus:ring-offset-0 focus:outline-none cursor-pointer">
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium select-none leading-snug">
                            He leído y acepto los <a href="#" onclick="event.preventDefault(); window.openTermsModal();" class="text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 font-bold underline transition-colors">Términos y Condiciones de Uso</a> de EduConta SV.
                        </span>
                    </label>
                </div>

                <div class="mt-8 flex flex-col gap-4">
                    <button type="submit" id="btn-auth-submit"
                        class="glow-hover btn-bloom-sky w-full px-6 py-4 rounded-[36px] bg-sky-500 text-white font-black text-[13px] uppercase tracking-wide transition-all shadow-lg hover:bg-sky-600">
                        Iniciar Sesión
                    </button>
                    <button type="button" onclick="toggleAuthMode()" id="btn-auth-toggle"
                        class="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 focus:outline-none">
                        ¿No tienes cuenta? <span class="text-sky-500">Regístrate</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
<div id="profile-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true">

        <div class="educonta-modal-content w-full max-w-md p-6 sm:p-7 relative max-h-[88vh] overflow-y-auto terms-scrollable">

            <button onclick="closeProfileModal()"
                class="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center focus:outline-none transition-all hover:rotate-90"
                title="Cerrar modal">
                <i class="fas fa-times text-xs"></i>
            </button>

            <!-- Cabecera de Identidad del Usuario -->
            <div class="text-center mb-5 pt-1">
                <div id="profile-avatar-container"
                    class="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500/20 via-sky-400/10 to-indigo-500/10 border-2 border-sky-400/30 flex items-center justify-center text-sky-400 shadow-md mb-2.5 transition-transform hover:scale-105 duration-300">
                    <svg class="w-8 h-8 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <h4 id="profile-modal-title" class="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight">Mi Perfil</h4>
                <p id="profile-email-display" class="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-full mt-1 px-4"></p>
                
                <div id="profile-role-badge-container" class="mt-2 flex items-center justify-center">
                    <span id="profile-role-badge" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        <i class="fas fa-check-circle text-[10px]"></i> Cuenta Activa
                    </span>
                </div>
            </div>

            <!-- Alertas dinámicas -->
            <div id="profile-error-msg"
                class="hidden mb-4 p-3 bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/60 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed break-words shadow-[inset_2px_2px_5px_rgba(225,29,72,0.06)]">
            </div>
            <div id="profile-success-msg"
                class="hidden mb-4 p-3 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold leading-relaxed break-words shadow-[inset_2px_2px_5px_rgba(16,185,129,0.06)]">
            </div>

            <div class="space-y-3.5">
                <!-- Tarjeta 1: Información Personal (Nombre e ID de cuenta) -->
                <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-left">
                    <form id="form-profile" class="space-y-3">
                        <div>
                            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
                                Nombre Completo
                            </label>
                            <div class="flex gap-2">
                                <input type="text" id="profile-name"
                                    class="flex-1 min-w-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-1 focus:ring-sky-500/20 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Tu nombre completo">
                                <button type="submit" id="btn-profile-submit"
                                    class="glow-hover btn-bloom-sky px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-sm flex items-center justify-center shrink-0 gap-1.5">
                                    <i class="fas fa-save text-xs"></i> <span>Guardar</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
                                ID Único de Usuario
                            </label>
                            <div class="relative flex items-center">
                                <input type="text" id="profile-uid" readonly
                                    class="w-full bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl pl-3 pr-9 py-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono outline-none cursor-default select-all"
                                    placeholder="Cargando ID...">
                                <button type="button" onclick="copyUIDToClipboard()"
                                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 active:scale-90 transition-all p-0.5 flex items-center justify-center focus:outline-none"
                                    title="Copiar ID">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Tarjeta 2: Acceso Biométrico -->
                <div id="profile-biometric-container" class="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-left">
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                                <i class="fas fa-fingerprint text-sm"></i>
                            </div>
                            <div class="min-w-0">
                                <h5 class="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider leading-none">Acceso Biométrico</h5>
                                <p id="profile-biometric-status" class="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-1">Detectando sensor...</p>
                            </div>
                        </div>
                        <span id="profile-biometric-badge" class="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Comprobando
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        Inicia sesión al instante con Windows Hello, Touch ID o Face ID con tus datos biométricos protegidos en este equipo.
                    </p>
                    <div id="profile-biometric-actions">
                        <button type="button" id="btn-enable-biometrics" onclick="enrollBiometricCredential()"
                            class="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2">
                            <i class="fas fa-fingerprint text-xs"></i> <span>Activar en este Equipo</span>
                        </button>
                        <button type="button" id="btn-disable-biometrics" onclick="removeBiometricCredential()"
                            class="hidden w-full py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider transition-all border border-rose-500/20 flex items-center justify-center gap-2">
                            <i class="fas fa-trash-alt text-xs"></i> <span>Desvincular de este Equipo</span>
                        </button>
                    </div>
                </div>

                <!-- Tarjeta 3: Panel de Administrador (Solo Admin - Se muestra dinámicamente) -->
                <div id="profile-admin-container" class="hidden"></div>
            </div>

            <!-- Footer: Términos de Uso y Cerrar Sesión -->
            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <a href="#" onclick="event.preventDefault(); closeProfileModal(); openTermsModal();" 
                    class="text-[11px] font-bold text-slate-400 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 focus:outline-none">
                    <i class="fas fa-file-contract text-xs"></i> <span>Términos de Uso</span>
                </a>
                <button type="button" onclick="logout()"
                    class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-bold text-xs uppercase tracking-wider transition-all border border-rose-500/20 flex items-center gap-1.5">
                    <i class="fas fa-sign-out-alt text-xs"></i> <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    </div>
    <div id="sync-toast" class="no-print">
        <i class="fas fa-check-circle text-2xl"></i>
        <div>
            <h4 class="font-black text-sm text-white">Sincronización Exitosa</h4>
            <p class="text-[11px] font-semibold text-slate-300 uppercase tracking-widest mt-0.5">Proyectos respaldados</p>
        </div>
    </div>

    <!-- Modal de Sugerencia Rápida para Biometría -->
    <div id="biometric-prompt-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true">
        <div class="educonta-modal-content w-full max-w-[380px] p-6 text-center relative">
            <button onclick="closeBiometricPrompt(false)"
                class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-transform hover:rotate-90">
                <i class="fas fa-times"></i>
            </button>
            <div class="mx-auto w-16 h-16 rounded-[28px] bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 mb-4 flex items-center justify-center text-sky-500 shadow-md">
                <i class="fas fa-fingerprint text-3xl"></i>
            </div>
            <h4 class="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-2">¿Activar Acceso Rápido?</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Detectamos un sensor biométrico en este equipo. Puedes iniciar sesión con Windows Hello, Touch ID o Face ID en un solo toque sin escribir contraseñas.
            </p>
            <div class="flex flex-col gap-2.5">
                <button type="button" onclick="confirmBiometricEnrollmentFromPrompt()"
                    class="w-full py-3 px-4 rounded-[28px] bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-sky-500/25 flex items-center justify-center gap-2">
                    <i class="fas fa-check-circle"></i> <span>Activar en este Equipo</span>
                </button>
                <button type="button" onclick="closeBiometricPrompt(true)"
                    class="w-full py-2.5 px-4 rounded-[28px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider transition-all">
                    Recordármelo Más Tarde
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Glassmorphic para Confirmar Contraseña al Vincular Biometría -->
    <div id="biometric-password-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true">
        <div class="educonta-modal-content w-full max-w-[400px] p-6 text-center relative max-h-[85vh] overflow-y-auto terms-scrollable">
            <button onclick="closeBiometricPasswordModal(null)"
                class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-transform hover:rotate-90">
                <i class="fas fa-times"></i>
            </button>
            <div class="mx-auto w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 mb-3 flex items-center justify-center text-sky-500 shadow-md">
                <i class="fas fa-fingerprint text-2xl"></i>
            </div>
            <h4 class="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Vincular Acceso Biométrico</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Para que tu huella o Face ID funcione siempre en este equipo (incluso tras cerrar sesión), confirma tu contraseña:
            </p>

            <div id="biometric-pwd-error-msg"
                class="hidden mb-4 p-3 bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/60 rounded-[20px] text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed break-words shadow-[inset_2px_2px_5px_rgba(225,29,72,0.06)]">
            </div>

            <form id="form-biometric-password" onsubmit="event.preventDefault(); submitBiometricPasswordModal();" class="space-y-4">
                <div class="relative text-left">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tu Contraseña</label>
                    <input type="password" id="biometric-confirm-pwd" required
                        class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] pl-4 pr-11 py-2.5 text-sm text-slate-700 dark:text-white font-bold focus:border-sky-400 focus:bg-white dark:focus:bg-slate-850 outline-none transition-all"
                        placeholder="Contraseña de EduConta SV">
                    <button type="button" onclick="togglePasswordVisibility('biometric-confirm-pwd', 'bio-pwd-eye')"
                        class="absolute right-4 top-[30px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none">
                        <i id="bio-pwd-eye" class="fas fa-eye text-sm"></i>
                    </button>
                </div>

                <div class="flex flex-col gap-2.5 pt-2">
                    <button type="submit" id="btn-biometric-pwd-submit"
                        class="glow-hover btn-bloom-sky w-full py-3 px-4 rounded-[28px] bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-sky-500/25 flex items-center justify-center gap-2">
                        <i class="fas fa-check-circle text-sm"></i> <span>Confirmar y Activar</span>
                    </button>
                    <button type="button" onclick="closeBiometricPasswordModal(null)"
                        class="w-full py-2.5 px-4 rounded-[28px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider transition-all">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    </div>

<div id="terms-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true">
    <div class="educonta-modal-content w-full max-w-[650px] flex flex-col max-h-[75vh] relative">
        <button onclick="closeTermsModal()"
            class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:text-slate-455 dark:hover:text-slate-200 focus:outline-none transition-transform hover:rotate-90">
            <i class="fas fa-times text-lg"></i>
        </button>
        
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
            <div class="w-10 h-10 rounded-[14px] bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center text-sky-500">
                <i class="fas fa-file-contract text-lg"></i>
            </div>
            <div>
                <h4 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">Términos y Condiciones</h4>
                <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Última actualización: Julio 2026</p>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 space-y-6 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed terms-scrollable" style="scrollbar-gutter: stable; min-height: 0; overflow-y: auto;">
            <p>Bienvenido a EduContaSV. Al acceder, registrarse o utilizar nuestra plataforma web, módulos contables, editores y herramientas complementarias, usted acepta cumplir y estar sujeto a los siguientes Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, deberá abstenerse de utilizar el sistema.</p>
            
            <div>
                <h5 class="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base mb-2">1. Naturaleza del Servicio, Licencia de Uso e Integridad Académica</h5>
                <ul class="list-disc pl-5 space-y-2">
                    <li><strong>Propósito de la Plataforma:</strong> EduContaSV es un entorno multisectorial diseñado para la gestión de libros de contabilidad, formulación de estados financieros, análisis de KPIs, edición de papeles de trabajo y consulta de base de conocimientos regulatorios en El Salvador.</li>
                    <li><strong>Otorgamiento de Licencia:</strong> Se otorga al usuario una licencia limitada, no exclusiva, intransferible y revocable para utilizar la plataforma con fines educativos, profesionales o empresariales, según el tipo de cuenta adquirida.</li>
                    <li><strong>Restricciones de Ingeniería Inversa:</strong> Queda estrictamente prohibido modificar, copiar, redistribuir, realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la aplicación. Cualquier alteración o intento de alteración del código cliente para saltarse restricciones técnicas o de seguridad constituirá una violación grave de estos términos.</li>
                    <li><strong>Política de Integridad Académica:</strong> Al tener un enfoque didáctico y profesional, queda prohibido utilizar el Centro de Documentos o los editores de la plataforma para almacenar, comercializar o distribuir de forma ilícita respuestas de exámenes, guías universitarias resueltas o cometer plagio académico.</li>
                </ul>
            </div>

            <div>
                <h5 class="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base mb-2">2. Propiedad Intelectual y Derechos Reservados</h5>
                <div class="space-y-4">
                    <div>
                        <h6 class="font-semibold text-slate-700 dark:text-slate-200 text-xs md:text-sm mb-1">Sección A — Propiedad Intelectual de la Plataforma (Derechos del Desarrollador)</h6>
                        <ul class="list-disc pl-5 space-y-1.5">
                            <li><strong>Titularidad del Software:</strong> Toda la arquitectura tecnológica, diseño de interfaz (incluyendo el Modo Oscuro y micro-animaciones CSS), logotipos, marcas, gráficos y editores especializados son propiedad exclusiva de su desarrollador.</li>
                            <li><strong>Protección del Catálogo Maestro:</strong> La estructura, codificación, jerarquía y ordenamiento del "Catálogo Maestro de Cuentas" (educonta_catalogo_maestro_v4), adaptado a las normativas de la SSF, NIC 41, SAFI y NIIF Generales, representa propiedad intelectual protegida y no puede ser extraída para su uso comercial en plataformas de terceros ni para fines comerciales ajenos a la app.</li>
                            <li><strong>Formatos y Metodologías Contables:</strong> Las metodologías de visualización del ciclo contable (Cuentas T, Balanza de Comprobación y reclasificación automática de saldos), el formato de respaldo propietario .edc y los lienzos visuales están protegidos por las leyes de propiedad intelectual de El Salvador.</li>
                        </ul>
                    </div>
                    <div>
                        <h6 class="font-semibold text-slate-700 dark:text-slate-200 text-xs md:text-sm mb-1">Sección B — Propiedad Intelectual del Usuario, Contenido Subido y "Puerto Seguro"</h6>
                        <ul class="list-disc pl-5 space-y-1.5">
                            <li><strong>Titularidad del Contenido del Usuario:</strong> El usuario conserva la propiedad exclusiva de todos los derechos de autor (copyright), propiedad intelectual y derechos morales sobre cualquier texto, dato, imagen, gráfico o documento que cree, edite, procese o importe desde otros formatos externos dentro del procesador de textos e instrumentos híbridos del Centro de Documentos. EduContaSV no reclama ningún derecho de propiedad, licencia de comercialización ni autoría sobre el contenido generado o subido por el usuario.</li>
                            <li><strong>Responsabilidad por Contenido de Terceros:</strong> El usuario garantiza que es el autor legítimo o que posee todas las licencias, derechos, permisos y consentimientos necesarios para utilizar, reproducir e importar los textos, plantillas e imágenes que incorpore a la plataforma. Queda estrictamente prohibido subir material que infrinja derechos de autor de terceros, marcas registradas o patentes reguladas bajo la Ley de Fomento y Protección de la Propiedad Intelectual de El Salvador o normativas internacionales de copyright.</li>
                            <li><strong>Procedimiento de Retiro de Contenido (Notice and Takedown):</strong> Como "Puerto Seguro", si un tercero legítimo detecta que un usuario de la plataforma está alojando material protegido sin autorización en la sección de documentos, podrá notificarlo formalmente al correo de soporte del administrador. El administrador procederá a evaluar el caso y, de ser necesario, retirará o bloqueará el acceso a dicho contenido para cesar la infracción.</li>
                            <li><strong>Exclusión de Responsabilidad por Infracción:</strong> EduConta SV actúa únicamente como una herramienta tecnológica de procesamiento y edición automatizada, facilitando el almacenamiento según el método elegido (local en el dispositivo a través de localStorage, persistencia en la nube mediante Supabase o exportación en archivos .edc y PDF). En consecuencia, el desarrollador de la plataforma no se hace responsable, de manera directa o indirecta, por demandas, sanciones penales, civiles o administrativas derivadas de la violación de derechos de autor cometidas de forma privada por los usuarios al subir o difundir imágenes o documentos protegidos sin la debida autorización.</li>
                            <li><strong>Acceso y Custodia:</strong> Al ser el usuario el único dueño legal de sus archivos procesados, EduConta SV no realiza auditorías de contenido sobre los textos o imágenes alojados de forma privada en sus proyectos, salvo por requerimiento técnico de soporte explícitamente solicitado por el usuario o por orden de una autoridad judicial competente en El Salvador.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div>
                <h5 class="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base mb-2">3. Gestión de Datos, Seguridad y Obligación de Respaldo (Backup)</h5>
                <ul class="list-disc pl-5 space-y-2">
                    <li><strong>Almacenamiento Local (localStorage):</strong> El usuario reconoce que cierta información y catálogos pesados se almacenan temporalmente en la memoria caché de su navegador (localStorage) para optimizar el rendimiento. Es responsabilidad del usuario no borrar el historial o caché de forma imprevista si desea conservar datos locales no guardados o sincronizados.</li>
                    <li><strong>Archivos Portables .edc:</strong> Los archivos con extensión .edc generados por el sistema son copias de seguridad portables de uso exclusivo dentro de EduContaSV. El usuario es el único responsable de la custodia, pérdida, filtración o daño de los archivos .edc o reportes PDF que descargue y almacene en sus dispositivos locales.</li>
                    <li><strong>Infraestructura y Persistencia en la Nube:</strong> Para las funciones que requieran persistencia en la nube y autenticación, los datos se gestionan a través de la infraestructura de Supabase. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
                    <li><strong>Cláusula de Obligación de Respaldo:</strong> EduConta SV no se responsabiliza por la pérdida de información contable o de texto provocada por fallos del navegador del usuario, limpieza de caché, daños en el hardware o problemas técnicos locales. El usuario tiene la obligación estricta de realizar respaldos periódicos exportando sus proyectos en formato .edc o PDF.</li>
                </ul>
            </div>

            <div>
                <h5 class="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base mb-2">4. Limitación de Responsabilidad Legal y Transparencia Digital</h5>
                <ul class="list-disc pl-5 space-y-2">
                    <li><strong>Automatización de Planillas y Deducciones:</strong> El módulo "Planillas de Sueldos" automatiza el cálculo de retenciones de ley salvadoreña (ISSS, AFP, ISR), horas extras, vacaciones y aguinaldos basándose en los parámetros configurados. No obstante, debido a posibles reformas legislativas o interpretaciones jurídicas, los resultados se proporcionan únicamente como una herramienta de soporte profesional; es obligación estricta del usuario (contador, auditor o administrador) verificar los datos antes de realizar declaraciones o pagos oficiales.</li>
                    <li><strong>Biblioteca Legal:</strong> Los documentos y normativas integrados en el módulo "Biblioteca Legal" (leyes de bancos, seguros, aduanas, NIC/NIIF) se ofrecen exclusivamente como material de consulta informativa. EduContaSV no se hace responsable por sanciones, multas o pérdidas financieras derivadas de interpretaciones erróneas de las leyes aquí alojadas o de descuadres contables en las balanzas o balances del usuario.</li>
                    <li><strong>Transparencia en Fase de Desarrollo (Ley de Comercio Electrónico):</strong> En cumplimiento con las directrices de transparencia de la Ley de Comercio Electrónico de El Salvador, se informa que EduContaSV es un servicio digital independiente en fase de desarrollo y optimización técnica antes de su registro de marca formal o constitución comercial. La plataforma ofrece un canal directo de contacto mediante sus opciones de soporte para resolver dudas o incidencias de los usuarios.</li>
                </ul>
            </div>

            <div>
                <h5 class="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base mb-2">5. Modificaciones, Suspensión del Servicio y Ciclo de Vida de la Cuenta</h5>
                <ul class="list-disc pl-5 space-y-2">
                    <li><strong>Actualizaciones del Sistema:</strong> Nos reservamos el derecho de modificar, actualizar, suspender o discontinuar cualquier módulo, característica, diseño o el catálogo de cuentas de la plataforma en cualquier momento y sin previo aviso, con el fin de optimizar el rendimiento o cumplir con nuevas normativas del Ministerio de Hacienda o la SSF en El Salvador.</li>
                    <li><strong>Modificación de Términos:</strong> El uso continuado de la plataforma tras la publicación de cambios en estos Términos y Condiciones constituirá la aceptación implícita de los mismos.</li>
                    <li><strong>Suspensión de Acceso:</strong> El administrador se reserva el derecho de suspender o cerrar cuentas de usuarios que violen las restricciones de código, cometan plagio masivo o utilicen el procesador de documentos para fines ilícitos o contrarios a estos términos.</li>
                    <li><strong>Periodo de Gracia para Salvaguarda:</strong> En caso de inactividad prolongada del sistema, cierre voluntario de la cuenta o suspensión (salvo infracciones legales graves), se otorgará al usuario un periodo de gracia de hasta 30 días calendario. Durante este plazo, el usuario podrá acceder exclusivamente para descargar sus proyectos contables en formato .edc o exportar sus escritos y balances en formato PDF antes de que la información sea eliminada definitivamente de los servidores de Supabase.</li>
                </ul>
            </div>

            <div>
                <h5 class="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base mb-2">6. Legislación Aplicable y Jurisdicción</h5>
                <p>Estos Términos y Condiciones se rigen e interpretan de conformidad con las leyes de la República de El Salvador, en especial la Ley de Fomento y Protección de la Propiedad Intelectual, el Código de Comercio y la Ley de Comercio Electrónico.</p>
            </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end shrink-0">
            <button onclick="closeTermsModal()"
                class="px-6 py-3 rounded-[36px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Entendido
            </button>
        </div>
    </div>
</div>

<!-- Modal de Anuncio de Nuevas Políticas y Aviso de Desarrollo (v7.0) -->
<div id="policy-update-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true">
    <div class="educonta-modal-content w-full max-w-[540px] flex flex-col max-h-[85vh] relative p-6 sm:p-7">
        
        <!-- Header con barra de progreso -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 select-none">
            <div class="flex items-center gap-1.5">
                <span id="policy-dot-1" class="w-2 h-2 rounded-full bg-sky-500 transition-all duration-300"></span>
                <span id="policy-dot-2" class="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all duration-300"></span>
            </div>
            <span id="policy-indicator-text" class="text-[9px] font-black text-sky-600 dark:text-sky-400 tracking-widest uppercase">Paso 1 de 2</span>
        </div>

        <!-- Contenedor scrollable -->
        <div id="policy-scroll-container" class="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4 pr-1" style="scrollbar-gutter: stable;">
            
            <!-- PASO 1: TÉRMINOS Y CONDICIONES ACTUALIZADOS -->
            <div id="policy-step-1" class="space-y-4">
                <div class="flex items-start gap-3.5">
                    <div class="w-11 h-11 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20 shadow-inner">
                        <i class="fas fa-file-shield text-lg"></i>
                    </div>
                    <div>
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 mb-1">Actualización de Políticas • Versión 2026</span>
                        <h4 class="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight">Nuevos Términos y Condiciones</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Hemos actualizado nuestras directrices de uso, propiedad intelectual y almacenamiento seguro.
                        </p>
                    </div>
                </div>

                <!-- Resumen de puntos clave -->
                <div class="space-y-2.5 text-xs">
                    <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 flex items-start gap-3">
                        <div class="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                            <i class="fas fa-user-shield text-xs"></i>
                        </div>
                        <div>
                            <strong class="text-slate-800 dark:text-slate-100 font-extrabold block text-xs">Propiedad Intelectual y Puerto Seguro</strong>
                            <span class="text-slate-600 dark:text-slate-400 leading-snug">Conservas la autoría completa de los textos, plantillas e imágenes que crees o importes. No se permite el uso indebido de material con derechos de autor ni plagio.</span>
                        </div>
                    </div>

                    <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 flex items-start gap-3">
                        <div class="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                            <i class="fas fa-database text-xs"></i>
                        </div>
                        <div>
                            <strong class="text-slate-800 dark:text-slate-100 font-extrabold block text-xs">Almacenamiento Local y Respaldo Obligatorio</strong>
                            <span class="text-slate-600 dark:text-slate-400 leading-snug">Tus datos residen en la memoria local (localStorage) y se sincronizan en la nube (Supabase). Es responsabilidad del usuario respaldar exportando archivos portables <code class="text-[11px] font-bold text-sky-500">.edc</code> o PDF.</span>
                        </div>
                    </div>

                    <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 flex items-start gap-3">
                        <div class="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                            <i class="fas fa-scale-balanced text-xs"></i>
                        </div>
                        <div>
                            <strong class="text-slate-800 dark:text-slate-100 font-extrabold block text-xs">Legislación Salvadoreña y Transparencia</strong>
                            <span class="text-slate-600 dark:text-slate-400 leading-snug">Las fórmulas de planillas (ISSS con tope $1,000, AFP 7.25%/8.75%, ISR) operan con base en las leyes de El Salvador y directrices de la Ley de Comercio Electrónico.</span>
                        </div>
                    </div>
                </div>

                <!-- Enlace a leer todo -->
                <div class="p-3 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-3">
                    <span class="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        ¿Deseas examinar el texto legal íntegro?
                    </span>
                    <button type="button" onclick="window.openTermsModal()" class="px-3 py-1.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 font-bold text-[11px] transition-colors shrink-0 flex items-center gap-1.5">
                        <span>Ver Documento</span>
                        <i class="fas fa-external-link-alt text-[9px]"></i>
                    </button>
                </div>

                <!-- Checkbox de aceptación -->
                <label class="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer select-none transition-all hover:border-sky-500/50">
                    <input type="checkbox" id="chk-policy-accept" onchange="window.togglePolicyNextBtn(this.checked)" class="mt-0.5 w-4 h-4 rounded text-sky-500 focus:ring-sky-500/30 cursor-pointer">
                    <span class="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
                        He leído, comprendo y acepto los nuevos <strong>Términos y Condiciones de Uso</strong> de EduConta SV.
                    </span>
                </label>

                <!-- Botón Continuar -->
                <button type="button" id="btn-policy-next" disabled onclick="window.goToPolicyStep(2)" class="w-full py-3.5 rounded-2xl bg-sky-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all opacity-40 cursor-not-allowed">
                    <span>Aceptar y Continuar</span>
                    <i class="fas fa-arrow-right text-xs"></i>
                </button>
            </div>

            <!-- PASO 2: AVISO DE DESARROLLO ACTIVO Y SOPORTE -->
            <div id="policy-step-2" class="space-y-4 hidden">
                <div class="flex items-start gap-3.5">
                    <div class="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner">
                        <i class="fas fa-laptop-code text-lg"></i>
                    </div>
                    <div>
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-1">Aviso Importante • Fase Activa</span>
                        <h4 class="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight">EduConta SV sigue en desarrollo</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Plataforma en constante evolución y optimización continua.
                        </p>
                    </div>
                </div>

                <!-- Mensaje de aviso y soporte -->
                <div class="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                    <p>
                        EduConta SV es un ecosistema tecnológico y contable que recibe mejoras continuas en sus editores, estados financieros, libros de diario, hojas de cálculo y catálogo de cuentas.
                    </p>
                    <p>
                        Debido a este ritmo de desarrollo activo, <strong>es posible que eventualmente se presenten errores visuales, descuadres o comportamientos imprevistos</strong>.
                    </p>
                    <p class="font-semibold text-slate-700 dark:text-slate-200">
                        Si experimentas alguna anomalía o tienes sugerencias de mejora, te invitamos a reportarlo de inmediato a través de nuestro canal de <strong>Soporte Técnico</strong>.
                    </p>
                </div>

                <!-- Mini tarjetas informativas -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 flex items-center gap-2.5">
                        <i class="fas fa-headset text-sky-500 text-base shrink-0"></i>
                        <div>
                            <strong class="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px]">Asistente Flotante</strong>
                            <span class="text-slate-500 dark:text-slate-400 text-[10px]">Ubicado en la esquina inferior derecha</span>
                        </div>
                    </div>
                    <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 flex items-center gap-2.5">
                        <i class="fas fa-camera text-emerald-500 text-base shrink-0"></i>
                        <div>
                            <strong class="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px]">Adjuntar Capturas</strong>
                            <span class="text-slate-500 dark:text-slate-400 text-[10px]">Envía imágenes del error fácilmente</span>
                        </div>
                    </div>
                </div>

                <!-- Acciones finales -->
                <div class="space-y-2 pt-1">
                    <button type="button" onclick="window.closePolicyUpdateModal(true)" class="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                        <span>¡Entendido, Comenzar a Usar EduConta!</span>
                        <i class="fas fa-check text-xs"></i>
                    </button>
                    
                    <div class="flex items-center justify-between px-1 pt-1">
                        <button type="button" onclick="window.goToPolicyStep(1)" class="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 focus:outline-none">
                            <i class="fas fa-arrow-left text-[9px]"></i>
                            <span>Revisar políticas</span>
                        </button>
                        <button type="button" onclick="window.acceptAndOpenSupport()" class="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline transition-colors flex items-center gap-1.5 focus:outline-none">
                            <i class="fas fa-headset text-xs"></i>
                            <span>Reportar un problema ahora</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>

    </div>
</div>

<!-- Botón Flotante Soporte -->
<button id="floating-support-btn" onclick="openSupportModal()" onmouseenter="window.startFloatingAnim()" onmouseleave="window.stopFloatingAnim()" class="fixed bottom-6 right-6 z-[9000] w-14 h-14 bg-transparent text-sky-500 dark:text-sky-400 border-none outline-none focus:outline-none transition-all flex items-center justify-center no-print group select-none">
    <div class="w-12 h-12 flex items-center justify-center relative">
        <svg class="support-avatar-svg w-11 h-11 pointer-events-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" id="floating-support-svg">
            <circle class="pulse-wave-1" cx="50" cy="50" r="32" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5"/>
            <circle class="pulse-wave-2" cx="50" cy="50" r="42" stroke="currentColor" stroke-width="1" opacity="0.3"/>
            <path class="headset-arc" d="M32 52C32 36 40 30 50 30C60 30 68 36 68 52" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
            <rect class="earpad-left" x="25" y="47" width="10" height="18" rx="4" fill="currentColor"/>
            <rect class="earpad-right" x="65" y="47" width="10" height="18" rx="4" fill="currentColor"/>
            <path class="headset-mic" d="M33 60C36 66 42 66 45 62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle class="headset-mic-tip" cx="46" cy="61" r="3.5" fill="#0ea5e9"/>
        </svg>
    </div>
    <span class="absolute right-full mr-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Soporte Técnico</span>
</button>

<!-- Modal de Soporte -->
<div id="support-modal" class="educonta-modal-overlay" role="dialog" aria-modal="true">
    <style>
        /* ANIMACIONES Y DESPLAZAMIENTOS DEL BOTÓN SOPORTE FLOTANTE */
        #floating-support-btn {
            z-index: 999999 !important;
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.3s ease !important;
        }
        
        #floating-support-btn:hover {
            transform: scale(1.15) !important;
        }

        /* Sync Toast Premium Glassmorphism con Noise, Glow y Blur Reveal de derecha a izquierda */
        #sync-toast {
            position: fixed;
            bottom: 24px;
            right: 84px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 22px;
            border-radius: 20px !important;
            isolation: isolate;
            pointer-events: none;
            
            /* .frosted-glass premium styles (dynamically colored background) */
            background: var(--state-bg-color, rgba(14, 165, 233, 0.85)) !important;
            backdrop-filter: blur(24px) saturate(180%) brightness(1.05) !important;
            -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(1.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.22) !important;
            box-shadow: 
                inset 0 1px 1px rgba(255, 255, 255, 0.25),
                0 20px 60px rgba(0, 0, 0, 0.3),
                0 0 14px var(--glow-color, rgba(14, 165, 233, 0.25)),
                0 0 35px var(--glow-color-soft, rgba(14, 165, 233, 0.1)) !important;
                
            /* .blur-reveal transition (derecha a izquierda) */
            filter: blur(16px);
            opacity: 0;
            transform: translateX(120px);
            transition:
                filter 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.6s ease,
                transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.5s ease;
            will-change: filter, opacity, transform;
        }

        /* Variante dark mode para el pill (.frosted-dark) */
        .dark #sync-toast,
        [data-theme="dark"] #sync-toast {
            background: var(--state-bg-color, rgba(14, 165, 233, 0.85)) !important;
            backdrop-filter: blur(20px) saturate(150%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(150%) !important;
        }

        #sync-toast.is-visible {
            filter: blur(0px);
            opacity: 1;
            transform: translateX(0);
        }

        /* Capa de ruido (.frosted-noise::after) */
        #sync-toast::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px !important; /* contain inside borders manually */
            opacity: 0.04;
            background-image: var(--glass-noise);
            background-repeat: repeat;
            background-size: 64px 64px;
            pointer-events: none;
            mix-blend-mode: overlay;
            z-index: -1;
        }
    </style>
    <div id="modal-card" class="educonta-modal-content w-full max-w-[480px]">
        
        <!-- Encabezado del Asistente con Avatar SVG Animado -->
        <div class="flex items-center gap-3.5 mb-5 select-none shrink-0 support-avatar-container cursor-pointer"
             onmouseenter="window.startAvatarAnim()" 
             onmouseleave="window.stopAvatarAnim()">
            <div class="w-12 h-12 flex items-center justify-center relative text-sky-600 dark:text-sky-400">
                <svg class="support-avatar-svg w-11 h-11" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Ondas de transmisión de audio (pulsantes) -->
                    <circle class="pulse-wave-1" cx="50" cy="50" r="32" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5"/>
                    <circle class="pulse-wave-2" cx="50" cy="50" r="42" stroke="currentColor" stroke-width="1" opacity="0.3"/>
                    <!-- Diadema / Auricular del casco -->
                    <path class="headset-arc" d="M32 52C32 36 40 30 50 30C60 30 68 36 68 52" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
                    <!-- Almohadillas laterales -->
                    <rect class="earpad-left" x="25" y="47" width="10" height="18" rx="4" fill="currentColor"/>
                    <rect class="earpad-right" x="65" y="47" width="10" height="18" rx="4" fill="currentColor"/>
                    <!-- Micrófono ajustable -->
                    <path class="headset-mic" d="M33 60C36 66 42 66 45 62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    <circle class="headset-mic-tip" cx="46" cy="61" r="3.5" fill="#0ea5e9"/>
                </svg>
            </div>
            <div>
                <h4 class="text-lg font-black text-slate-800 dark:text-white leading-tight">Soporte Técnico</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Asistente de Ayuda Rápida</p>
            </div>
        </div>

        <!-- Barra de progreso superior -->
        <div class="flex items-center justify-between mb-4 px-1 shrink-0 select-none">
            <div class="flex items-center gap-1.5">
                <span id="step-dot-1" class="w-2 h-2 rounded-full bg-sky-500 transition-all duration-300"></span>
                <span id="step-dot-2" class="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all duration-300"></span>
                <span id="step-dot-3" class="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all duration-300"></span>
            </div>
            <span id="step-indicator-text" class="text-[9px] font-black text-sky-600 dark:text-sky-400 tracking-widest uppercase">Paso 1 de 3</span>
        </div>

        <!-- Contenido del Formulario (Contenedor con márgenes de respiración) -->
        <div class="overflow-y-auto no-scrollbar flex-1 py-1 px-4 -mx-4 space-y-3" id="form-scroll-container">
            
            <form id="modal-support-form" class="space-y-4" onsubmit="event.preventDefault();">
            <!-- TARJETA ACORDEÓN 1: DATOS PERSONALES -->
            <div id="card-step-1" class="accordion-card active">
                <!-- Header -->
                <button type="button" onclick="window.goToStep(1)" class="accordion-header-btn w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none">
                    <div class="flex items-center gap-3">
                        <div class="step-badge w-6 h-6 rounded-full bg-sky-500 text-white text-[11px] font-black flex items-center justify-center transition-all">1</div>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-slate-800 dark:text-white">Datos Personales</span>
                            <span id="summary-text-1" class="text-[11px] text-slate-400 font-medium hidden">No completado</span>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down text-xs text-slate-400 accordion-arrow"></i>
                </button>
                
                <!-- Cuerpo de altura dinámica elástica -->
                <div id="body-wrapper-1" class="accordion-body-wrapper">
                    <div class="accordion-body-content">
                        <div class="px-5 pb-9 space-y-4 pt-1">
                            <div>
                                <label class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Nombre Completo</label>
                                <input type="text" id="mod-sup-nombre" required class="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/10 transition-all text-slate-700 dark:text-slate-200" placeholder="Ej. Juan Pérez">
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div class="relative">
                                    <label class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Correo Electrónico</label>
                                    <input type="email" id="mod-sup-correo" required class="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/10 transition-all text-slate-700 dark:text-slate-200" placeholder="tu@correo.com" oninput="window.handleEmailInput(this)" onfocus="window.showEmailSuggestions()" onblur="window.hideEmailSuggestionsDelayed()" onkeydown="window.handleEmailKeydown(event)">
                                    <div id="email-suggestions-box" class="absolute left-0 right-0 mt-1.5 rounded-xl border border-white/20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-xl z-50 hidden max-h-40 overflow-y-auto no-scrollbar"></div>
                                </div>
                                <div>
                                    <label class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Teléfono (Opcional)</label>
                                    <input type="tel" id="mod-sup-telefono" class="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/10 transition-all text-slate-700 dark:text-slate-200" placeholder="Ej. 7000-0000">
                                </div>
                            </div>
                            
                            <button type="button" onclick="window.validateAndGoToStep(2)" class="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 group">
                                <span>Continuar</span>
                                <i class="fas fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TARJETA ACORDEÓN 2: CONSULTA -->
            <div id="card-step-2" class="accordion-card">
                <!-- Header -->
                <button type="button" onclick="window.goToStep(2)" class="accordion-header-btn w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none">
                    <div class="flex items-center gap-3">
                        <div class="step-badge w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-black flex items-center justify-center transition-all">2</div>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-slate-800 dark:text-white">Asunto & Mensaje</span>
                            <span id="summary-text-2" class="text-[11px] text-slate-400 font-medium hidden">No completado</span>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down text-xs text-slate-400 accordion-arrow"></i>
                </button>
                
                <!-- Cuerpo -->
                <div id="body-wrapper-2" class="accordion-body-wrapper">
                    <div class="accordion-body-content">
                        <div class="px-5 pb-9 space-y-4 pt-1">
                            <div class="relative">
                                <label class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Asunto de la Consulta</label>
                                <input type="hidden" id="mod-sup-asunto" required value="">
                                <button type="button" id="asunto-dropdown-btn" onclick="window.toggleAsuntoDropdown()" onkeydown="window.handleAsuntoKeydown(event)" class="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 transition-all text-slate-700 dark:text-slate-200 flex justify-between items-center select-none">
                                    <span id="asunto-dropdown-label" class="text-slate-500 dark:text-slate-400">Selecciona una opción...</span>
                                    <i class="fas fa-chevron-down text-xs text-slate-400 transition-transform duration-300" id="asunto-dropdown-arrow"></i>
                                </button>
                                <div id="asunto-dropdown-menu" class="absolute left-0 right-0 mt-1.5 rounded-xl border border-white/20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-xl z-50 hidden max-h-48 overflow-y-auto no-scrollbar">
                                    <div class="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white cursor-pointer transition-colors" onclick="window.selectAsunto('Duda Contable')">Duda Contable</div>
                                    <div class="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white cursor-pointer transition-colors" onclick="window.selectAsunto('Error Técnico')">Error Técnico</div>
                                    <div class="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white cursor-pointer transition-colors" onclick="window.selectAsunto('Sugerencia')">Sugerencia</div>
                                    <div class="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white cursor-pointer transition-colors" onclick="window.selectAsunto('Otro')">Otro</div>
                                </div>
                            </div>
                            
                            <div>
                                <label class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Mensaje o Detalles</label>
                                <textarea id="mod-sup-mensaje" required rows="3" class="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/10 transition-all resize-none text-slate-700 dark:text-slate-200" placeholder="Detalla tu duda o reporte..."></textarea>
                            </div>
                            
                            <button type="button" onclick="window.validateAndGoToStep(3)" class="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 group">
                                <span>Siguiente Paso</span>
                                <i class="fas fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TARJETA ACORDEÓN 3: ADJUNTAR ARCHIVO & ENVIAR -->
            <div id="card-step-3" class="accordion-card">
                <!-- Header -->
                <button type="button" onclick="window.goToStep(3)" class="accordion-header-btn w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none">
                    <div class="flex items-center gap-3">
                        <div class="step-badge w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-black flex items-center justify-center transition-all">3</div>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-slate-800 dark:text-white">Adjuntos & Confirmación</span>
                            <span id="summary-text-3" class="text-[11px] text-slate-400 font-medium hidden">Ninguno</span>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down text-xs text-slate-400 accordion-arrow"></i>
                </button>
                
                <!-- Cuerpo -->
                <div id="body-wrapper-3" class="accordion-body-wrapper">
                    <div class="accordion-body-content">
                        <div class="px-5 pb-9 space-y-4 pt-1">
                            <div>
                                <label class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Subir captura o documento (Opcional)</label>
                                <div id="mod-upload-zone" class="animated-upload-zone relative rounded-2xl p-6 text-center cursor-pointer">
                                    <input type="file" id="mod-sup-imagen" accept="image/png, image/jpeg, image/jpg, image/webp" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onchange="window.handleModalFileSelect(this)">
                                    <div class="flex flex-col items-center justify-center gap-2 select-none">
                                        <div class="upload-icon-wrapper rounded-full bg-slate-800 dark:bg-slate-950 text-sky-400 shadow-md transition-all duration-300" style="width: 36px !important; height: 36px !important; min-width: 36px !important; min-height: 36px !important; aspect-ratio: 1 / 1 !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">
                                            <i class="fas fa-cloud-upload-alt text-sm"></i>
                                        </div>
                                        <span id="mod-file-name" class="text-[11px] font-bold text-slate-500 dark:text-slate-400">Click o arrastra tu imagen (Máx 5MB)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button type="button" onclick="window.submitMultiStepForm()" id="mod-btn-submit" class="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20">
                                <span id="mod-btn-text">Enviar Reporte</span>
                                <i id="mod-btn-icon" class="fas fa-paper-plane text-xs" style="display: inline-block;"></i>
                                <i id="mod-btn-spinner" class="fas fa-circle-notch fa-spin text-xs" style="display: none;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </form>

        <!-- PANTALLA DE ÉXITO -->
        <div id="modal-support-success" class="hidden text-center py-8 px-4">
            <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/10 shadow-lg shadow-emerald-500/5">
                <i class="fas fa-check-circle text-3xl animate-bounce"></i>
            </div>
            <h3 class="text-lg font-black text-slate-800 dark:text-white">¡Reporte Enviado con Éxito!</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto leading-relaxed">Hemos recibido tus datos de forma segura. Un asesor se comunicará contigo de inmediato.</p>
            <button onclick="window.resetWizard()" class="mt-6 px-6 py-2.5 bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-sky-600 transition-all">Crear Nuevo Reporte</button>
        </div>

    </div>
</div>
`;

    if (document.getElementById(containerId)) {
        container.innerHTML = uiHTML;
    } else {
        container.insertAdjacentHTML('afterbegin', uiHTML);
    }
    
    // Bind floating support avatar hover end iteration listener
    const floatSvg = document.getElementById('floating-support-svg');
    if (floatSvg && !floatSvg.dataset.listenerBound) {
        floatSvg.dataset.listenerBound = "true";
        floatSvg.addEventListener('animationiteration', () => {
            if (!window.floatingMouseIn) {
                floatSvg.classList.remove('is-animating');
            }
        });
    }
    
    // Ocultar modal y botón si estamos en la página principal de soporte
    if (window.location.pathname.includes('soporte.html')) {
        const supportBtn = document.getElementById('floating-support-btn');
        const supportModal = document.getElementById('support-modal');
        if (supportBtn) supportBtn.remove();
        if (supportModal) supportModal.remove();
    } else {
        // Inicializar eventos del modal de soporte
        window.handleModalSupportSubmit = function(e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (typeof window.submitMultiStepForm === 'function') window.submitMultiStepForm();
        };
        const modForm = document.getElementById('modal-support-form');
        if (modForm) modForm.addEventListener('submit', window.handleModalSupportSubmit);
    }

    if (typeof window.initAuthEvents === 'function') {
        window.initAuthEvents();
    }

    // Comprobar si corresponde mostrar anuncio de políticas v7 y aviso de desarrollo
    if (typeof window.checkPolicyUpdateAnnouncement === 'function') {
        window.checkPolicyUpdateAnnouncement();
    }
};

window.avatarMouseIn = false;
window.floatingMouseIn = false;

window.startAvatarAnim = function() {
    window.avatarMouseIn = true;
    const modal = document.getElementById('support-modal');
    if (!modal) return;
    const svg = modal.querySelector('.support-avatar-svg');
    if (svg) {
        svg.classList.add('is-animating');
    }
};

window.stopAvatarAnim = function() {
    window.avatarMouseIn = false;
};

window.startFloatingAnim = function() {
    window.floatingMouseIn = true;
    const svg = document.getElementById('floating-support-svg');
    if (svg) {
        svg.classList.add('is-animating');
    }
};

window.stopFloatingAnim = function() {
    window.floatingMouseIn = false;
};

window.openSupportModal = function() {
    const modal = document.getElementById('support-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Reset wizard states
        window.step1Completed = false;
        window.step2Completed = false;
        window.currentStep = 1;
        
        // Reset form
        const form = document.getElementById('modal-support-form');
        if (form) form.reset();
        
        // Reset custom email suggestions
        const emailSuggestions = document.getElementById('email-suggestions-box');
        if (emailSuggestions) {
            emailSuggestions.innerHTML = '';
            emailSuggestions.classList.add('hidden');
        }

        // Reset custom subject dropdown
        const asuntoInput = document.getElementById('mod-sup-asunto');
        if (asuntoInput) asuntoInput.value = '';
        const asuntoLabel = document.getElementById('asunto-dropdown-label');
        if (asuntoLabel) {
            asuntoLabel.textContent = "Selecciona una opción...";
            asuntoLabel.className = "text-slate-500 dark:text-slate-400";
        }
        
        // Reset file upload zone display
        const fileInput = document.getElementById('mod-sup-imagen');
        if (fileInput) fileInput.value = "";
        window.handleModalFileSelect(fileInput);
        
        // Hide summaries
        const s1 = document.getElementById('summary-text-1');
        const s2 = document.getElementById('summary-text-2');
        const s3 = document.getElementById('summary-text-3');
        if (s1) s1.classList.add('hidden');
        if (s2) s2.classList.add('hidden');
        if (s3) s3.classList.add('hidden');
        
        document.getElementById('modal-support-form').classList.remove('hidden');
        document.getElementById('modal-support-success').classList.add('hidden');
        
        // Initialize drag & drop events
        if (window.initModalDragAndDrop) window.initModalDragAndDrop();
        
        // Initial animation for avatar
        const avatar = modal.querySelector('.support-avatar-svg');
        if (avatar) {
            avatar.classList.add('animate-start');
            setTimeout(() => {
                avatar.classList.remove('animate-start');
            }, 2500);
        }
        
        // Bind avatar hover end iteration listener
        const svg = modal.querySelector('.support-avatar-svg');
        if (svg && !svg.dataset.listenerBound) {
            svg.dataset.listenerBound = "true";
            svg.addEventListener('animationiteration', () => {
                if (!window.avatarMouseIn) {
                    svg.classList.remove('is-animating');
                }
            });
        }
        
        // Open Step 1 instantly without animation (and no jelly effect on card 1)
        for (let idx = 1; idx <= 3; idx++) {
            const card = document.getElementById(`card-step-${idx}`);
            const wrapper = document.getElementById(`body-wrapper-${idx}`);
            if (!card || !wrapper) continue;
            const badge = card.querySelector('.step-badge');
            
            card.classList.remove('animate-jelly');
            if (idx === 1) {
                card.classList.add('active');
                if (badge) {
                    badge.className = "step-badge w-6 h-6 rounded-full bg-sky-500 text-white text-[11px] font-black flex items-center justify-center transition-all";
                    badge.textContent = "1";
                }
                
                // Disable transition temporarily to load instantly without transition animation
                wrapper.style.transition = 'none';
                const contentHeight = wrapper.querySelector('.accordion-body-content').offsetHeight;
                wrapper.style.height = (contentHeight + 16) + "px"; // add buffer for shadow
                wrapper.offsetHeight; // force reflow
                wrapper.style.transition = '';
            } else {
                card.classList.remove('active');
                wrapper.style.transition = 'none';
                wrapper.style.height = "0px";
                if (badge) {
                    badge.className = "step-badge w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-black flex items-center justify-center transition-all";
                    badge.textContent = idx;
                }
                wrapper.offsetHeight; // force reflow
                wrapper.style.transition = '';
            }
        }
        window.updateStepDots(1);
    }
};

window.closeSupportModal = function() {
    const modal = document.getElementById('support-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
    }
};

window.goToStep = function(stepNumber) {
    if (stepNumber === window.currentStep) return; // Prevent transition trigger if already active

    if (stepNumber === 2 && !window.step1Completed) {
        window.shakeInputAndFocus('mod-sup-nombre');
        return;
    }
    if (stepNumber === 3 && (!window.step1Completed || !window.step2Completed)) {
        if (!window.step1Completed) {
            window.goToStep(1);
        } else {
            window.shakeInputAndFocus('mod-sup-asunto');
        }
        return;
    }

    window.currentStep = stepNumber;

    for (let idx = 1; idx <= 3; idx++) {
        const card = document.getElementById(`card-step-${idx}`);
        const wrapper = document.getElementById(`body-wrapper-${idx}`);
        if (!card || !wrapper) continue;
        const badge = card.querySelector('.step-badge');
        
        if (idx === stepNumber) {
            card.classList.add('active');
            if (idx !== 1) {
                card.classList.add('animate-jelly'); // Prevent jelly on step 1
            }
            if (badge) {
                badge.className = "step-badge w-6 h-6 rounded-full bg-sky-500 text-white text-[11px] font-black flex items-center justify-center transition-all";
                badge.textContent = idx;
            }
            
            // Calculate real scroll height and set it for the spring timing transition (with buffer to prevent button cut-off)
            // Calcular la altura real de scroll y asignarla para que la curva elástica de CSS rebote de forma elástica
            const contentHeight = wrapper.querySelector('.accordion-body-content').offsetHeight;
            wrapper.style.height = contentHeight + "px";
        } else {
            card.classList.remove('active');
            card.classList.remove('animate-jelly');
            wrapper.style.height = "0px";
            
            if (badge) {
                if ((idx === 1 && window.step1Completed) || (idx === 2 && window.step2Completed)) {
                    badge.className = "step-badge w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center transition-all";
                    badge.innerHTML = '<i class="fas fa-check text-[9px]"></i>';
                } else {
                    badge.className = "step-badge w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-black flex items-center justify-center transition-all";
                    badge.textContent = idx;
                }
            }
        }
    }

    window.updateStepDots(stepNumber);
    
    setTimeout(() => {
        const activeCard = document.getElementById(`card-step-${stepNumber}`);
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 250);
};

window.updateStepDots = function(stepNumber) {
    const text = document.getElementById('step-indicator-text');
    if (text) text.innerText = `Paso ${stepNumber} de 3`;
    
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        if (dot) {
            if (i <= stepNumber) {
                dot.className = "w-2 h-2 rounded-full bg-sky-500 transition-all duration-300";
            } else {
                dot.className = "w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all duration-300";
            }
        }
    }
};

window.validateAndGoToStep = function(targetStep) {
    if (targetStep === 2) {
        const nombreInput = document.getElementById('mod-sup-nombre');
        const correoInput = document.getElementById('mod-sup-correo');
        const telInput = document.getElementById('mod-sup-telefono');

        if (!nombreInput.value.trim()) {
            window.shakeInputAndFocus('mod-sup-nombre');
            return;
        }
        if (!correoInput.value.trim() || !correoInput.checkValidity()) {
            window.shakeInputAndFocus('mod-sup-correo');
            return;
        }

        window.step1Completed = true;
        const summary1 = document.getElementById('summary-text-1');
        if (summary1) {
            const telText = telInput.value.trim() ? ` • ${telInput.value.trim()}` : '';
            summary1.textContent = `${nombreInput.value.split(' ')[0]} • ${correoInput.value}${telText}`;
            summary1.classList.remove('hidden');
        }

        window.goToStep(2);
    } 
    else if (targetStep === 3) {
        const asuntoSelect = document.getElementById('mod-sup-asunto');
        const mensajeTextarea = document.getElementById('mod-sup-mensaje');

        if (!asuntoSelect.value) {
            window.shakeInputAndFocus('mod-sup-asunto');
            return;
        }
        if (!mensajeTextarea.value.trim() || mensajeTextarea.value.trim().length < 5) {
            window.shakeInputAndFocus('mod-sup-mensaje');
            return;
        }

        window.step2Completed = true;
        const summary2 = document.getElementById('summary-text-2');
        if (summary2) {
            summary2.textContent = `${asuntoSelect.value} • ${mensajeTextarea.value.substring(0, 20)}...`;
            summary2.classList.remove('hidden');
        }

        window.goToStep(3);
    }
};

window.shakeInputAndFocus = function(id) {
    const input = document.getElementById(id);
    if (input) {
        const elementToShake = (id === 'mod-sup-asunto') ? document.getElementById('asunto-dropdown-btn') : input;
        if (elementToShake) {
            elementToShake.classList.add('input-error');
            elementToShake.focus();
            setTimeout(() => {
                elementToShake.classList.remove('input-error');
            }, 400);
        }
    }
};

window.handleModalFileSelect = function(input) {
    const zone = document.getElementById('mod-upload-zone');
    const label = document.getElementById('mod-file-name');
    const iconWrapper = zone.querySelector('.upload-icon-wrapper');
    const summary3 = document.getElementById('summary-text-3');
    
    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) {
            if (window.showAlert) window.showAlert("Archivo muy grande", "La imagen no debe superar los 5MB.");
            input.value = '';
            zone.classList.remove('has-file');
            label.innerText = "Click o arrastra tu imagen (Máx 5MB)";
            iconWrapper.className = "upload-icon-wrapper rounded-full bg-slate-800 dark:bg-slate-950 text-sky-400 shadow-md transition-all duration-300";
            iconWrapper.innerHTML = '<i class="fas fa-cloud-upload-alt text-sm"></i>';
            if (summary3) summary3.classList.add('hidden');
            return;
        }
        zone.classList.add('has-file');
        label.innerText = `Adjunto: ${file.name}`;
        label.className = "text-[11px] font-bold text-emerald-500 truncate max-w-xs";
        iconWrapper.className = "upload-icon-wrapper rounded-full bg-slate-800 dark:bg-slate-950 text-emerald-400 shadow-md transition-all duration-300 border border-emerald-500/20";
        iconWrapper.innerHTML = '<i class="fas fa-check text-sm"></i>';
        
        if (summary3) {
            summary3.textContent = file.name;
            summary3.classList.remove('hidden');
        }
    } else {
        zone.classList.remove('has-file');
        label.innerText = "Click o arrastra tu imagen (Máx 5MB)";
        label.className = "text-[11px] font-bold text-slate-500 dark:text-slate-400";
        iconWrapper.className = "upload-icon-wrapper rounded-full bg-slate-800 dark:bg-slate-950 text-sky-400 shadow-md transition-all duration-300";
        iconWrapper.innerHTML = '<i class="fas fa-cloud-upload-alt text-sm"></i>';
        if (summary3) summary3.classList.add('hidden');
    }
};

window.initModalDragAndDrop = function() {
    const zone = document.getElementById('mod-upload-zone');
    const fileInput = document.getElementById('mod-sup-imagen');
    if (!zone || !fileInput) return;
    if (zone.dataset.dndBound === "true") return;
    zone.dataset.dndBound = "true";
    
    ['dragenter', 'dragover'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dragover');
        }, false);
    });
    
    zone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            fileInput.files = files;
            window.handleModalFileSelect(fileInput);
        }
    }, false);
};

window.submitMultiStepForm = async function() {
    if (!window.step1Completed) { window.goToStep(1); return; }
    if (!window.step2Completed) { window.goToStep(2); return; }

    const GOOGLE_URL = typeof GOOGLE_SCRIPT_URL !== 'undefined' ? GOOGLE_SCRIPT_URL : "https://script.google.com/macros/s/AKfycbxW4BP3_pNQWBuOqdpJnvT8p_Lc3f2sos9j8vWLHZ3ByWzJjKE4dVx2hukgXjqQXMQtDA/exec";
    
    const fileInput = document.getElementById('mod-sup-imagen');
    const submitBtn = document.getElementById('mod-btn-submit');
    const btnText = document.getElementById('mod-btn-text');
    const btnIcon = document.getElementById('mod-btn-icon');
    const btnSpinner = document.getElementById('mod-btn-spinner');

    submitBtn.disabled = true;
    submitBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
    submitBtn.classList.add('bg-slate-400', 'dark:bg-slate-800', 'cursor-not-allowed');
    btnText.textContent = "Procesando...";
    if (btnIcon) btnIcon.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';

    try {
        let base64Data = null;
        let fileName = null;
        
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName = file.name;
            base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }
        
        const payload = {
            nombre: document.getElementById('mod-sup-nombre').value,
            correo: document.getElementById('mod-sup-correo').value,
            telefono: document.getElementById('mod-sup-telefono').value,
            asunto: document.getElementById('mod-sup-asunto').value,
            mensaje: document.getElementById('mod-sup-mensaje').value,
            fileName: fileName,
            fileBase64: base64Data
        };
        
        await fetch(GOOGLE_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        
        document.getElementById('modal-support-form').classList.add('hidden');
        document.getElementById('modal-support-success').classList.remove('hidden');
        const txtIndicator = document.getElementById('step-indicator-text');
        if (txtIndicator) txtIndicator.innerText = "PROCESO COMPLETADO";
        
    } catch (error) {
        console.error(error);
        if (window.showAlert) window.showAlert("Error", "Ocurrió un problema de conexión al enviar el formulario.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
        submitBtn.classList.remove('bg-slate-400', 'dark:bg-slate-800', 'cursor-not-allowed');
        btnText.textContent = "Enviar Reporte";
        if (btnIcon) btnIcon.style.display = 'inline-block';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
};

window.resetWizard = function() {
    document.getElementById('modal-support-success').classList.add('hidden');
    document.getElementById('modal-support-form').classList.remove('hidden');
    window.step1Completed = false;
    window.step2Completed = false;
    
    const form = document.getElementById('modal-support-form');
    if (form) form.reset();
    
    // Reset custom email suggestions
    const emailSuggestions = document.getElementById('email-suggestions-box');
    if (emailSuggestions) {
        emailSuggestions.innerHTML = '';
        emailSuggestions.classList.add('hidden');
    }

    // Reset custom subject dropdown
    const asuntoInput = document.getElementById('mod-sup-asunto');
    if (asuntoInput) asuntoInput.value = '';
    const asuntoLabel = document.getElementById('asunto-dropdown-label');
    if (asuntoLabel) {
        asuntoLabel.textContent = "Selecciona una opción...";
        asuntoLabel.className = "text-slate-500 dark:text-slate-400";
    }
    
    const fileInput = document.getElementById('mod-sup-imagen');
    if (fileInput) fileInput.value = "";
    window.handleModalFileSelect(fileInput);
    
    const s1 = document.getElementById('summary-text-1');
    const s2 = document.getElementById('summary-text-2');
    const s3 = document.getElementById('summary-text-3');
    if (s1) s1.classList.add('hidden');
    if (s2) s2.classList.add('hidden');
    if (s3) s3.classList.add('hidden');
    
    window.goToStep(1);
};

// --- CUSTOM EMAIL SUGGESTIONS DROPDOWN ---
window.showEmailSuggestions = function() {
    const input = document.getElementById('mod-sup-correo');
    const box = document.getElementById('email-suggestions-box');
    if (!input || !box) return;
    
    const val = input.value.trim();
    let username = val.split('@')[0];
    if (!username) {
        username = "";
    }
    
    const domains = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com'];
    box.innerHTML = '';
    
    window.activeDropdownIndex = -1; // Reset selection index
    
    domains.forEach(domain => {
        const suggestionText = username + domain;
        const item = document.createElement('div');
        item.className = "px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-sky-500 hover:text-white cursor-pointer transition-colors";
        item.textContent = suggestionText;
        item.onmousedown = () => {
            input.value = suggestionText;
            box.classList.add('hidden');
            const wrapper = document.getElementById('body-wrapper-1');
            const card = document.getElementById('card-step-1');
            if (wrapper) wrapper.classList.remove('dropdown-open');
            if (card) card.classList.remove('dropdown-open');
        };
        box.appendChild(item);
    });
    
    box.classList.remove('hidden');
    const wrapper = document.getElementById('body-wrapper-1');
    const card = document.getElementById('card-step-1');
    if (wrapper) wrapper.classList.add('dropdown-open');
    if (card) card.classList.add('dropdown-open');
};

window.handleEmailKeydown = function(e) {
    const box = document.getElementById('email-suggestions-box');
    if (!box || box.classList.contains('hidden')) return;
    const items = box.querySelectorAll('div');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.activeDropdownIndex = (window.activeDropdownIndex + 1) % items.length;
        window.updateEmailHighlight();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.activeDropdownIndex = (window.activeDropdownIndex - 1 + items.length) % items.length;
        window.updateEmailHighlight();
    } else if (e.key === 'Enter') {
        if (window.activeDropdownIndex >= 0 && window.activeDropdownIndex < items.length) {
            e.preventDefault();
            items[window.activeDropdownIndex].onmousedown();
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        box.classList.add('hidden');
        const wrapper = document.getElementById('body-wrapper-1');
        const card = document.getElementById('card-step-1');
        if (wrapper) wrapper.classList.remove('dropdown-open');
        if (card) card.classList.remove('dropdown-open');
    }
};



window.updateEmailHighlight = function() {
    const box = document.getElementById('email-suggestions-box');
    if (!box) return;
    const items = box.querySelectorAll('div');
    items.forEach((item, idx) => {
        if (idx === window.activeDropdownIndex) {
            item.classList.add('bg-sky-500', 'text-white');
            item.classList.remove('text-slate-700', 'dark:text-slate-300');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('bg-sky-500', 'text-white');
            item.classList.add('text-slate-700', 'dark:text-slate-300');
        }
    });
};

window.handleEmailInput = function(input) {
    window.showEmailSuggestions();
};

window.hideEmailSuggestionsDelayed = function() {
    setTimeout(() => {
        const box = document.getElementById('email-suggestions-box');
        if (box) box.classList.add('hidden');
        const wrapper = document.getElementById('body-wrapper-1');
        const card = document.getElementById('card-step-1');
        if (wrapper) wrapper.classList.remove('dropdown-open');
        if (card) card.classList.remove('dropdown-open');
    }, 250);
};

// --- CUSTOM SUBJECT DROPDOWN ---
window.toggleAsuntoDropdown = function() {
    const menu = document.getElementById('asunto-dropdown-menu');
    const arrow = document.getElementById('asunto-dropdown-arrow');
    const btn = document.getElementById('asunto-dropdown-btn');
    if (!menu) return;
    
    const wrapper = document.getElementById('body-wrapper-2');
    const card = document.getElementById('card-step-2');

    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        window.activeDropdownIndex = -1; // Reset selector index
        if (arrow) arrow.style.transform = 'rotate(180deg)';
        if (btn) btn.focus();
        if (wrapper) wrapper.classList.add('dropdown-open');
        if (card) card.classList.add('dropdown-open');
    } else {
        menu.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
        if (wrapper) wrapper.classList.remove('dropdown-open');
        if (card) card.classList.remove('dropdown-open');
    }
};

window.handleAsuntoKeydown = function(e) {
    const menu = document.getElementById('asunto-dropdown-menu');
    if (!menu || menu.classList.contains('hidden')) return;
    const items = menu.querySelectorAll('div');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.activeDropdownIndex = (window.activeDropdownIndex + 1) % items.length;
        window.updateAsuntoHighlight();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.activeDropdownIndex = (window.activeDropdownIndex - 1 + items.length) % items.length;
        window.updateAsuntoHighlight();
    } else if (e.key === 'Enter') {
        if (window.activeDropdownIndex >= 0 && window.activeDropdownIndex < items.length) {
            e.preventDefault();
            items[window.activeDropdownIndex].click();
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        menu.classList.add('hidden');
        const arrow = document.getElementById('asunto-dropdown-arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
        const wrapper = document.getElementById('body-wrapper-2');
        const card = document.getElementById('card-step-2');
        if (wrapper) wrapper.classList.remove('dropdown-open');
        if (card) card.classList.remove('dropdown-open');
    }
};

window.updateAsuntoHighlight = function() {
    const menu = document.getElementById('asunto-dropdown-menu');
    if (!menu) return;
    const items = menu.querySelectorAll('div');
    items.forEach((item, idx) => {
        if (idx === window.activeDropdownIndex) {
            item.classList.add('bg-sky-500', 'text-white');
            item.classList.remove('text-slate-700', 'dark:text-slate-200');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('bg-sky-500', 'text-white');
            item.classList.add('text-slate-700', 'dark:text-slate-200');
        }
    });
};

window.selectAsunto = function(value) {
    const hiddenInput = document.getElementById('mod-sup-asunto');
    const label = document.getElementById('asunto-dropdown-label');
    const menu = document.getElementById('asunto-dropdown-menu');
    const arrow = document.getElementById('asunto-dropdown-arrow');
    
    if (hiddenInput) hiddenInput.value = value;
    if (label) {
        label.textContent = value;
        label.className = "text-slate-800 dark:text-slate-100 font-semibold";
    }
    if (menu) menu.classList.add('hidden');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
    
    const wrapper = document.getElementById('body-wrapper-2');
    const card = document.getElementById('card-step-2');
    if (wrapper) wrapper.classList.remove('dropdown-open');
    if (card) card.classList.remove('dropdown-open');
};

// Cerrar el menú desplegable del asunto al hacer clic fuera
document.addEventListener('click', function(e) {
    const btn = document.getElementById('asunto-dropdown-btn');
    const menu = document.getElementById('asunto-dropdown-menu');
    const arrow = document.getElementById('asunto-dropdown-arrow');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
        const wrapper = document.getElementById('body-wrapper-2');
        const card = document.getElementById('card-step-2');
        if (wrapper) wrapper.classList.remove('dropdown-open');
        if (card) card.classList.remove('dropdown-open');
    }
});

window.showSyncToast = function(state, detail = "") {
    const toast = document.getElementById('sync-toast');
    if (!toast) return;

    const icon = toast.querySelector('i');
    const h4 = toast.querySelector('h4');
    const p = toast.querySelector('p');

    // Force high-contrast white text layout over colored backgrounds
    toast.style.setProperty('color', '#ffffff', 'important');

    if (state === 'syncing') {
        toast.style.setProperty('--state-bg-color', 'rgba(14, 165, 233, 0.88)', 'important');
        toast.style.setProperty('border-color', 'rgba(255, 255, 255, 0.25)', 'important');
        toast.style.setProperty('--glow-color', 'rgba(14, 165, 233, 0.35)', 'important');
        toast.style.setProperty('--glow-color-soft', 'rgba(14, 165, 233, 0.12)', 'important');
        if (icon) icon.className = "fas fa-sync fa-spin text-2xl text-white";
        if (h4) h4.textContent = "Sincronizando...";
        if (p) {
            p.className = "text-[11px] font-semibold text-sky-50 uppercase tracking-widest mt-0.5";
            p.textContent = detail || "Guardando cambios en la nube";
        }
    } else if (state === 'success') {
        toast.style.setProperty('--state-bg-color', 'rgba(16, 185, 129, 0.88)', 'important');
        toast.style.setProperty('border-color', 'rgba(255, 255, 255, 0.25)', 'important');
        toast.style.setProperty('--glow-color', 'rgba(16, 185, 129, 0.35)', 'important');
        toast.style.setProperty('--glow-color-soft', 'rgba(16, 185, 129, 0.12)', 'important');
        if (icon) icon.className = "fas fa-check-circle text-2xl text-white";
        if (h4) h4.textContent = "Sincronización Exitosa";
        if (p) {
            p.className = "text-[11px] font-semibold text-emerald-50 uppercase tracking-widest mt-0.5";
            p.textContent = detail || "Proyectos respaldados";
        }
    } else if (state === 'biometric') {
        toast.style.setProperty('--state-bg-color', 'rgba(14, 165, 233, 0.92)', 'important');
        toast.style.setProperty('border-color', 'rgba(56, 189, 248, 0.4)', 'important');
        toast.style.setProperty('--glow-color', 'rgba(14, 165, 233, 0.45)', 'important');
        toast.style.setProperty('--glow-color-soft', 'rgba(14, 165, 233, 0.18)', 'important');
        if (icon) icon.className = "fas fa-fingerprint text-2xl text-white";
        if (h4) h4.textContent = "Acceso Biométrico";
        if (p) {
            p.className = "text-[11px] font-semibold text-sky-50 uppercase tracking-widest mt-0.5";
            p.textContent = detail || "Identidad verificada exitosamente";
        }
    } else if (state === 'offline') {
        toast.style.setProperty('--state-bg-color', 'rgba(245, 158, 11, 0.88)', 'important');
        toast.style.setProperty('border-color', 'rgba(255, 255, 255, 0.25)', 'important');
        toast.style.setProperty('--glow-color', 'rgba(245, 158, 11, 0.35)', 'important');
        toast.style.setProperty('--glow-color-soft', 'rgba(245, 158, 11, 0.12)', 'important');
        if (icon) icon.className = "fas fa-wifi-slash text-2xl text-white";
        if (h4) h4.textContent = "Modo Local (Offline)";
        if (p) {
            p.className = "text-[11px] font-semibold text-amber-50 uppercase tracking-widest mt-0.5";
            p.textContent = detail || "Trabajando sin conexión - Guardado local activo";
        }
    } else if (state === 'online') {
        toast.style.setProperty('--state-bg-color', 'rgba(14, 165, 233, 0.88)', 'important');
        toast.style.setProperty('border-color', 'rgba(255, 255, 255, 0.25)', 'important');
        toast.style.setProperty('--glow-color', 'rgba(14, 165, 233, 0.35)', 'important');
        toast.style.setProperty('--glow-color-soft', 'rgba(14, 165, 233, 0.12)', 'important');
        if (icon) icon.className = "fas fa-wifi text-2xl text-white";
        if (h4) h4.textContent = "Conexión Restablecida";
        if (p) {
            p.className = "text-[11px] font-semibold text-sky-50 uppercase tracking-widest mt-0.5";
            p.textContent = detail || "Sincronizando cambios con la nube...";
        }
    } else if (state === 'local') {
        toast.style.setProperty('--state-bg-color', 'rgba(71, 85, 105, 0.88)', 'important');
        toast.style.setProperty('border-color', 'rgba(255, 255, 255, 0.25)', 'important');
        toast.style.setProperty('--glow-color', 'rgba(71, 85, 105, 0.35)', 'important');
        toast.style.setProperty('--glow-color-soft', 'rgba(71, 85, 105, 0.12)', 'important');
        if (icon) icon.className = "fas fa-hdd text-2xl text-white";
        if (h4) h4.textContent = "Guardado Local";
        if (p) {
            p.className = "text-[11px] font-semibold text-slate-100 uppercase tracking-widest mt-0.5";
            p.textContent = detail || "Guardado en este equipo (Inicia sesión para subir a la nube)";
        }
    } else if (state === 'error') {
        toast.style.setProperty('--state-bg-color', 'rgba(244, 63, 94, 0.88)', 'important');
        toast.style.setProperty('border-color', 'rgba(255, 255, 255, 0.25)', 'important');
        toast.style.setProperty('--glow-color', 'rgba(244, 63, 94, 0.35)', 'important');
        toast.style.setProperty('--glow-color-soft', 'rgba(244, 63, 94, 0.12)', 'important');
        if (icon) icon.className = "fas fa-exclamation-triangle text-2xl text-white";
        if (h4) h4.textContent = "Error de Sincronización";
        const shortDetail = detail && detail.length > 50 ? detail.substring(0, 47) + "..." : detail;
        if (p) {
            p.className = "text-[11px] font-semibold text-rose-50 uppercase tracking-widest mt-0.5";
            p.textContent = shortDetail || "No se pudo guardar en la nube (Guardado local seguro)";
        }
    }

    // Show toast (slide left and fade in)
    toast.classList.add('is-visible');

    // Auto hide after 3.5 seconds for success, offline, local, online, error
    if (window._syncToastTimeout) clearTimeout(window._syncToastTimeout);
    if (state !== 'syncing') {
        window._syncToastTimeout = setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 3500);
    }
};

// =========================================================
// MODO AUDITORÍA GLOBAL - BLOQUEO Y RESTAURACIÓN
// =========================================================

window.exitAuditMode = function() {
    // 1. Quitar banderas de auditoría
    sessionStorage.removeItem('educonta_audit_active');
    sessionStorage.removeItem('educonta_audit_mode');
    sessionStorage.removeItem('educonta_audit_owner_name');
    
    // 2. Restaurar proyectos y documentos originales del administrador
    const vaults = [
        'libros', 'kardex', 'planillas', 'tributario', 'costos', 'caja', 'finanzas',
        'textos', 'calculo', 'hojas', 'lienzos', 'diagramas'
    ];
    vaults.forEach(v => {
        const backup = sessionStorage.getItem('educonta_backup_projects_' + v);
        if (backup) localStorage.setItem('educonta_projects_' + v, backup);
        sessionStorage.removeItem('educonta_backup_projects_' + v);
    });
    
    // Limpiar ID de proyecto activo temporal
    localStorage.removeItem('educonta_last_project_id');
    
    // Redirigir de vuelta al panel de administrador
    window.location.href = 'admin.html';
};

(function() {
    if (sessionStorage.getItem('educonta_audit_active') === 'true' || sessionStorage.getItem('educonta_audit_mode') === 'true') {
        window.isAuditMode = true;
        
        // Bloquear inputs y deshabilitar botones al cargar el DOM
        document.addEventListener('DOMContentLoaded', () => {
            // Mostrar botón salir de auditoría y ocultar navegación ordinaria
            setTimeout(() => {
                const exitBtn = document.getElementById('btn-exit-audit');
                if (exitBtn) {
                    exitBtn.classList.remove('hidden');
                    exitBtn.style.setProperty('display', 'block', 'important');
                }
                
                const btnVolver = document.getElementById('btn-volver');
                if (btnVolver) btnVolver.style.setProperty('display', 'none', 'important');
                
                const btnProjects = document.getElementById('btn-nav-projects');
                if (btnProjects) btnProjects.style.setProperty('display', 'none', 'important');
            }, 100);
            
            // Bloqueo visual permanente optimizado con MutationObserver + requestAnimationFrame
            const combinedSelectorsToHide = [
                'button[onclick*="openShareModal"]', 'button[onclick*="closeProject"]', '#right-tools-container', '#mobile-tools-container',
                '.btn-add', '.btn-freeze-toggle', '.btn-remove-row', '#btn-force-save', 
                '#btn-undo', '#btn-redo', 'button[onclick*="confirmClearData"]', 
                'button[onclick*="confirmDeleteSheet"]', 'button[onclick*="createNewBook"]',
                'button[onclick*="deleteKardexRow"]', 'button[onclick*="addKardexRow"]',
                'button[onclick*="openNewSheetModal"]',
                'button[onclick*="openImportEdcModal"]', 'button[onclick*="exportarProyectoEduConta"]',
                '#btn-add-row', '#btn-remove-row', '.btn-delete-row', '.btn-edit-row',
                'button[onclick*="saveNewSheet"]', 'button[onclick*="addPlanillaRow"]',
                'button[onclick*="deletePlanillaRow"]', '#btn-save-planilla',
                '#btn-load-backup', '.dropdown-menu', '.dropdown-item', 'button:has(.fa-ellipsis-v)', 
                'button:has(.fa-trash-alt)', 'button:has(.fa-edit)', 'button:has(.fa-plus)', 'button:has(.fa-save)',
                '#btn-add-book', '#btn-add-sheet', '.btn-delete-sheet', 'button:has(.fa-file-import)',
                'button:has(.fa-file-export)', '.action-btn', '.btn-action', 'button:has(.fa-trash)', 'button:has(.fa-plus-circle)'
            ].join(', ');

            let auditObserver = null;
            let auditRafPending = false;

            function enforceAuditLock() {
                if (auditObserver) auditObserver.disconnect();
                try {
                    // 1. Convertir indicadores de estado a rojo de Auditoría
                    const saveInd = document.getElementById('save-indicator');
                    const cloudInd = document.getElementById('cloud-indicator');
                    
                    if (saveInd && !saveInd.dataset.auditLocked) {
                        saveInd.dataset.auditLocked = "true";
                        saveInd.className = "flex items-center justify-center gap-1.5 w-full text-rose-600 font-black bg-rose-50 rounded-[36px] border border-rose-100";
                        saveInd.innerHTML = '<i class="fas fa-eye"></i> AUDITORÍA';
                    }
                    if (cloudInd && !cloudInd.dataset.auditLocked) {
                        cloudInd.dataset.auditLocked = "true";
                        cloudInd.className = "flex items-center justify-center gap-1.5 w-full text-rose-600 font-black bg-rose-50 rounded-[36px] border border-rose-100";
                        const span = cloudInd.querySelector('span');
                        if (span) span.textContent = "SÓLO LECTURA";
                    }
                    
                    // 2. Inyectar badge del alumno auditado en la cabecera (una sola vez)
                    const projName = document.getElementById('current-project-name');
                    if (projName && !projName.dataset.auditTagged) {
                        projName.dataset.auditTagged = "true";
                        const ownerName = sessionStorage.getItem('educonta_audit_owner_name') || 'Alumno';
                        
                        const badge = document.createElement('div');
                        badge.className = "text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 rounded-[36px] px-3 py-0.5 mt-1 inline-block uppercase tracking-wider";
                        badge.innerHTML = '<i class="fas fa-user-shield mr-1" aria-hidden="true"></i>';
                        // Nombre del alumno como TEXTO (nunca HTML): evita XSS almacenado en la sesión del admin
                        badge.appendChild(document.createTextNode(` Auditando a: ${ownerName}`));
                        projName.parentNode.insertBefore(badge, projName);
                        
                        projName.setAttribute('contenteditable', 'false');
                        projName.classList.add('cursor-not-allowed');
                    }
                    
                    // Ocultar elementos restringidos
                    const closeBtn = document.getElementById('close-button');
                    if (closeBtn && closeBtn.style.display !== 'none') closeBtn.style.display = 'none';
                    
                    const syncPill = document.getElementById('main-sync-pill');
                    if (syncPill && syncPill.style.display !== 'none') syncPill.style.display = 'none';

                    const themeBtn = document.getElementById('theme-toggle-btn');
                    if (themeBtn && themeBtn.style.display !== 'none') themeBtn.style.display = 'none';

                    const btnProjects = document.getElementById('btn-nav-projects');
                    if (btnProjects && btnProjects.style.display !== 'none') btnProjects.style.display = 'none';

                    const btnVolver = document.getElementById('btn-volver');
                    if (btnVolver && btnVolver.style.display !== 'none') btnVolver.style.setProperty('display', 'none', 'important');
                    
                    // 3. Desactivar todos los inputs, selects y textareas
                    document.querySelectorAll('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)').forEach(el => {
                        const id = el.id || '';
                        if (id !== 'theme-toggle-btn' && !el.closest('#auth-modal') && !el.closest('#profile-modal') && !el.closest('#custom-modal')) {
                            el.disabled = true;
                            el.classList.add('opacity-70', 'cursor-not-allowed', 'bg-slate-50');
                        }
                    });
                    
                    // 4. Bloquear contenteditables
                    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                        el.setAttribute('contenteditable', 'false');
                        el.classList.add('cursor-not-allowed');
                    });
                    
                    // 5. Ocultar botones en una sola consulta
                    document.querySelectorAll(combinedSelectorsToHide).forEach(el => {
                        if (el.style.display !== 'none') {
                            el.style.setProperty('display', 'none', 'important');
                        }
                    });
                } finally {
                    if (auditObserver && document.body) {
                        auditObserver.observe(document.body, { childList: true, subtree: true });
                    }
                }
            }

            enforceAuditLock();
            if (typeof MutationObserver !== 'undefined' && document.body) {
                auditObserver = new MutationObserver(() => {
                    if (!auditRafPending) {
                        auditRafPending = true;
                        requestAnimationFrame(() => {
                            auditRafPending = false;
                            enforceAuditLock();
                        });
                    }
                });
                auditObserver.observe(document.body, { childList: true, subtree: true });
            }
        });
    }
})();

// Global Modal Handlers: Enter key confirm, Escape key to close, and click outside to close
function initGlobalModalHandlers() {
    const MODAL_SELECTOR = '#custom-modal, #project-modal, #auth-modal, #profile-modal, #biometric-prompt-modal, #biometric-password-modal, #import-edc-modal, #confirm-delete-modal, #sheet-modal, #section-config-modal, #terms-modal, #support-modal, #policy-update-modal';

    // 1. Enter and Escape key logic to execute active action
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Check if our custom dropdowns are open first. If so, let them handle Escape themselves
            const emailBox = document.getElementById('email-suggestions-box');
            const asuntoMenu = document.getElementById('asunto-dropdown-menu');
            if ((emailBox && !emailBox.classList.contains('hidden')) || (asuntoMenu && !asuntoMenu.classList.contains('hidden'))) {
                return;
            }

            const openModals = Array.from(document.querySelectorAll(MODAL_SELECTOR))
                .filter(el => {
                    const display = el.style.display;
                    return display === 'flex' || display === 'block' || (window.getComputedStyle(el).display !== 'none');
                });
            if (openModals.length > 0) {
                const activeModal = openModals[openModals.length - 1];
                const closeBtn = activeModal.querySelector('button[onclick*="close"], button.absolute');
                if (closeBtn) {
                    e.preventDefault();
                    closeBtn.click();
                } else {
                    if (activeModal.id === 'support-modal') {
                        if (typeof window.closeSupportModal === 'function') window.closeSupportModal();
                    } else if (activeModal.id === 'custom-modal') {
                        if (typeof window.closeModal === 'function') window.closeModal();
                    } else if (activeModal.id === 'auth-modal') {
                        if (typeof window.closeAuthModal === 'function') window.closeAuthModal();
                    } else if (activeModal.id === 'terms-modal') {
                        if (typeof window.closeTermsModal === 'function') window.closeTermsModal();
                    } else if (activeModal.id === 'profile-modal') {
                        if (typeof window.closeProfileModal === 'function') window.closeProfileModal();
                    } else if (activeModal.id === 'biometric-prompt-modal') {
                        if (typeof window.closeBiometricPrompt === 'function') window.closeBiometricPrompt(false);
                    } else if (activeModal.id === 'biometric-password-modal') {
                        if (typeof window.closeBiometricPasswordModal === 'function') window.closeBiometricPasswordModal(null);
                    } else if (activeModal.id === 'project-modal') {
                        if (typeof window.closeProjectModal === 'function') window.closeProjectModal();
                    } else if (activeModal.id === 'import-edc-modal') {
                        if (typeof window.closeImportEdcModal === 'function') window.closeImportEdcModal();
                    } else if (activeModal.id === 'sheet-modal') {
                        if (typeof window.closeSheetModal === 'function') window.closeSheetModal();
                    } else if (activeModal.id === 'section-config-modal') {
                        if (typeof window.closeSectionConfig === 'function') window.closeSectionConfig();
                    } else if (activeModal.id === 'confirm-delete-modal') {
                        activeModal.style.display = 'none';
                    } else if (activeModal.id === 'policy-update-modal') {
                        // Modal obligatorio: no cerrar con Escape
                        return;
                    }
                }
            }
        }

        if (e.key === 'Enter') {
            if (e.defaultPrevented) return;
            
            // Find all visible modals
            const openModals = Array.from(document.querySelectorAll(MODAL_SELECTOR))
                .filter(el => {
                    const display = el.style.display;
                    return display === 'flex' || display === 'block' || (window.getComputedStyle(el).display !== 'none');
                });
            
            if (openModals.length > 0) {
                const activeEl = document.activeElement;
                if (activeEl) {
                    const tagName = activeEl.tagName;
                    const type = activeEl.type || '';
                    if (tagName === 'TEXTAREA' || tagName === 'BUTTON' || (tagName === 'INPUT' && (type === 'button' || type === 'submit' || type === 'reset'))) {
                        return;
                    }
                }
                
                const activeModal = openModals[openModals.length - 1];
                
                // Locate the confirm / primary submit button
                const confirmBtn = activeModal.querySelector('#modal-confirm-btn, #btn-auth-submit, #btn-profile-submit, #confirm-delete-ok-btn, button[onclick^="save"], button.btn-bloom-sky, button.btn-bloom-indigo, button.btn-bloom-rose, button.bg-sky-500, button.bg-indigo-500, button.bg-rose-500');
                
                if (confirmBtn && !confirmBtn.disabled) {
                    e.preventDefault();
                    confirmBtn.click();
                }
            }
        }
    });

    // 2. Click outside (backdrop wrapper) to close modal
    document.addEventListener('mousedown', (e) => {
        const openModals = Array.from(document.querySelectorAll(MODAL_SELECTOR))
            .filter(el => {
                const display = el.style.display;
                return display === 'flex' || display === 'block' || (window.getComputedStyle(el).display !== 'none');
            });
            
        if (openModals.length > 0) {
            const activeModal = openModals[openModals.length - 1];
            
            // Close only if the user clicked directly on the full-screen backdrop overlay wrapper itself
            if (e.target === activeModal) {
                const closeBtn = activeModal.querySelector('button[onclick*="close"], button.absolute');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    // Fallback closures
                    if (activeModal.id === 'custom-modal') {
                        if (typeof window.closeModal === 'function') window.closeModal();
                    } else if (activeModal.id === 'auth-modal') {
                        if (typeof window.closeAuthModal === 'function') window.closeAuthModal();
                    } else if (activeModal.id === 'terms-modal') {
                        if (typeof window.closeTermsModal === 'function') window.closeTermsModal();
                    } else if (activeModal.id === 'profile-modal') {
                        if (typeof window.closeProfileModal === 'function') window.closeProfileModal();
                    } else if (activeModal.id === 'project-modal') {
                        if (typeof window.closeProjectModal === 'function') window.closeProjectModal();
                    } else if (activeModal.id === 'import-edc-modal') {
                        if (typeof window.closeImportEdcModal === 'function') window.closeImportEdcModal();
                    } else if (activeModal.id === 'sheet-modal') {
                        if (typeof window.closeSheetModal === 'function') window.closeSheetModal();
                    } else if (activeModal.id === 'section-config-modal') {
                        if (typeof window.closeSectionConfig === 'function') window.closeSectionConfig();
                    } else if (activeModal.id === 'support-modal') {
                        if (typeof window.closeSupportModal === 'function') window.closeSupportModal();
                    } else if (activeModal.id === 'confirm-delete-modal') {
                        activeModal.style.display = 'none';
                    } else if (activeModal.id === 'policy-update-modal') {
                        // Modal obligatorio: no cerrar con Escape
                        return;
                    }
                }
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalModalHandlers);
} else {
    initGlobalModalHandlers();
}

// =========================================================================
// === SISTEMA DE PRELOADER Y TEMAS POR MODULO ===
// =========================================================================

window.getModuleTheme = function(urlOrPath) {
    var p = (urlOrPath || window.location.pathname).toLowerCase();
    if (p.includes('documentos') || p.includes('editor-lienzos') || p.includes('editor-diagramas') || p.includes('editor-diapositivas') || p.includes('editor-hojas') || p.includes('editor-textos') || p.includes('editor-documentos')) {
        return 'theme-amber';
    }
    if (p.includes('catalogo')) {
        return 'theme-indigo';
    }
    if (p.includes('biblioteca') || p.includes('visor-ley') || p.includes('editor-finanzas') || p.includes('educonvert')) {
        return 'theme-emerald';
    }
    if (p.includes('admin')) {
        return 'theme-purple';
    }
    return 'theme-sky';
};

window.getModuleEnv = function(urlOrPath) {
    var p = (urlOrPath || window.location.pathname).toLowerCase();
    if (p.includes('admin')) {
        return 'admin';
    }
    if (p.includes('documentos') || p.includes('editor-lienzos') || p.includes('editor-diagramas') || p.includes('editor-diapositivas') || p.includes('editor-hojas') || p.includes('editor-textos') || p.includes('editor-documentos')) {
        return 'documentos';
    }
    if (p.includes('catalogo')) {
        return 'catalogo';
    }
    if (p.includes('biblioteca') || p.includes('visor-ley') || p.includes('editor-finanzas')) {
        return 'biblioteca';
    }
    return 'proyectos';
};

// Auto-asignación inmediata de data-env en :root
(function() {
    try {
        if (!document.documentElement.hasAttribute('data-env')) {
            document.documentElement.setAttribute('data-env', window.getModuleEnv());
        }
    } catch(e) {}
})();

// Ajuste dinámico de métricas del logo una vez cargada la fuente web Plus Jakarta Sans
window.updateEduContaLogoLayout = function() {
    try {
        var svg = document.getElementById('text-svg');
        var g = document.getElementById('chars');
        if (!svg || !g) return;
        var LETTERS = [
            ['E', 800, 'e'], ['d', 800, 'd'], ['u', 800, 'u'],
            ['C', 300, 'c'], ['o', 300, 'o'], ['n', 300, 'n'],
            ['t', 300, 't'], ['a', 300, 'a'],
            ['S', 800, 's'], ['V', 800, 'v']
        ];
        var NS = 'http://www.w3.org/2000/svg';
        var FONT = "'Plus Jakarta Sans', sans-serif", SIZE = 78, GAP = -1.5;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        var x = 0;
        var pos = LETTERS.map(function(item) {
            ctx.font = item[1] + ' ' + SIZE + 'px ' + FONT;
            var adv = ctx.measureText(item[0]).width;
            var o = { x: x, adv: adv };
            x += adv + GAP;
            return o;
        });
        var total = x - GAP;
        svg.setAttribute('viewBox', '0 0 ' + Math.ceil(total + 2) + ' 100');
        g.innerHTML = '';
        var sg = document.createElementNS(NS, 'g');
        sg.setAttribute('class', 'glow-g');
        g.appendChild(sg);
        ['char-stroke', 'char-fill'].forEach(function(layer) {
            LETTERS.forEach(function(item, i) {
                var ch = item[0], w = item[1], k = item[2];
                var t = document.createElementNS(NS, 'text');
                t.setAttribute('x', pos[i].x);
                t.setAttribute('y', 75);
                t.setAttribute('font-weight', w);
                t.style.color = (k === 's' || k === 'v') ? 'var(--celeste-sv)' : 'var(--azul-corporativo)';
                t.setAttribute('class', layer + ' d-' + k + (layer === 'char-fill' ? '-f' : ''));
                t.textContent = ch;
                ((k === 's' || k === 'v') ? sg : g).appendChild(t);
            });
        });
    } catch(err) {
        console.warn('EduConta Logo layout update skipped:', err);
    }
};

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
        if (window.updateEduContaLogoLayout) {
            window.updateEduContaLogoLayout();
        }
    }).catch(function() {});
}

window._educontaPreloaderStartTime = window._educontaPreloaderStartTime || Date.now();
window._educontaPreloaderDismissed = false;
window._educontaPreloaderDismissing = false;

window.dismissGlobalPreloader = function(forceImmediate) {
    if (window._educontaPreloaderDismissed || window._educontaPreloaderDismissing) {
        return;
    }
    var preloader = document.getElementById('global-preloader');
    if (!preloader) {
        window._educontaPreloaderDismissed = true;
        return;
    }

    // Duración mínima de 120ms para una respuesta instantánea y fluida
    var MIN_DURATION = 120;
    var now = Date.now();
    var elapsed = now - (window._educontaPreloaderStartTime || now);
    var remainingDelay = (forceImmediate === true) ? 0 : Math.max(0, MIN_DURATION - elapsed);

    window._educontaPreloaderDismissing = true;

    setTimeout(function() {
        var p = document.getElementById('global-preloader');
        if (!p) {
            window._educontaPreloaderDismissed = true;
            window._educontaPreloaderDismissing = false;
            return;
        }
        p.classList.add('is-hidden');
        p.classList.add('loaded');
        p.setAttribute('aria-hidden', 'true');
        setTimeout(function() {
            if (p) {
                p.style.display = 'none';
                if (p.parentNode) p.remove();
            }
            window._educontaPreloaderDismissed = true;
            window._educontaPreloaderDismissing = false;
        }, 320);
    }, remainingDelay);
};

window.initPreloaderSystem = function() {
    window._educontaPreloaderStartTime = window._educontaPreloaderStartTime || Date.now();
    var currentTheme = window.getModuleTheme();
    var currentPreloader = document.getElementById('global-preloader');
    if (currentPreloader && !currentPreloader.classList.contains(currentTheme)) {
        currentPreloader.classList.remove('theme-sky', 'theme-amber', 'theme-indigo', 'theme-emerald', 'theme-purple');
        currentPreloader.classList.add(currentTheme);
    }
    
    var path = (window.location.pathname || '').toLowerCase();
    // Páginas con carga asíncrona pesada (editores, panel de administración y herramientas avanzadas)
    var isComplexPage = window.pageControlsPreloader ||
                        path.includes('editor-') ||
                        path.includes('admin') ||
                        path.includes('educonvert');

    if (!isComplexPage) {
        // En páginas estándar, descartar en DOMContentLoaded de inmediato
        var triggerDismiss = function() {
            window.dismissGlobalPreloader();
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            triggerDismiss();
        } else {
            document.addEventListener('DOMContentLoaded', triggerDismiss, { once: true });
        }
    }
    
    // Watchdog de seguridad robusto: máximo 2500ms
    setTimeout(function() {
        window.dismissGlobalPreloader(true);
    }, 2500);
};

window.initPreloaderSystem();
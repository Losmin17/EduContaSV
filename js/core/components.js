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
            confirmBtn.classList.remove('bg-rose-600', 'hover:bg-rose-700');
            confirmBtn.classList.add('bg-sky-500', 'hover:bg-sky-600');
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

window.injectSharedUI = function(containerId) {
    const container = document.getElementById(containerId) || document.body;
    
    const uiHTML = `
<header class="main-header no-print">
        <div class="flex items-center gap-3 cursor-pointer" onclick="window.location.href='index.html'">
            <!-- Parte 1: Gráfica de Barras -->
            <svg class="icon-svg" width="42" height="42" viewBox="0 0 100 100" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="0" />
                    </filter>
                </defs>
                <rect class="base-line" x="10" y="78" width="80" height="5" rx="1" fill="#0f172a" />
                <rect class="bar bar-1" x="22" y="58" width="13" height="20" rx="1" fill="#1e293b" />
                <rect class="bar bar-2" x="40" y="42" width="13" height="36" rx="1" fill="#334155" />
                <rect class="bar bar-3" x="58" y="22" width="13" height="56" rx="1" fill="var(--celeste-sv)" />
            </svg>

            <!-- Parte 2: Texto EduConta SV -->
            <svg class="text-svg" viewBox="0 0 500 100" xmlns="http://www.w3.org/2000/svg">
                <g font-family="'Plus Jakarta Sans', sans-serif" font-size="78">
                    <!-- Capa de Trazo (Stroke) -->
                    <text x="0" y="75" color="var(--azul-corporativo)" font-weight="800"
                        class="char-stroke d-e">E</text>
                    <text x="50" y="75" color="var(--azul-corporativo)" font-weight="800"
                        class="char-stroke d-d">d</text>
                    <text x="95" y="75" color="var(--azul-corporativo)" font-weight="800"
                        class="char-stroke d-u">u</text>
                    <text x="150" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-stroke d-c">C</text>
                    <text x="205" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-stroke d-o">o</text>
                    <text x="250" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-stroke d-n">n</text>
                    <text x="295" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-stroke d-t">t</text>
                    <text x="325" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-stroke d-a">a</text>
                    <text x="385" y="75" color="var(--celeste-sv)" font-weight="800" class="char-stroke d-s">S</text>
                    <text x="440" y="75" color="var(--celeste-sv)" font-weight="800" class="char-stroke d-v">V</text>

                    <!-- Capa de Relleno (Fill) -->
                    <text x="0" y="75" color="var(--azul-corporativo)" font-weight="800"
                        class="char-fill d-e-f">E</text>
                    <text x="50" y="75" color="var(--azul-corporativo)" font-weight="800"
                        class="char-fill d-d-f">d</text>
                    <text x="95" y="75" color="var(--azul-corporativo)" font-weight="800"
                        class="char-fill d-u-f">u</text>
                    <text x="150" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-fill d-c-f">C</text>
                    <text x="205" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-fill d-o-f">o</text>
                    <text x="250" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-fill d-n-f">n</text>
                    <text x="295" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-fill d-t-f">t</text>
                    <text x="325" y="75" color="var(--azul-corporativo)" font-weight="500"
                        class="char-fill d-a-f">a</text>
                    <text x="385" y="75" color="var(--celeste-sv)" font-weight="800" class="char-fill d-s-f">S</text>
                    <text x="440" y="75" color="var(--celeste-sv)" font-weight="800" class="char-fill d-v-f">V</text>
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

            <div class="relative w-full max-w-sm">
                <i class="fas fa-search absolute left-3 top-2.5 text-slate-400 text-sm"></i>
                <input type="text" id="master-search"
                    class="w-full bg-slate-800 border-none rounded-[36px] pl-9 pr-4 py-2 text-xs md:text-sm text-white focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-500 transition-all"
                    placeholder="Filtrar archivos o ID..." oninput="renderMasterUserList()">
            </div>

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
                <button id="btn-nav-projects" onclick="window.location.href='proyectos.html'"
                    class="hidden text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                    <i class="fas fa-briefcase mr-0 sm:mr-2"></i> <span class="hidden sm:inline">Mis Proyectos</span>
                </button>
                <button id="btn-volver" onclick="window.location.href='index.html'"
                    class="hidden text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                    <i class="fas fa-chevron-left mr-0 sm:mr-2"></i> <span class="hidden sm:inline">Inicio</span>
                </button>
            </div>
    </header>
<div id="custom-modal">
        <div class="glass-modal max-w-sm w-full mx-4">
            <h4 id="modal-title" class="text-xl font-bold text-slate-900 mb-2">Confirmación</h4>
            <p id="modal-msg" class="text-slate-500 text-sm mb-6"></p>
            <div id="modal-password-container" class="hidden mb-6">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contraseña de
                    Administrador</label>
                <input type="password" id="modal-password-input"
                    class="w-full bg-slate-50 border border-slate-200 rounded-[36px] px-4 py-3 text-sm text-slate-700 font-bold focus:border-sky-400 focus:bg-white outline-none transition-all"
                    placeholder="••••••••">
            </div>
            <div class="flex gap-3">
                <button id="modal-cancel-btn" onclick="closeModal()"
                    class="flex-1 px-4 py-3 rounded-[36px] bg-slate-100 text-slate-600 font-bold text-xs uppercase hover:bg-slate-200">Cancelar</button>
                <button id="modal-confirm-btn"
                    class="flex-1 px-4 py-3 rounded-[36px] bg-rose-500 text-white font-bold text-xs uppercase shadow-lg hover:bg-rose-600">Confirmar</button>
            </div>
        </div>
    </div>
</div>

<div id="auth-modal" style="display: none;">

        <div class="glass-modal w-full max-w-[420px] mx-4">
            <!-- Icono Neomórfico superior (Parecido al Hexagono del ejemplo 3) -->
            <div class="mx-auto w-20 h-20 rounded-[36px] bg-white mb-8 flex items-center justify-center"
                style="box-shadow: -8px -8px 16px rgba(255,255,255,0.9), 8px 8px 16px rgba(15, 23, 42, 0.06); transform: translateY(-10px);">
                <i class="fas fa-fingerprint text-3xl text-slate-700"></i>
            </div>

            <button onclick="closeAuthModal()"
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 focus:outline-none transition-transform hover:rotate-90"><i
                    class="fas fa-times"></i></button>
            <h4 id="auth-modal-title" class="text-2xl font-black text-slate-800 tracking-tight mb-8 text-center"
                style="text-shadow: 1px 1px 0px rgba(255,255,255,1);">Bienvenido</h4>

            <div id="auth-error-msg"
                class="hidden mb-4 p-4 bg-rose-50/80 border-none rounded-[36px] text-rose-600 text-xs font-bold shadow-[inset_2px_2px_5px_rgba(225,29,72,0.1)]">
            </div>
            <div id="auth-success-msg"
                class="hidden mb-4 p-4 bg-emerald-50/80 border-none rounded-[36px] text-emerald-600 text-xs font-bold shadow-[inset_2px_2px_5px_rgba(16,185,129,0.1)]">
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

                <div class="mt-8 flex flex-col gap-4">
                    <button type="submit" id="btn-auth-submit"
                        class="w-full px-6 py-4 rounded-[36px] bg-sky-500 text-white font-black text-[13px] uppercase tracking-wide transition-all shadow-lg shadow-sky-100 hover:bg-sky-600">
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
<div id="profile-modal" style="display: none;">

        <div class="glass-modal w-full max-w-[420px] mx-4">
            <button onclick="closeProfileModal()"
                class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 focus:outline-none transition-transform hover:rotate-90"><i
                    class="fas fa-times"></i></button>

            <div class="mx-auto w-16 h-16 rounded-[36px] bg-white mb-6 flex items-center justify-center text-sky-500"
                style="box-shadow: -8px -8px 16px rgba(255,255,255,0.9), 8px 8px 16px rgba(15, 23, 42, 0.06);">
                <i class="fas fa-user-circle text-3xl"></i>
            </div>

            <h4 class="text-2xl font-black text-slate-800 tracking-tight mb-8 text-center"
                style="text-shadow: 1px 1px 0px rgba(255,255,255,1);">Mi Perfil</h4>

            <div id="profile-error-msg"
                class="hidden mb-4 p-4 bg-rose-50/80 border-none rounded-[36px] text-rose-600 text-xs font-bold shadow-[inset_2px_2px_5px_rgba(225,29,72,0.1)]">
            </div>
            <div id="profile-success-msg"
                class="hidden mb-4 p-4 bg-emerald-50/80 border-none rounded-[36px] text-emerald-600 text-xs font-bold shadow-[inset_2px_2px_5px_rgba(16,185,129,0.1)]">
            </div>

            <form id="form-profile" class="space-y-4">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre
                        Completo</label>
                    <input type="text" id="profile-name"
                        class="w-full bg-slate-50 border border-slate-200 rounded-[36px] px-4 py-3 text-sm text-slate-700 font-bold focus:border-sky-400 focus:bg-white outline-none transition-all"
                        placeholder="Tu nombre completo">
                </div>

                <div class="flex gap-3 mt-8">
                    <button type="button" onclick="closeProfileModal()"
                        class="flex-1 px-4 py-3 rounded-[36px] bg-slate-100 text-slate-500 font-bold text-xs uppercase hover:bg-slate-200 transition-colors">Volver</button>
                    <button type="submit" id="btn-profile-submit"
                        class="flex-3 px-4 py-3 rounded-[36px] bg-sky-500 text-white font-bold text-xs uppercase shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all flex justify-center items-center">
                        <span>Guardar</span>
                    </button>
                </div>
            </form>

            <hr class="my-6 border-slate-100">
            <div id="profile-admin-container" class="mb-3"></div>
            <button type="button" onclick="logout()"
                class="w-full px-4 py-3 rounded-[36px] bg-rose-50 text-rose-500 font-bold text-xs uppercase hover:bg-rose-100/50 transition-all border border-rose-100/50">
                <i class="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión
            </button>
        </div>
    </div>
<div id="sync-toast"
        class="fixed bottom-6 right-6 transform translate-y-32 opacity-0 transition-all duration-500 z-[10000] flex items-center gap-3 bg-emerald-600 border border-emerald-500 text-white px-5 py-4 rounded-[36px] shadow-2xl pointer-events-none no-print">
        <i class="fas fa-check-circle text-2xl"></i>
        <div>
            <h4 class="font-black text-sm">Sincronización Exitosa</h4>
            <p class="text-[11px] font-medium text-emerald-100 uppercase tracking-widest mt-0.5">Proyectos respaldados
            </p>
        </div>
    </div>
`;

    if (document.getElementById(containerId)) {
        container.innerHTML = uiHTML;
    } else {
        container.insertAdjacentHTML('afterbegin', uiHTML);
    }
    
    if (typeof window.initAuthEvents === 'function') {
        window.initAuthEvents();
    }
};
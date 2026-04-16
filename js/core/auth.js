let isLoginMode = true;

window.openAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
    }
};

window.openProfileModal = function() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeProfileModal = function() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
    }
};

window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    const nameContainer = document.getElementById('auth-name-container');
    const submitBtn = document.getElementById('btn-auth-submit');
    const toggleBtn = document.getElementById('btn-auth-toggle');
    const title = document.getElementById('auth-modal-title');
    const forgotPwd = document.getElementById('auth-forgot-pwd-container');

    if (isLoginMode) {
        if(nameContainer) nameContainer.classList.add('hidden');
        if(submitBtn) submitBtn.innerText = 'Iniciar Sesión';
        if(toggleBtn) toggleBtn.innerHTML = '¿No tienes cuenta? <span class="text-sky-500">Regístrate</span>';
        if(title) title.innerText = 'Bienvenido';
        if(forgotPwd) forgotPwd.classList.remove('hidden');
    } else {
        if(nameContainer) nameContainer.classList.remove('hidden');
        if(submitBtn) submitBtn.innerText = 'Registrarse';
        if(toggleBtn) toggleBtn.innerHTML = '¿Ya tienes cuenta? <span class="text-sky-500">Inicia Sesión</span>';
        if(title) title.innerText = 'Crea tu Cuenta';
        if(forgotPwd) forgotPwd.classList.add('hidden');
    }
};

window.togglePasswordVisibility = function(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

window.handleAuthSubmit = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const nameEl = document.getElementById('auth-name');
    const name = nameEl ? nameEl.value.trim() : '';
    
    const errorMsg = document.getElementById('auth-error-msg');
    const successMsg = document.getElementById('auth-success-msg');
    const submitBtn = document.getElementById('btn-auth-submit');
    
    if (errorMsg) errorMsg.classList.add('hidden');
    if (successMsg) successMsg.classList.add('hidden');

    if (!email || !password) {
        if (errorMsg) {
            errorMsg.innerText = "Correo y contraseña requeridos.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    }

    try {
        if (isLoginMode) {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (successMsg) {
                successMsg.innerText = "Sesión iniciada correctamente.";
                successMsg.classList.remove('hidden');
            }
            setTimeout(() => {
                closeAuthModal();
                checkUserStatus(data.session);
            }, 1000);
        } else {
            if (!name) throw new Error("Debes proporcionar tu nombre para el registro.");
            const { data, error } = await window.supabaseClient.auth.signUp({ 
                email, 
                password,
                options: { data: { full_name: name, name: name } }
            });
            if (error) throw error;
            if (successMsg) {
                successMsg.innerText = "Registro exitoso. Revisa tu bandeja de entrada o inicia sesión para continuar.";
                successMsg.classList.remove('hidden');
            }
            setTimeout(() => {
                toggleAuthMode();
            }, 1500);
        }
    } catch (err) {
        if (errorMsg) {
            errorMsg.innerText = err.message;
            errorMsg.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = isLoginMode ? 'Iniciar Sesión' : 'Registrarse';
        }
    }
};

window.handleRecoverPassword = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const errorMsg = document.getElementById('auth-error-msg');
    const successMsg = document.getElementById('auth-success-msg');
    
    if (errorMsg) errorMsg.classList.add('hidden');
    if (successMsg) successMsg.classList.add('hidden');

    if(!email) {
        if(errorMsg) {
            errorMsg.innerText = "Ingresa tu correo en el campo correspondiente para recuperar la clave.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }
    
    try {
         const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
         if(error) throw error;
         if(successMsg) {
             successMsg.innerText = "Correo de recuperación enviado exitosamente.";
             successMsg.classList.remove('hidden');
         }
    } catch (err) {
         if(errorMsg) {
             errorMsg.innerText = err.message;
             errorMsg.classList.remove('hidden');
         }
    }
};

window.logout = async function() {
    if(window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    localStorage.removeItem('educonta_last_project_id');
    window.location.href = 'index.html'; 
};

window.checkUserStatus = async function(sessionProvided) {
    let session = sessionProvided;
    if (!session && window.supabaseClient) {
        const { data } = await window.supabaseClient.auth.getSession();
        session = data?.session;
    }
    
    const loginHeader = document.getElementById('btn-login-header');
    const loginMobile = document.getElementById('btn-login-header-mobile');
    const userInfo = document.getElementById('user-info-header');
    const emailDisplay = document.getElementById('user-email-display');
    const navProjects = document.getElementById('btn-nav-projects');
    const headerAdminControls = document.getElementById('header-admin-controls');

    if (session) {
        if(loginHeader) {
            loginHeader.classList.add('hidden');
            loginHeader.classList.remove('md:block');
        }
        if(loginMobile) loginMobile.classList.add('hidden');
        if(userInfo) {
            userInfo.style.display = 'flex';
            userInfo.classList.remove('hidden');
        }
        if(emailDisplay) {
            let name = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
            emailDisplay.innerText = name ? name : session.user.email.split('@')[0];
        }
        
        const adminContainer = document.getElementById('profile-admin-container');
        if (adminContainer) {
            let btnMaster = document.getElementById('btn-master-office');
            if (session.user.email.toLowerCase() === window.ADMIN_EMAIL.toLowerCase()) {
                if (!btnMaster) {
                    btnMaster = document.createElement('button');
                    btnMaster.id = 'btn-master-office';
                    btnMaster.className = 'w-full px-4 py-3 rounded-[36px] bg-[#6366f1] text-white font-bold text-xs uppercase hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-100 mb-3';
                    btnMaster.title = 'Gestión Maestra Global';
                    btnMaster.innerHTML = '<i class="fas fa-rocket mr-2"></i> Panel de Administrador';
                    btnMaster.type = 'button';
                    btnMaster.onclick = () => { 
                        if(typeof window.closeProfileModal === 'function') window.closeProfileModal(); 
                        window.location.href = 'admin.html'; 
                    };
                    adminContainer.appendChild(btnMaster);
                }
                btnMaster.style.display = 'block';
            } else if (btnMaster) {
                btnMaster.style.display = 'none';
            }
        }

        if(navProjects) {
            if (window.location.href.includes('index.html') || window.location.pathname.endsWith('/') || window.location.href.includes('proyectos.html') || window.location.href.includes('biblioteca.html') || window.location.href.includes('catalogo.html')) {
                navProjects.classList.add('hidden');
                navProjects.classList.remove('inline-flex');
            } else {
                navProjects.classList.remove('hidden');
                navProjects.classList.add('inline-flex');
            }
        }

        if (session.user.email === window.ADMIN_EMAIL && headerAdminControls && window.location.href.includes('admin.html')) {
            headerAdminControls.classList.remove('hidden');
            headerAdminControls.classList.add('flex');
            document.querySelector('.main-header')?.classList.add('admin-mode');
        }
    } else {
        if(loginHeader) {
            loginHeader.classList.remove('hidden');
            loginHeader.classList.add('md:block');
        }
        if(loginMobile) loginMobile.classList.remove('hidden');
        if(userInfo) {
            userInfo.style.display = 'none';
            userInfo.classList.add('hidden');
        }
        if(navProjects) navProjects.classList.add('hidden');
        if(headerAdminControls) headerAdminControls.classList.add('hidden');
        document.querySelector('.main-header')?.classList.remove('admin-mode');
    }
};

// ---------------------------------------------------------
// REGLA CRÍTICA MPA: Init de Eventos aplazado
// Llama esto estrictamente después de inyectar el Header
// ---------------------------------------------------------
window.initAuthEvents = function() {
    const authName = document.getElementById('auth-name');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    if (authName) authName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if(authEmail) authEmail.focus(); } });
    if (authEmail) authEmail.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if(authPassword) authPassword.focus(); } });
    if (authPassword) authPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAuthSubmit(); } });
    
    const authForm = document.getElementById('form-auth');
    if (authForm) { 
        authForm.addEventListener('submit', (e) => { 
            e.preventDefault(); 
            handleAuthSubmit(); 
        }); 
    }

    if(window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => { 
            checkUserStatus(session); 
        });
    }

    checkUserStatus(null);
};

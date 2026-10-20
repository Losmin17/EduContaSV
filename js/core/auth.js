let isLoginMode = true;

// =========================================================================
// MÓDULO DE AUTENTICACIÓN BIOMÉTRICA (WebAuthn / Passkeys / FIDO2)
// Compatible con Touch ID, Face ID, Windows Hello y Huella Android
// =========================================================================

// Conversiones seguras Base64URL <-> ArrayBuffer
function bufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64UrlToBuffer(base64url) {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Funciones criptográficas WebCrypto (AES-GCM 256-bit) protegidas por WebAuthn
async function getBioVaultKey(salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(salt + window.location.origin),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("educonta-vault-salt-sv"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptBioData(text, salt) {
    const key = await getBioVaultKey(salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(text)
    );
    return {
        iv: bufferToBase64Url(iv.buffer),
        data: bufferToBase64Url(cipherBuffer)
    };
}

async function decryptBioData(encryptedObj, salt) {
    if (!encryptedObj || !encryptedObj.iv || !encryptedObj.data) return null;
    const key = await getBioVaultKey(salt);
    const iv = base64UrlToBuffer(encryptedObj.iv);
    const cipherData = base64UrlToBuffer(encryptedObj.data);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        key,
        cipherData
    );
    return new TextDecoder().decode(decryptedBuffer);
}

// 1. Detección de soporte de hardware biométrico y contexto seguro (HTTPS / localhost)
window.isBiometricSupported = async function() {
    try {
        if (!window.isSecureContext) return false;

        // WebAuthn exige estrictamente HTTPS o localhost (bloquea IPs como 127.0.0.1 o red local en HTTP)
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');
        const isHttps = window.location.protocol === 'https:';
        if (!isHttps && !isLocalhost) {
            return false;
        }

        if (!window.PublicKeyCredential) return false;
        if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
            return false;
        }
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return !!available;
    } catch (e) {
        console.warn("Error comprobando disponibilidad biométrica:", e);
        return false;
    }
};

// 2. Obtención de credenciales de la bóveda local del equipo
window.getStoredBiometricCredential = function() {
    try {
        const raw = localStorage.getItem('educonta_biometric_vault');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error("Error leyendo bóveda biométrica:", e);
        return null;
    }
};

window.hasStoredBiometricCredential = function() {
    return !!window.getStoredBiometricCredential();
};

// 3. Renderizado y chequeo en el modal de login
window.checkAndRenderBiometricLogin = async function() {
    const bioContainer = document.getElementById('biometric-login-container');
    const userHint = document.getElementById('biometric-user-hint');
    if (!bioContainer) return;

    if (!isLoginMode) {
        bioContainer.classList.add('hidden');
        return;
    }

    const vault = window.getStoredBiometricCredential();
    const isSupported = await window.isBiometricSupported();

    if (vault && isSupported) {
        bioContainer.classList.remove('hidden');
        if (userHint) {
            userHint.textContent = vault.userName || vault.userEmail || "Equipo verificado";
        }
        const emailInput = document.getElementById('auth-email');
        if (emailInput && !emailInput.value && vault.userEmail) {
            emailInput.value = vault.userEmail;
        }
    } else {
        bioContainer.classList.add('hidden');
    }
};

// 4. Inicio de sesión biométrico (Touch ID / Face ID / Windows Hello)
window.handleBiometricLogin = async function() {
    const vault = window.getStoredBiometricCredential();
    const errorMsg = document.getElementById('auth-error-msg');
    const successMsg = document.getElementById('auth-success-msg');
    const btnBio = document.getElementById('btn-biometric-login');

    if (errorMsg) errorMsg.classList.add('hidden');
    if (successMsg) successMsg.classList.add('hidden');

    if (!vault || !vault.credentialId || !vault.refreshToken) {
        if (errorMsg) {
            errorMsg.innerText = "No se encontró credencial biométrica vinculada en este equipo.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    const isSupported = await window.isBiometricSupported();
    if (!isSupported) {
        if (errorMsg) {
            errorMsg.innerText = "El sensor biométrico no está disponible o la conexión no es segura (requiere HTTPS).";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    const originalBtnHTML = btnBio ? btnBio.innerHTML : '';
    if (btnBio) {
        btnBio.disabled = true;
        btnBio.innerHTML = `
            <div class="flex items-center gap-3 w-full justify-center py-1">
                <i class="fas fa-spinner fa-spin text-sky-400 text-lg"></i>
                <span class="text-xs font-bold text-sky-200">Verificando huella o rostro...</span>
            </div>
        `;
    }

    try {
        // Desafío criptográfico local de 32 bytes
        const challenge = window.crypto.getRandomValues(new Uint8Array(32));
        const credIdBuffer = base64UrlToBuffer(vault.credentialId);

        // Solicitar validación nativa al chip de seguridad físico
        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: challenge,
                rpId: window.location.hostname,
                userVerification: "preferred",
                allowCredentials: [{
                    id: credIdBuffer,
                    type: 'public-key',
                    transports: (vault.transports && vault.transports.length > 0) ? vault.transports : ['internal', 'hybrid']
                }],
                timeout: 60000
            }
        });

        if (!assertion) {
            throw new Error("No se recibió respuesta del autenticador biométrico.");
        }

        // Validación y reactivación de sesión con Supabase Auth
        if (!window.supabaseClient) {
            throw new Error("El cliente de autenticación no está disponible.");
        }

        let sessionActive = null;

        // Estrategia A: Reingreso directo con credenciales cifradas localmente por hardware (WebCrypto AES-GCM)
        if (vault.encryptedCreds && vault.userEmail) {
            try {
                const decryptedPwd = await decryptBioData(vault.encryptedCreds, vault.credentialId);
                if (decryptedPwd) {
                    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                        email: vault.userEmail,
                        password: decryptedPwd
                    });
                    if (!error && data?.session) {
                        sessionActive = data.session;
                    }
                }
            } catch (decErr) {
                console.warn("Reingreso por credencial cifrada falló, intentando tokens:", decErr);
            }
        }

        // Estrategia B: Restaurar sesión con setSession (access_token + refresh_token)
        if (!sessionActive && vault.refreshToken) {
            try {
                const { data } = await window.supabaseClient.auth.setSession({
                    access_token: vault.accessToken || '',
                    refresh_token: vault.refreshToken
                });
                if (data?.session) {
                    sessionActive = data.session;
                }
            } catch (setErr) {
                console.warn("setSession falló, intentando refreshSession:", setErr);
            }
        }

        // Estrategia C: Renovación con refreshSession
        if (!sessionActive && vault.refreshToken) {
            const { data, error } = await window.supabaseClient.auth.refreshSession({
                refresh_token: vault.refreshToken
            });
            if (data?.session) {
                sessionActive = data.session;
            } else if (error) {
                console.warn("refreshSession error:", error);
            }
        }

        if (!sessionActive) {
            const pwdInput = document.getElementById('auth-password');
            if (pwdInput) {
                setTimeout(() => pwdInput.focus(), 300);
            }
            throw new Error("Para sincronizar tu acceso biométrico en este equipo, ingresa tu contraseña abajo e inicia sesión una única vez.");
        }

        // Actualizar el token rotado en la bóveda local
        vault.accessToken = sessionActive.access_token;
        vault.refreshToken = sessionActive.refresh_token;
        vault.updatedAt = new Date().toISOString();
        localStorage.setItem('educonta_biometric_vault', JSON.stringify(vault));

        if (successMsg) {
            successMsg.innerText = `¡Identidad confirmada! Bienvenido, ${vault.userName || vault.userEmail}.`;
            successMsg.classList.remove('hidden');
        }

        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('biometric', `Bienvenido, ${vault.userName || vault.userEmail}`);
        }

        setTimeout(() => {
            closeAuthModal();
            checkUserStatus(sessionActive);
        }, 800);

    } catch (err) {
        console.warn("Error en autenticación biométrica:", err);
        let msg = err.message || "Error al verificar identidad";
        if (err.name === 'NotAllowedError') {
            msg = "Acceso biométrico cancelado o tiempo agotado. Puedes usar tu contraseña.";
        } else if (err.name === 'SecurityError' || msg.includes('HTTPS origins') || msg.includes('localhost')) {
            msg = "WebAuthn requiere conexión HTTPS o acceder mediante 'http://localhost'.";
        }
        if (errorMsg) {
            errorMsg.innerText = msg;
            errorMsg.classList.remove('hidden');
        }
    } finally {
        if (btnBio) {
            btnBio.disabled = false;
            btnBio.innerHTML = originalBtnHTML;
        }
    }
};

// 5. Controlador para el Modal Glassmorphic de Confirmación de Contraseña
let biometricPasswordResolve = null;

window.promptBiometricPasswordModal = function() {
    return new Promise((resolve) => {
        biometricPasswordResolve = resolve;
        const modal = document.getElementById('biometric-password-modal');
        const input = document.getElementById('biometric-confirm-pwd');
        const errorMsg = document.getElementById('biometric-pwd-error-msg');
        const submitBtn = document.getElementById('btn-biometric-pwd-submit');
        if (errorMsg) errorMsg.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle text-sm"></i> <span>Confirmar y Activar</span>';
        }
        if (input) {
            input.value = '';
        }
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                if (input) input.focus();
            }, 100);
        } else {
            resolve(null);
        }
    });
};

window.closeBiometricPasswordModal = function(passwordValue = null) {
    const modal = document.getElementById('biometric-password-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 200);
    }
    if (typeof biometricPasswordResolve === 'function') {
        biometricPasswordResolve(passwordValue);
        biometricPasswordResolve = null;
    }
};

window.submitBiometricPasswordModal = async function() {
    const input = document.getElementById('biometric-confirm-pwd');
    const pwd = input ? input.value : '';
    const errorMsg = document.getElementById('biometric-pwd-error-msg');
    const submitBtn = document.getElementById('btn-biometric-pwd-submit');

    if (!pwd || !pwd.trim()) {
        if (errorMsg) {
            errorMsg.textContent = "Por favor ingresa tu contraseña.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i> <span>Verificando...</span>';
    }

    try {
        if (window.supabaseClient) {
            const { data: sessionData } = await window.supabaseClient.auth.getSession();
            const userEmail = sessionData?.session?.user?.email;
            if (userEmail) {
                const { error: verifyError } = await window.supabaseClient.auth.signInWithPassword({
                    email: userEmail,
                    password: pwd.trim()
                });
                if (verifyError) {
                    if (errorMsg) {
                        errorMsg.textContent = "Contraseña incorrecta. Por favor verifícala.";
                        errorMsg.classList.remove('hidden');
                    }
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-check-circle text-sm"></i> <span>Confirmar y Activar</span>';
                    }
                    return;
                }
            }
        }
    } catch(e) {
        console.warn("No se pudo pre-validar contraseña con Supabase:", e);
    }

    closeBiometricPasswordModal(pwd.trim());
};

// 6. Enrolamiento o vinculación biométrica del dispositivo
window.enrollBiometricCredential = async function() {
    const errorMsg = document.getElementById('profile-error-msg');
    const successMsg = document.getElementById('profile-success-msg');
    const btnEnable = document.getElementById('btn-enable-biometrics');

    if (errorMsg) errorMsg.classList.add('hidden');
    if (successMsg) successMsg.classList.add('hidden');

    if (!window.supabaseClient) {
        alert("Cliente de Supabase no inicializado.");
        return;
    }

    const { data } = await window.supabaseClient.auth.getSession();
    const session = data?.session;
    if (!session) {
        alert("Debes tener una sesión activa para vincular tus datos biométricos.");
        return;
    }

    const isSupported = await window.isBiometricSupported();
    if (!isSupported) {
        alert("Este equipo o navegador no posee un sensor biométrico compatible (Windows Hello, Touch ID, Face ID) o la conexión no es HTTPS.");
        return;
    }

    // Modal Glassmorphic para confirmar contraseña antes del enrolamiento
    const userPassword = await window.promptBiometricPasswordModal();
    if (!userPassword) {
        return;
    }

    const originalBtnText = btnEnable ? btnEnable.innerHTML : '';
    if (btnEnable) {
        btnEnable.disabled = true;
        btnEnable.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Registrando sensor...';
    }

    try {
        const userEmail = session.user.email;
        const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail;
        const userIdBuffer = new TextEncoder().encode(session.user.id);
        const challenge = window.crypto.getRandomValues(new Uint8Array(32));

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: challenge,
                rp: {
                    name: "EduConta SV",
                    id: window.location.hostname
                },
                user: {
                    id: userIdBuffer,
                    name: userEmail,
                    displayName: userName
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" },  // ES256
                    { alg: -257, type: "public-key" } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "preferred",
                    residentKey: "preferred"
                },
                timeout: 60000,
                attestation: "none"
            }
        });

        if (!credential) {
            throw new Error("No se pudo generar la credencial de autenticación biométrica.");
        }

        const credId = bufferToBase64Url(credential.rawId);
        let transports = ['internal', 'hybrid'];
        if (credential.response && typeof credential.response.getTransports === 'function') {
            try { transports = credential.response.getTransports(); } catch(e){}
        }

        let encryptedCreds = null;
        if (userPassword && userPassword.trim()) {
            try {
                encryptedCreds = await encryptBioData(userPassword.trim(), credId);
            } catch(e) {
                console.warn("No se pudo cifrar credencial en enrolamiento:", e);
            }
        }

        const vault = {
            credentialId: credId,
            userId: session.user.id,
            userEmail: userEmail,
            userName: userName,
            transports: transports,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            encryptedCreds: encryptedCreds,
            enrolledAt: new Date().toISOString()
        };

        localStorage.setItem('educonta_biometric_vault', JSON.stringify(vault));

        if (successMsg) {
            successMsg.innerText = "¡Biometría vinculada con éxito en este equipo!";
            successMsg.classList.remove('hidden');
        }

        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('biometric', '¡Biometría vinculada a este equipo!');
        }

        if (typeof window.updateProfileBiometricUI === 'function') {
            window.updateProfileBiometricUI();
        }

        // Si el prompt estaba abierto, cerrarlo
        closeBiometricPrompt(false);

    } catch (err) {
        console.warn("Error vinculando biometría:", err);
        let msg = err.message || "Error al vincular biometría";
        if (err.name === 'NotAllowedError') {
            msg = "Operación cancelada o tiempo agotado. Si el navegador te mostró una notificación en tu teléfono o en Windows Hello, debes aceptarla colocando tu huella o PIN.";
        } else if (err.name === 'SecurityError' || msg.includes('HTTPS origins') || msg.includes('localhost')) {
            msg = "La biometría WebAuthn requiere conexión HTTPS o acceder como 'http://localhost'. Si estás navegando por 127.0.0.1, cambia la URL a 'http://localhost'.";
        }
        if (errorMsg) {
            errorMsg.innerText = msg;
            errorMsg.classList.remove('hidden');
        } else {
            alert(msg);
        }
    } finally {
        if (btnEnable) {
            btnEnable.disabled = false;
            btnEnable.innerHTML = originalBtnText;
        }
    }
};

// 6. Desvinculación de credenciales biométricas locales
window.removeBiometricCredential = function() {
    if (confirm("¿Estás seguro de que deseas desvincular el acceso biométrico de este equipo? Deberás usar tu contraseña para volver a entrar.")) {
        localStorage.removeItem('educonta_biometric_vault');
        if (typeof window.updateProfileBiometricUI === 'function') {
            window.updateProfileBiometricUI();
        }
        if (typeof window.checkAndRenderBiometricLogin === 'function') {
            window.checkAndRenderBiometricLogin();
        }
        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('success', 'Acceso biométrico desvinculado');
        }
    }
};

// 7. Actualización dinámica de la interfaz del Perfil
window.updateProfileBiometricUI = async function() {
    const statusText = document.getElementById('profile-biometric-status');
    const badge = document.getElementById('profile-biometric-badge');
    const btnEnable = document.getElementById('btn-enable-biometrics');
    const btnDisable = document.getElementById('btn-disable-biometrics');

    if (!statusText || !badge) return;

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');
    const isHttps = window.location.protocol === 'https:';

    // Verificación de protocolo y origen
    if (!isHttps && !isLocalhost) {
        statusText.textContent = hostname === '127.0.0.1' 
            ? "Accede como 'http://localhost' para habilitar biometría" 
            : "Requiere conexión segura HTTPS o 'http://localhost'";
        badge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
        badge.textContent = "Requiere localhost";
        if (btnEnable) {
            btnEnable.classList.remove('hidden');
            btnEnable.disabled = true;
            btnEnable.className = "w-full py-2 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed";
            btnEnable.innerHTML = '<i class="fas fa-exclamation-triangle text-xs mr-1"></i> Requiere http://localhost';
        }
        if (btnDisable) btnDisable.classList.add('hidden');
        return;
    }

    const isSupported = await window.isBiometricSupported();
    const vault = window.getStoredBiometricCredential();

    if (!isSupported) {
        statusText.textContent = "Sensor biométrico no disponible en este dispositivo";
        badge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
        badge.textContent = "No disponible";
        if (btnEnable) btnEnable.classList.add('hidden');
        if (btnDisable) btnDisable.classList.add('hidden');
        return;
    }

    if (vault) {
        statusText.textContent = `Vinculado a este equipo (${vault.userEmail})`;
        statusText.title = vault.userEmail || '';
        badge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
        badge.textContent = "Activo";
        if (btnEnable) btnEnable.classList.add('hidden');
        if (btnDisable) {
            btnDisable.classList.remove('hidden');
            btnDisable.disabled = false;
        }
    } else {
        statusText.textContent = "Sensor compatible detectado (Windows Hello / Touch ID / Face ID)";
        badge.className = "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300";
        badge.textContent = "Disponible";
        if (btnEnable) {
            btnEnable.classList.remove('hidden');
            btnEnable.disabled = false;
            btnEnable.className = "w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2";
            btnEnable.innerHTML = '<i class="fas fa-fingerprint text-xs"></i> <span>Activar en este Equipo</span>';
        }
        if (btnDisable) btnDisable.classList.add('hidden');
    }
};

// 8. Sincronización de token al loguearse con contraseña
window.syncBiometricTokenOnLogin = async function(session, password = null) {
    if (!session) return;
    const vault = window.getStoredBiometricCredential();
    if (vault) {
        const idMatch = vault.userId && session.user?.id && vault.userId === session.user.id;
        const emailMatch = vault.userEmail && session.user?.email && vault.userEmail.toLowerCase() === session.user.email.toLowerCase();

        if (idMatch || emailMatch || !vault.userEmail) {
            vault.accessToken = session.access_token;
            vault.refreshToken = session.refresh_token;
            vault.userId = session.user.id;
            vault.userEmail = session.user.email;
            vault.userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || vault.userEmail;
            vault.updatedAt = new Date().toISOString();

            if (password && vault.credentialId) {
                try {
                    vault.encryptedCreds = await encryptBioData(password, vault.credentialId);
                    console.log("EduConta SV: Bóveda biométrica blindada con éxito.");
                } catch(e) {
                    console.warn("No se pudo cifrar credencial biométrica:", e);
                }
            }

            localStorage.setItem('educonta_biometric_vault', JSON.stringify(vault));
        }
    }
};

// 9. Sugerencia post-login para activar biometría
window.checkAndPromptBiometrics = async function(session) {
    if (!session) return;
    if (window.hasStoredBiometricCredential()) return;
    if (sessionStorage.getItem('educonta_bio_prompt_dismissed') === 'true') return;

    const isSupported = await window.isBiometricSupported();
    if (!isSupported) return;

    const promptModal = document.getElementById('biometric-prompt-modal');
    if (promptModal) {
        promptModal.style.display = 'flex';
    }
};

window.closeBiometricPrompt = function(dismissForSession = false) {
    const promptModal = document.getElementById('biometric-prompt-modal');
    if (promptModal) {
        promptModal.classList.add('closing');
        setTimeout(() => {
            promptModal.style.display = 'none';
            promptModal.classList.remove('closing');
        }, 300);
    }
    if (dismissForSession) {
        sessionStorage.setItem('educonta_bio_prompt_dismissed', 'true');
    }
};

window.confirmBiometricEnrollmentFromPrompt = async function() {
    closeBiometricPrompt(false);
    await window.enrollBiometricCredential();
};

window.openAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
    if (typeof window.checkAndRenderBiometricLogin === 'function') {
        window.checkAndRenderBiometricLogin();
    }
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    const termsCheckbox = document.getElementById('auth-terms-checkbox');
    if (termsCheckbox) termsCheckbox.checked = false;
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300);
    }
};

window.openProfileModal = async function() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Populate current user's name and details
        const nameInput = document.getElementById('profile-name');
        const uidInput = document.getElementById('profile-uid');
        const emailDisplay = document.getElementById('profile-email-display');
        const roleBadge = document.getElementById('profile-role-badge');
        
        if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            const session = data?.session;
            if (session) {
                const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
                if (nameInput) {
                    nameInput.value = userName;
                }
                if (uidInput) {
                    uidInput.value = session.user.id;
                }
                if (emailDisplay) {
                    emailDisplay.textContent = session.user.email || '';
                    emailDisplay.title = session.user.email || '';
                }
                const isAdmin = session.user.email && window.ADMIN_EMAIL && session.user.email.toLowerCase() === window.ADMIN_EMAIL.toLowerCase();
                if (roleBadge) {
                    if (isAdmin) {
                        roleBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20';
                        roleBadge.innerHTML = '<i class="fas fa-shield-alt text-[10px]"></i> Administrador';
                    } else {
                        roleBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
                        roleBadge.innerHTML = '<i class="fas fa-check-circle text-[10px]"></i> Usuario Verificado';
                    }
                }
                if (typeof window.checkUserStatus === 'function') {
                    window.checkUserStatus(session);
                }
            }
        }
        if (typeof window.updateProfileBiometricUI === 'function') {
            window.updateProfileBiometricUI();
        }
    }
};

window.copyUIDToClipboard = function() {
    const uidInput = document.getElementById('profile-uid');
    if (uidInput && uidInput.value) {
        navigator.clipboard.writeText(uidInput.value);
        if (typeof window.showSyncToast === 'function') {
            window.showSyncToast('success', 'ID de usuario copiado');
        } else {
            alert("ID de usuario copiado al portapapeles.");
        }
    }
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
    const termsContainer = document.getElementById('auth-terms-container');
    const termsCheckbox = document.getElementById('auth-terms-checkbox');
    const bioContainer = document.getElementById('biometric-login-container');
    
    if (termsCheckbox) termsCheckbox.checked = false;

    if (isLoginMode) {
        if(nameContainer) nameContainer.classList.add('hidden');
        if(submitBtn) submitBtn.innerText = 'Iniciar Sesión';
        if(toggleBtn) toggleBtn.innerHTML = '¿No tienes cuenta? <span class="text-sky-500">Regístrate</span>';
        if(title) title.innerText = 'Bienvenido';
        if(forgotPwd) forgotPwd.classList.remove('hidden');
        if(termsContainer) termsContainer.classList.add('hidden');
        if (typeof window.checkAndRenderBiometricLogin === 'function') {
            window.checkAndRenderBiometricLogin();
        }
    } else {
        if(nameContainer) nameContainer.classList.remove('hidden');
        if(submitBtn) submitBtn.innerText = 'Registrarse';
        if(toggleBtn) toggleBtn.innerHTML = '¿Ya tienes cuenta? <span class="text-sky-500">Inicia Sesión</span>';
        if(title) title.innerText = 'Crea tu Cuenta';
        if(forgotPwd) forgotPwd.classList.add('hidden');
        if(termsContainer) termsContainer.classList.remove('hidden');
        if (bioContainer) bioContainer.classList.add('hidden');
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

    if (!isLoginMode) {
        const termsCheckbox = document.getElementById('auth-terms-checkbox');
        if (termsCheckbox && !termsCheckbox.checked) {
            if (errorMsg) {
                errorMsg.innerText = "Debes aceptar los Términos y Condiciones para registrarte.";
                errorMsg.classList.remove('hidden');
            }
            return;
        }
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    }

    try {
        if (isLoginMode) {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            // Sincronizar token y credencial cifrada en la bóveda biométrica si ya estaba vinculada
            if (typeof window.syncBiometricTokenOnLogin === 'function') {
                await window.syncBiometricTokenOnLogin(data.session, password);
            }

            if (successMsg) {
                successMsg.innerText = "Sesión iniciada correctamente.";
                successMsg.classList.remove('hidden');
            }
            setTimeout(() => {
                closeAuthModal();
                checkUserStatus(data.session);

                // Sugerir activación rápida si el hardware lo soporta y no está vinculado aún
                if (typeof window.checkAndPromptBiometrics === 'function') {
                    window.checkAndPromptBiometrics(data.session);
                }
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
            let msg = err.message;
            if (msg === "Failed to fetch" || msg.toLowerCase().includes("network error") || msg.includes("Failed to fetch")) {
                msg = "No se pudo conectar al servidor de Supabase. Es muy probable que tu proyecto en Supabase esté pausado por inactividad o la URL configurada no esté disponible. Por favor, reactiva tu proyecto en el panel de Supabase.";
            }
            errorMsg.innerText = msg;
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
         const currentPath = window.location.pathname;
         const basePath = currentPath.endsWith('/') ? currentPath : currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
         const redirectUrl = window.location.origin + basePath + 'reset-password.html';
         
         const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
             redirectTo: redirectUrl
         });
         if(error) throw error;
         if(successMsg) {
             successMsg.innerText = "Correo de recuperación enviado exitosamente.";
             successMsg.classList.remove('hidden');
         }
    } catch (err) {
         if(errorMsg) {
             let msg = err.message;
             if (msg === "Failed to fetch" || msg.toLowerCase().includes("network error") || msg.includes("Failed to fetch")) {
                 msg = "No se pudo conectar al servidor de Supabase. Es muy probable que tu proyecto en Supabase esté pausado por inactividad o la URL no esté disponible.";
             }
             errorMsg.innerText = msg;
             errorMsg.classList.remove('hidden');
         }
    }
};

// =========================================================================
// GESTIÓN DEL ESTADO DE SESIÓN ACTIVA Y LIMPIEZA SEGURA DE DATOS LOCALES
// =========================================================================

// Rastreo en tiempo de ejecución de si este navegador posee una sesión autenticada activa
window._educonta_has_active_session = (function() {
    try {
        if (sessionStorage.getItem('educonta_has_active_session') === 'true') return true;
        return Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    } catch (e) {
        return false;
    }
})();

// Evalúa con certeza si existe una sesión autenticada activa en el cliente
window.isEducontaSessionActive = function() {
    if (window.isUserLoggedIn) return true;
    if (window._educonta_has_active_session) return true;
    try {
        if (sessionStorage.getItem('educonta_has_active_session') === 'true') return true;
        if (Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'))) return true;
    } catch (e) {}
    return false;
};

// Elimina proyectos y documentos locales ÚNICAMENTE cuando una sesión activa se cierra
window.clearSessionProjectsAndDocuments = function() {
    console.log("🧹 [EduConta SV] Limpieza de sesión activa: eliminando proyectos y documentos del almacenamiento local.");

    const projectKeys = [
        // Proyectos contables
        'educonta_projects_libros',
        'educonta_projects_kardex',
        'educonta_projects_planillas',
        'educonta_projects_tributario',
        'educonta_projects_costos',
        'educonta_projects_caja',
        'educonta_projects_finanzas',
        'educonta_projects_hojas',
        'educonta_projects_v38',
        // Documentos
        'educonta_projects_textos',
        'educonta_projects_calculo',
        'educonta_projects_lienzos',
        'educonta_projects_diagramas',
        'educonta_projects_diapositivas',
        'educonta_projects_v38_docs',
        'educonta_projects',
        'educonvert_local_canvases',
        // Metadatos y sincronización
        'educonta_synced_ids',
        'educonta_last_project_id',
        'educonta_project_counter',
        'educonta_last_backup',
        'educonta_last_backup_date'
    ];

    try {
        projectKeys.forEach(key => localStorage.removeItem(key));

        // Limpiar cualquier respaldo temporal residual en localStorage
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('educonta_backup_projects_')) {
                localStorage.removeItem(k);
            }
        });
    } catch (e) {
        console.error("Error al limpiar proyectos de localStorage:", e);
    }

    try {
        // Limpieza de estados de sesión y auditoría en sessionStorage
        sessionStorage.removeItem('educonta_has_active_session');
        sessionStorage.removeItem('educonta_audit_active');
        sessionStorage.removeItem('educonta_audit_mode');
        sessionStorage.removeItem('educonta_audit_owner_name');
        sessionStorage.removeItem('educonta_bio_prompt_dismissed');
        const sessionBackups = [
            'educonta_backup_projects_libros',
            'educonta_backup_projects_kardex',
            'educonta_backup_projects_planillas',
            'educonta_backup_projects_tributario',
            'educonta_backup_projects_costos',
            'educonta_backup_projects_caja',
            'educonta_backup_projects_finanzas',
            'educonta_backup_projects_textos',
            'educonta_backup_projects_calculo',
            'educonta_backup_projects_hojas',
            'educonta_backup_projects_lienzos',
            'educonta_backup_projects_diagramas'
        ];
        sessionBackups.forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
        console.error("Error al limpiar sessionStorage:", e);
    }

    // Resetear variables en memoria si están presentes en la ventana actual
    if (typeof window.projects !== 'undefined') window.projects = [];
    if (typeof window.syncedProjectIds !== 'undefined') {
        if (window.syncedProjectIds instanceof Set) {
            window.syncedProjectIds.clear();
        } else {
            window.syncedProjectIds = new Set();
        }
    }
    if (typeof window.proyecto_actual !== 'undefined') window.proyecto_actual = null;
    if (typeof window.documento_actual !== 'undefined') window.documento_actual = null;
    if (typeof window.projectCounter !== 'undefined') window.projectCounter = 0;
    window.isUserLoggedIn = false;
    window._educonta_has_active_session = false;
};

window.logout = async function() {
    // 1. Determinar si había una sesión activa antes de proceder con el deslogueo
    let hadActiveSession = window.isEducontaSessionActive();

    if (!hadActiveSession && window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient.auth.getSession();
            if (data?.session?.user) {
                hadActiveSession = true;
            }
        } catch (e) {}
    }

    // 2. Solo si había una sesión activa se borran los proyectos y documentos
    if (hadActiveSession) {
        window.clearSessionProjectsAndDocuments();
    }

    // 3. Cerrar sesión en Supabase (scope local para permitir reingreso biométrico)
    if(window.supabaseClient) {
        try {
            await window.supabaseClient.auth.signOut({ scope: 'local' });
        } catch(e) {}

        try {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
                    localStorage.removeItem(k);
                }
            });
        } catch(e) {}
    }
    
    localStorage.removeItem('educonta_last_project_id');
    
    // 4. Redirigir a la página de inicio o recargar si ya está en index
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        window.location.reload();
    } else {
        window.location.href = 'index.html'; 
    }
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
        window.isUserLoggedIn = true;
        window._educonta_has_active_session = true;
        try {
            sessionStorage.setItem('educonta_has_active_session', 'true');
        } catch (e) {}

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
                    btnMaster.className = 'w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-between group';
                    btnMaster.title = 'Acceso al Panel de Administrador y Auditoría Global';
                    btnMaster.innerHTML = `
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                                <i class="fas fa-rocket text-xs"></i>
                            </div>
                            <div class="text-left">
                                <div class="font-black text-xs leading-none tracking-wider">Panel de Administrador</div>
                                <div class="text-[9px] text-indigo-200 normal-case font-medium mt-1">Bóveda de auditoría y gestión</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 text-indigo-200 group-hover:text-white transition-colors text-[10px] font-black">
                            <span>Ingresar</span>
                            <i class="fas fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                        </div>
                    `;
                    btnMaster.type = 'button';
                    btnMaster.onclick = () => { 
                        if(typeof window.closeProfileModal === 'function') window.closeProfileModal(); 
                        window.location.href = 'admin.html'; 
                    };
                    adminContainer.appendChild(btnMaster);
                }
                adminContainer.classList.remove('hidden');
                adminContainer.style.display = 'block';
                btnMaster.style.display = 'flex';
            } else {
                adminContainer.classList.add('hidden');
                adminContainer.style.display = 'none';
                if (btnMaster) {
                    btnMaster.style.display = 'none';
                }
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
        window.isUserLoggedIn = false;
        // IMPORTANTE: NO borrar proyectos aquí.
        // Si el usuario está en modo local sin cuenta o sin conexión a internet,
        // sus proyectos y documentos locales deben preservarse intactos.
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

    const profileForm = document.getElementById('form-profile');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleProfileSubmit();
        });
    }

    if(window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => { 
            checkUserStatus(session); 
            
            // Sincronización automática de proyectos al iniciar sesión o actualizar usuario
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                window.isUserLoggedIn = true;
                window._educonta_has_active_session = true;
                try {
                    sessionStorage.setItem('educonta_has_active_session', 'true');
                } catch(e) {}

                if (typeof window.fetchProjectsFromCloud === 'function') {
                    window.fetchProjectsFromCloud().then((updated) => {
                        if (typeof window.renderProjectGrid === 'function') {
                            window.renderProjectGrid();
                        }
                    }).catch(e => console.error("Error sincronizando al iniciar sesión:", e));
                }
            } else if (event === 'SIGNED_OUT') {
                // Se cerró la sesión: verificar si existía una sesión activa previa
                const wasActive = window.isEducontaSessionActive();
                if (wasActive) {
                    window.clearSessionProjectsAndDocuments();
                }
                if (typeof window.renderProjectGrid === 'function') {
                    window.syncedProjectIds = new Set();
                    window.renderProjectGrid();
                }
            }
        });
    }

    checkUserStatus(null);
    if (typeof window.checkAndRenderBiometricLogin === 'function') {
        window.checkAndRenderBiometricLogin();
    }
};

window.handleProfileSubmit = async function() {
    const nameEl = document.getElementById('profile-name');
    const name = nameEl ? nameEl.value.trim() : '';
    const errorMsg = document.getElementById('profile-error-msg');
    const successMsg = document.getElementById('profile-success-msg');
    const submitBtn = document.getElementById('btn-profile-submit');

    if (errorMsg) errorMsg.classList.add('hidden');
    if (successMsg) successMsg.classList.add('hidden');

    if (!name) {
        if (errorMsg) {
            errorMsg.innerText = "El nombre no puede estar vacío.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Guardando...';
    }

    try {
        if (window.supabaseClient) {
            const { data, error } = await window.supabaseClient.auth.updateUser({
                data: { full_name: name, name: name }
            });
            if (error) throw error;
            
            if (successMsg) {
                successMsg.innerText = "Perfil actualizado correctamente.";
                successMsg.classList.remove('hidden');
            }
            
            // Actualizar el nombre de perfil mostrado en el header
            const emailDisplay = document.getElementById('user-email-display');
            if (emailDisplay) {
                emailDisplay.innerText = name;
            }

            setTimeout(() => {
                closeProfileModal();
            }, 1000);
        }
    } catch (err) {
        if (errorMsg) {
            errorMsg.innerText = err.message;
            errorMsg.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save text-xs"></i> <span>Guardar</span>';
        }
    }
};

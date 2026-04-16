// Utilidad para ocultar o mostrar el campo password localmente en la página
function toggleVisibility() {
    const input = document.getElementById('reset-password-input');
    const icon = document.getElementById('reset-password-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Inicializar el evento Submit del formulario cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    
    // Verificamos de entrada si al cargar la página Supabase ha detectado una sesión (usualmente derivada del hash de recuperación del URL de tipo recovery)
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            console.log("Detectado flujo de recuperación de contraseña.");
        }
    });

    const form = document.getElementById('form-reset-pwd');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('reset-password-input').value;
        const errorMsg = document.getElementById('reset-error-msg');
        const successMsg = document.getElementById('reset-success-msg');
        const submitBtn = document.getElementById('btn-reset-submit');
        
        // Reset status UI
        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');
        
        if (!password || password.length < 6) {
            errorMsg.innerText = "La contraseña debe tener al menos 6 caracteres.";
            errorMsg.classList.remove('hidden');
            return;
        }

        // Estado Cargando
        const btnOriginalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Actualizando...';
        submitBtn.classList.replace('bg-sky-500', 'bg-slate-400');
        submitBtn.classList.replace('hover:bg-sky-600', 'hover:bg-slate-500');

        try {
            // El API para recuperar el hash de sesión ya ha guardado al usuario en ventana, por lo tanto actualizamos sobre updateUser
            const { data, error } = await window.supabaseClient.auth.updateUser({
                password: password
            });

            if (error) throw error;
            
            // Éxito Total
            successMsg.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Contraseña actualizada. Redirigiendo...';
            successMsg.classList.remove('hidden');
            
            // Redirect al index / login luego de 2 segundos para dar constancia visual
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (err) {
            console.error("Error updating pwd", err);
            // Casos comunes: token inválido, expirado o el usuario accedió manual a la URL sin token
            if (err.message.includes('Auth session missing')) {
                errorMsg.innerHTML = "No se ha detectado el token de seguridad. <br/>Asegúrate de haber accedido desde el enlace directo de tu correo electrónico.";
            } else {
                errorMsg.innerText = err.message;
            }
            errorMsg.classList.remove('hidden');
            
            submitBtn.disabled = false;
            submitBtn.innerText = btnOriginalText;
            submitBtn.classList.replace('bg-slate-400', 'bg-sky-500');
            submitBtn.classList.replace('hover:bg-slate-500', 'hover:bg-sky-600');
        }
    });

});

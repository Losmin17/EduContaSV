const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxW4BP3_pNQWBuOqdpJnvT8p_Lc3f2sos9j8vWLHZ3ByWzJjKE4dVx2hukgXjqQXMQtDA/exec";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('support-form');
    if(form) {
        form.addEventListener('submit', handleSupportSubmit);
    }
});

async function handleSupportSubmit(e) {
    e.preventDefault();
    
    if(GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL_HERE") {
        if(window.showAlert) {
            window.showAlert("Configuración Pendiente", "Aún falta configurar la URL de Google Apps Script en el código.");
        } else {
            alert("Aún falta configurar la URL de Google Apps Script.");
        }
        return;
    }

    const nombre = document.getElementById('sup-nombre').value;
    const correo = document.getElementById('sup-correo').value;
    const asunto = document.getElementById('sup-asunto').value;
    const mensaje = document.getElementById('sup-mensaje').value;
    const imagenInput = document.getElementById('sup-imagen');

    // UI Feedback: Loading state
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    const btnSpinner = document.getElementById('btn-spinner');
    const submitBtn = document.getElementById('btn-submit-support');

    btnText.classList.add('opacity-0');
    btnIcon.classList.add('opacity-0');
    btnSpinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        let base64Data = null;
        let fileName = null;

        if (imagenInput.files && imagenInput.files.length > 0) {
            const file = imagenInput.files[0];
            fileName = file.name;
            base64Data = await fileToBase64(file);
        }

        const payload = {
            nombre: nombre,
            correo: correo,
            asunto: asunto,
            mensaje: mensaje,
            fileName: fileName,
            fileBase64: base64Data
        };

        // Fetch using no-cors to bypass CORS restrictions from simple GS deployment
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(payload)
        });

        // Con no-cors no podemos leer la respuesta real, asumimos éxito si no hay error de red
        showSuccess();
    } catch (error) {
        console.error("Error al enviar soporte:", error);
        if(window.showAlert) {
            window.showAlert("Error", "Ocurrió un problema al enviar el mensaje. Revisa tu conexión a internet.");
        } else {
            alert("Error al enviar el mensaje.");
        }
        
        // Restore button state
        btnText.classList.remove('opacity-0');
        btnIcon.classList.remove('opacity-0');
        btnSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

function showSuccess() {
    document.getElementById('support-form').classList.add('hidden');
    document.getElementById('support-success').classList.remove('hidden');
}

window.resetSupportForm = function() {
    const form = document.getElementById('support-form');
    form.reset();
    document.getElementById('file-name-display').innerText = "Haz clic o arrastra una imagen (Max. 5MB)";
    
    // Restore button state
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    const btnSpinner = document.getElementById('btn-spinner');
    const submitBtn = document.getElementById('btn-submit-support');
    
    btnText.classList.remove('opacity-0');
    btnIcon.classList.remove('opacity-0');
    btnSpinner.classList.add('hidden');
    submitBtn.disabled = false;

    form.classList.remove('hidden');
    document.getElementById('support-success').classList.add('hidden');
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

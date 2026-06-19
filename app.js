// === Pega aquí tu NUEVA URL de Google Apps Script ===
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0jPqKuGc19y45i0iwKGw1O3AzhiohNRDielALiQ62Os3NIZXztVz7g87dhmT_JIT6/exec"; 

// --- Elementos de la interfaz ---
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const appSection = document.getElementById('app-section');

// --- Navegación entre pantallas ---
document.getElementById('link-registro').addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
});

document.getElementById('link-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
});

// --- Variable para recordar quién está usando la app ---
let currentUserNombre = "";

// ==========================================
// 1. FUNCIÓN DE REGISTRO
// ==========================================
document.getElementById('btn-registrar').addEventListener('click', async () => {
    const nombre = document.getElementById('reg-nombre').value;
    const correo = document.getElementById('reg-correo').value;
    const doc = document.getElementById('reg-doc').value;
    const celular = document.getElementById('reg-celular').value;
    const pass = document.getElementById('reg-pass').value;

    if (!nombre || !correo || !doc || !celular || !pass) {
        alert("Por favor completa todos los campos.");
        return;
    }

    const btn = document.getElementById('btn-registrar');
    btn.innerText = "Enviando datos...";
    btn.disabled = true;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'register', nombre, correo, doc, celular, pass })
        });
        const result = await response.json();
        
        alert(result.message);
        if (result.status === "success") {
            // Si el registro es exitoso, lo devuelve a la pantalla de login
            registerSection.style.display = 'none';
            loginSection.style.display = 'block';
        }
    } catch (error) {
        alert("Error de conexión al registrar.");
    } finally {
        btn.innerText = "Enviar Registro";
        btn.disabled = false;
    }
});

// ==========================================
// 2. FUNCIÓN DE INICIO DE SESIÓN
// ==========================================
async function doLogin(doc, pass, recordar) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', doc, pass })
        });
        const result = await response.json();
        
        if (result.status === "success") {
            currentUserNombre = result.nombre; 
            
            // Si marcó la casilla, guardamos los datos en el celular
            if (recordar) {
                localStorage.setItem('compukelc_doc', doc);
                localStorage.setItem('compukelc_pass', pass);
            }

            document.getElementById('user-greeting').innerText = `👤 Contratista: ${currentUserNombre}`;
            loginSection.style.display = 'none';
            appSection.style.display = 'block';
        } else {
            alert(result.message);
            // Si algo falla, borramos la memoria para evitar errores futuros
            localStorage.removeItem('compukelc_doc');
            localStorage.removeItem('compukelc_pass');
        }
    } catch (error) {
        alert("Error de conexión al iniciar sesión.");
    }
}

document.getElementById('btn-login').addEventListener('click', () => {
    const doc = document.getElementById('login-doc').value;
    const pass = document.getElementById('login-pass').value;
    const recordar = document.getElementById('recordar-datos').checked;

    if (!doc || !pass) {
        alert("Ingresa tu documento y contraseña.");
        return;
    }
    
    const btn = document.getElementById('btn-login');
    btn.innerText = "Verificando...";
    btn.disabled = true;
    
    doLogin(doc, pass, recordar).finally(() => {
        btn.innerText = "Ingresar";
        btn.disabled = false;
    });
});

// ==========================================
// 3. AUTO-LOGIN (Verifica si hay datos guardados al abrir)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const savedDoc = localStorage.getItem('compukelc_doc');
    const savedPass = localStorage.getItem('compukelc_pass');
    
    if (savedDoc && savedPass) {
        doLogin(savedDoc, savedPass, true);
    }
});

// ==========================================
// 4. CERRAR SESIÓN
// ==========================================
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('compukelc_doc');
    localStorage.removeItem('compukelc_pass');
    currentUserNombre = "";
    
    appSection.style.display = 'none';
    loginSection.style.display = 'block';
    
    // Limpiar campos visuales
    document.getElementById('login-doc').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('recordar-datos').checked = false;
});

// ==========================================
// 5. CÓDIGO DE LA CÁMARA (Actualizado con el usuario real)
// ==========================================
const fileInput = document.getElementById('foto');
const fileNameDisplay = document.getElementById('file-name');
const submitBtn = document.getElementById('btn-enviar');
const statusMessage = document.getElementById('status-message');
let selectedFile = null;

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        fileNameDisplay.textContent = `Foto lista: ${file.name}`;
        submitBtn.disabled = false;
        statusMessage.textContent = "";
    }
});

submitBtn.addEventListener('click', () => {
    if (!selectedFile) return;

    const privacidad = document.getElementById('privacidad').value;
    const reader = new FileReader();

    reader.onload = function(e) {
        const base64Data = e.target.result;

        submitBtn.disabled = true;
        submitBtn.textContent = "Subiendo y creando carpeta...";
        statusMessage.textContent = "Procesando la imagen, por favor espera...";
        statusMessage.style.color = "blue";

        const payload = {
            action: 'upload',
            usuario: currentUserNombre, // Usa automáticamente el nombre de quien inició sesión
            privacidad: privacidad,
            filename: selectedFile.name,
            mimeType: selectedFile.type,
            base64: base64Data
        };

        fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                statusMessage.textContent = "✅ ¡Evidencia subida correctamente a tu carpeta personal!";
                statusMessage.style.color = "green";
                selectedFile = null;
                fileInput.value = "";
                fileNameDisplay.textContent = "Ninguna foto tomada aún.";
            } else {
                statusMessage.textContent = "❌ Error: " + data.message;
                statusMessage.style.color = "red";
            }
        })
        .catch(error => {
            statusMessage.textContent = "❌ Error de red.";
            statusMessage.style.color = "red";
        })
        .finally(() => {
            submitBtn.textContent = "Subir Evidencia";
            submitBtn.disabled = false;
        });
    };

    reader.readAsDataURL(selectedFile);
});

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0jPqKuGc19y45i0iwKGw1O3AzhiohNRDielALiQ62Os3NIZXztVz7g87dhmT_JIT6/exec"; 

const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const appSection = document.getElementById('app-section');

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

let currentUserNombre = "";

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

async function doLogin(doc, pass, recordar) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', doc, pass })
        });
        const result = await response.json();
        
        if (result.status === "success") {
            currentUserNombre = result.nombre; 
            if (recordar) {
                localStorage.setItem('compukelc_doc', doc);
                localStorage.setItem('compukelc_pass', pass);
            }
            document.getElementById('user-greeting').innerText = `👤 Contratista: ${currentUserNombre}`;
            loginSection.style.display = 'none';
            appSection.style.display = 'block';
        } else {
            alert(result.message);
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
    doLogin(doc, pass, recordar);
});

window.addEventListener('DOMContentLoaded', () => {
    const savedDoc = localStorage.getItem('compukelc_doc');
    const savedPass = localStorage.getItem('compukelc_pass');
    if (savedDoc && savedPass) {
        doLogin(savedDoc, savedPass, true);
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('compukelc_doc');
    localStorage.removeItem('compukelc_pass');
    currentUserNombre = "";
    appSection.style.display = 'none';
    loginSection.style.display = 'block';
});

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
    }
});

submitBtn.addEventListener('click', () => {
    if (!selectedFile) return;
    const privacidad = document.getElementById('privacidad').value;
    const reader = new FileReader();

    reader.onload = function(e) {
        submitBtn.disabled = true;
        statusMessage.textContent = "Subiendo archivo...";
        const payload = {
            action: 'upload',
            usuario: currentUserNombre,
            privacidad: privacidad,
            filename: selectedFile.name,
            mimeType: selectedFile.type,
            base64: e.target.result
        };

        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                statusMessage.textContent = "✅ Evidencia subida exitosamente.";
                selectedFile = null;
                fileInput.value = "";
                fileNameDisplay.textContent = "Ninguna foto tomada aún.";
            } else {
                statusMessage.textContent = "❌ Error: " + data.message;
            }
        })
        .catch(() => {
            statusMessage.textContent = "❌ Error de red.";
        })
        .finally(() => { submitBtn.disabled = false; });
    };
    reader.readAsDataURL(selectedFile);
});

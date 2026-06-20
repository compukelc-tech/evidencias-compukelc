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
    
    // Limpiar historial e imagen al cerrar sesión
    document.getElementById('galeria-contenedor').style.display = 'none';
    document.getElementById('galeria-grid').innerHTML = '';
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
});

const fileInput = document.getElementById('foto');
const fileNameDisplay = document.getElementById('file-name');
const submitBtn = document.getElementById('btn-enviar');
const statusMessage = document.getElementById('status-message');
let selectedFile = null;

// Inyección: Renderizar Vista Previa Local
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        fileNameDisplay.textContent = `Foto lista: ${file.name}`;
        submitBtn.disabled = false;
        
        // Motor de vista previa
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('preview-container').style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

submitBtn.addEventListener('click', () => {
    if (!selectedFile) return;
    
    submitBtn.disabled = true;
    statusMessage.textContent = "Procesando y comprimiendo imagen...";
    
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 1280;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

            statusMessage.textContent = "Subiendo archivo...";
            const payload = {
                action: 'upload',
                usuario: currentUserNombre,
                filename: selectedFile.name,
                mimeType: 'image/jpeg',
                base64: dataUrl
            };

            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    statusMessage.textContent = "✅ Evidencia subida exitosamente.";
                    selectedFile = null;
                    fileInput.value = "";
                    fileNameDisplay.textContent = "Ninguna foto tomada aún.";
                    
                    // Inyección: Ocultar vista previa tras éxito
                    document.getElementById('preview-container').style.display = 'none';
                    document.getElementById('image-preview').src = '';
                    
                    if(document.getElementById('galeria-contenedor').style.display === 'block') {
                        cargarHistorial();
                    }
                } else {
                    statusMessage.textContent = "❌ Error: " + data.message;
                }
            })
            .catch(() => {
                statusMessage.textContent = "❌ Error de red.";
            })
            .finally(() => { submitBtn.disabled = false; });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(selectedFile);
});

// Inyección: Lógica del Buscador de Evidencias
document.getElementById('btn-ver-fotos').addEventListener('click', () => {
    const contenedor = document.getElementById('galeria-contenedor');
    if (contenedor.style.display === 'block') {
        contenedor.style.display = 'none';
    } else {
        contenedor.style.display = 'block';
        cargarHistorial();
    }
});

// Inyección: Motor de Miniaturas desde Drive
function cargarHistorial() {
    const grid = document.getElementById('galeria-grid');
    grid.innerHTML = '<p style="font-size: 13px; color: #666;">Buscando evidencias en el servidor...</p>';
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_evidences', usuario: currentUserNombre })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            grid.innerHTML = '';
            if(data.evidencias.length === 0) {
                grid.innerHTML = '<p style="font-size: 13px; color: #666;">Aún no has subido evidencias.</p>';
                return;
            }
            
            data.evidencias.forEach(ev => {
                // Extractor inteligente del ID de Drive
                const match = ev.url.match(/\/d\/(.+?)\//);
                const thumbUrl = match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w100` : '';
                
                const thumbHtml = thumbUrl ? `<img src="${thumbUrl}" class="foto-thumbnail" alt="Evidencia">` : '<div class="foto-thumbnail"></div>';

                const card = document.createElement('div');
                card.className = 'foto-card';
                card.innerHTML = `
                    ${thumbHtml}
                    <div class="foto-info">📅 ${ev.fecha}</div>
                    <a href="${ev.url}" target="_blank" class="btn-descarga">↓ Descargar</a>
                `;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p style="color: red;">Error al consultar datos.</p>';
        }
    })
    .catch(() => {
        grid.innerHTML = '<p style="color: red;">Error de red al consultar.</p>';
    });
}

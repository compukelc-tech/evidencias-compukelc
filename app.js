const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0jPqKuGc19y45i0iwKGw1O3AzhiohNRDielALiQ62Os3NIZXztVz7g87dhmT_JIT6/exec";

const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const appSection = document.getElementById('app-section');
const adminSection = document.getElementById('admin-section');

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

function inicializarFiltrosAnio() {
    const selectAnio = document.getElementById('filtro-anio');
    if (!selectAnio) return;
    
    const anioInicio = 2026;
    const anioActual = new Date().getFullYear();
    const maxAnio = Math.max(anioInicio, anioActual);
    
    selectAnio.innerHTML = '';
    for (let anio = anioInicio; anio <= maxAnio; anio++) {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        selectAnio.appendChild(option);
    }
    selectAnio.value = maxAnio;
}

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
            
            loginSection.style.display = 'none';
            appSection.style.display = 'block';
            
            // Lógica para mostrar botón de galería
            const btnGaleria = document.getElementById('btn-galeria-wrapper');
            if (result.rol === "admin" || result.permiso_galeria === "Sí" || result.permiso_galeria === true) {
                btnGaleria.style.display = 'block';
            } else {
                btnGaleria.style.display = 'none';
            }

            if (result.rol === "admin") {
                document.getElementById('user-greeting').innerText = `👤 Admin: ${currentUserNombre}`;
                adminSection.style.display = 'block';
                loadAdminUsers();
            } else {
                document.getElementById('user-greeting').innerText = `👤 Contratista: ${currentUserNombre}`;
                adminSection.style.display = 'none';
            }
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
    inicializarFiltrosAnio();
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
    adminSection.style.display = 'none';
    loginSection.style.display = 'block';
    
    document.getElementById('galeria-contenedor').style.display = 'none';
    document.getElementById('galeria-grid').innerHTML = '';
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
    document.getElementById('btn-galeria-wrapper').style.display = 'none';
});

// Lógica unificada para procesar el archivo, sin importar si viene de la cámara o galería
const fileInput = document.getElementById('foto');
const fileInputGaleria = document.getElementById('foto-galeria');
const fileNameDisplay = document.getElementById('file-name');
const submitBtn = document.getElementById('btn-enviar');
const statusMessage = document.getElementById('status-message');
let selectedFile = null;

function procesarArchivo(file) {
    if (file) {
        selectedFile = file;
        fileNameDisplay.textContent = `Archivo listo: ${file.name}`;
        submitBtn.disabled = false;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('preview-container').style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

fileInput.addEventListener('change', (event) => procesarArchivo(event.target.files[0]));
fileInputGaleria.addEventListener('change', (event) => procesarArchivo(event.target.files[0]));

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
                    fileInputGaleria.value = "";
                    fileNameDisplay.textContent = "Ningún archivo seleccionado aún.";
                    
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

document.getElementById('btn-ver-fotos').addEventListener('click', () => {
    const contenedor = document.getElementById('galeria-contenedor');
    if (contenedor.style.display === 'block') {
        contenedor.style.display = 'none';
    } else {
        contenedor.style.display = 'block';
        cargarHistorial();
    }
});

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
                let anioFoto = "";
                let mesFoto = "";
                let dateObj = new Date(ev.fecha);
                
                if (!isNaN(dateObj.getTime())) {
                    anioFoto = dateObj.getFullYear().toString();
                    mesFoto = (dateObj.getMonth() + 1).toString();
                } else {
                    const partes = ev.fecha.split('/');
                    if(partes.length >= 3) {
                        anioFoto = partes[2].substring(0,4);
                        mesFoto = parseInt(partes[1], 10).toString();
                    }
                }

                const match = ev.url.match(/\/d\/(.+?)\//);
                const thumbUrl = match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w100` : '';
                const thumbHtml = thumbUrl ? `<img src="${thumbUrl}" class="foto-thumbnail" alt="Evidencia">` : '<div class="foto-thumbnail"></div>';
                
                const card = document.createElement('div');
                card.className = 'foto-card';
                card.setAttribute('data-anio', anioFoto);
                card.setAttribute('data-mes', mesFoto);
                
                card.innerHTML = `
                    ${thumbHtml}
                    <div class="foto-info">📅 ${ev.fecha}</div>
                    <a href="${ev.url}" target="_blank" class="btn-descarga">↓ Descargar</a>
                `;
                grid.appendChild(card);
            });
            
            filtrarFotos();
            
        } else {
            grid.innerHTML = '<p style="color: red;">Error al consultar datos.</p>';
        }
    })
    .catch(() => {
        grid.innerHTML = '<p style="color: red;">Error de red al consultar.</p>';
    });
}

window.filtrarFotos = function() {
    const anioSeleccionado = document.getElementById('filtro-anio').value;
    const mesSeleccionado = document.getElementById('filtro-mes').value;
    const fotos = document.querySelectorAll('#galeria-grid .foto-card');

    fotos.forEach(foto => {
        const anioFoto = foto.getAttribute('data-anio');
        const mesFoto = foto.getAttribute('data-mes');

        const coincideAnio = (anioSeleccionado === anioFoto) || (!anioFoto);
        const coincideMes = (mesSeleccionado === 'todos' || mesSeleccionado === mesFoto) || (!mesFoto);

        if (coincideAnio && coincideMes) {
            foto.style.display = 'flex';
        } else {
            foto.style.display = 'none';
        }
    });
};

document.getElementById('btn-load-users').addEventListener('click', loadAdminUsers);

function loadAdminUsers() {
    const listContainer = document.getElementById('admin-users-list');
    listContainer.innerHTML = '<p style="text-align: center; color: #666;">Cargando base de datos...</p>';
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_users' })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            listContainer.innerHTML = '';
            if(data.usuarios.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #666;">No hay usuarios registrados.</p>';
                return;
            }
            
            data.usuarios.forEach(user => {
                let statusColor = user.estado === 'Permitido' ? '#28a745' : (user.estado === 'Bloqueado' ? '#dc3545' : '#ffc107');
                
                // Lógica de botones para el permiso de Galería
                let txtGaleria = user.permiso_galeria === 'Sí' ? '🚫 Quitar Galería' : '🖼️ Dar Galería';
                let bgGaleria = user.permiso_galeria === 'Sí' ? '#6c757d' : '#17a2b8';

                const card = document.createElement('div');
                card.className = 'foto-card';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'flex-start';
                card.style.width = '100%';
                
                card.innerHTML = `
                    <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>${user.nombre}</strong>
                        <span style="color: ${statusColor}; font-size: 12px; font-weight: bold;">[${user.estado}]</span>
                    </div>
                    <div style="font-size: 13px; color: #666; margin-bottom: 10px;">Doc: ${user.doc} | Galería: ${user.permiso_galeria || 'No'}</div>
                    
                    <div style="display: flex; gap: 5px; width: 100%; margin-bottom: 5px;">
                        <button onclick="manageUser(${user.row}, 'approve')" style="flex:1; background:#28a745; color:#fff; border:none; padding:8px; border-radius:4px; cursor:pointer; font-size: 12px; font-weight:bold;">Permitir</button>
                        <button onclick="manageUser(${user.row}, 'block')" style="flex:1; background:#ffc107; color:#000; border:none; padding:8px; border-radius:4px; cursor:pointer; font-size: 12px; font-weight:bold;">Bloquear</button>
                    </div>
                    <div style="display: flex; gap: 5px; width: 100%;">
                        <button onclick="manageUser(${user.row}, 'toggle_gallery')" style="flex:1; background:${bgGaleria}; color:#fff; border:none; padding:8px; border-radius:4px; cursor:pointer; font-size: 12px; font-weight:bold;">${txtGaleria}</button>
                        <button onclick="manageUser(${user.row}, 'delete')" style="flex:1; background:#dc3545; color:#fff; border:none; padding:8px; border-radius:4px; cursor:pointer; font-size: 12px; font-weight:bold;">Borrar</button>
                    </div>
                `;
                listContainer.appendChild(card);
            });
        }
    })
    .catch(() => {
        listContainer.innerHTML = '<p style="color: red; text-align: center;">Error de red al consultar.</p>';
    });
}

window.manageUser = function(row, actionType) {
    if (actionType === 'delete') {
        if (!confirm("⚠️ ¿Estás seguro de eliminar este usuario por completo?")) return;
    } else if (actionType === 'block') {
        if (!confirm("¿Deseas revocar el acceso a este contratista?")) return;
    } else if (actionType === 'toggle_gallery') {
        if (!confirm("¿Deseas cambiar el permiso de galería de este contratista?")) return;
    }
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'manage_user', row: row, manage_action: actionType })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            loadAdminUsers();
        }
    });
}

// REEMPLAZA ESTA URL CON LA QUE TE DIO GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0jPqKuGc19y45i0iwKGw1O3AzhiohNRDielALiQ62Os3NIZXztVz7g87dhmT_JIT6/exec";

const inputFile = document.getElementById('foto');
const fileNameDisplay = document.getElementById('file-name');
const btnEnviar = document.getElementById('btn-enviar');
const statusMessage = document.getElementById('status-message');

let base64Image = "";

// Cuando toman la foto
inputFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.textContent = "✅ Foto lista: " + file.name;
        btnEnviar.disabled = false; // Activar el botón de subir

        // Convertir la imagen a texto (Base64) para poder enviarla
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            // Quitamos la primera parte del texto que no necesitamos
            base64Image = reader.result.split(',')[1]; 
        };
    }
});

// Cuando tocan "Subir Evidencia"
btnEnviar.addEventListener('click', function() {
    const usuario = document.getElementById('usuario').value;
    const privacidad = document.getElementById('privacidad').value;

    if (!usuario) {
        alert("Por favor, selecciona tu nombre antes de subir la foto.");
        return;
    }

    // Mostrar estado de carga
    statusMessage.style.color = "#007bff";
    statusMessage.textContent = "⏳ Subiendo foto, por favor espera...";
    btnEnviar.disabled = true;

    // Empaquetar los datos
    const payload = {
        image: base64Image,
        mimeType: "image/jpeg",
        filename: "Evidencia_" + usuario.replace(/\s+/g, '_') + "_" + new Date().getTime() + ".jpg",
        usuario: usuario,
        privacidad: privacidad
    };

    // Enviar a Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            statusMessage.style.color = "#28a745";
            statusMessage.textContent = "✅ ¡Evidencia subida correctamente!";
            inputFile.value = ""; // Limpiar la cámara
            fileNameDisplay.textContent = "Ninguna foto tomada aún.";
        } else {
            statusMessage.style.color = "red";
            statusMessage.textContent = "❌ Hubo un error al subir.";
            btnEnviar.disabled = false;
        }
    })
    .catch(error => {
        statusMessage.style.color = "red";
        statusMessage.textContent = "❌ Error de conexión.";
        btnEnviar.disabled = false;
    });
});

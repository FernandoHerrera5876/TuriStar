document.addEventListener("DOMContentLoaded", () => {
    // Validar si tiene sesión para poder crear lugares
    const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usuarioGuardado) {
        window.location.replace("login.html");
    }
});

document.getElementById("formNuevoDestino").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnGuardarDestino");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    const datos = {
        nombre: document.getElementById("ndNombre").value.trim(),
        municipio: document.getElementById("ndMunicipio").value.trim(),
        descripcion: document.getElementById("ndDescripcion").value.trim(),
        urlFoto: document.getElementById("ndUrlFoto").value.trim()
    };

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Destino/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            mostrarAlerta("Lugar agregado. Redirigiendo para que dejes tu reseña...", true);
            // ¡La magia! Lo mandamos a la página de detalles con el nuevo ID
            setTimeout(() => {
                window.location.href = `detalle.html?id=${resultado.idDestino}`;
            }, 1500);
        } else {
            mostrarAlerta(resultado.respuesta || "Error al guardar el lugar.", false);
            btn.disabled = false;
            btn.textContent = "Guardar y Crear Reseña";
        }
    } catch (error) {
        console.error("Error:", error);
        mostrarAlerta("Error de conexión al servidor.", false);
        btn.disabled = false;
        btn.textContent = "Guardar y Crear Reseña";
    }
});

function mostrarAlerta(mensaje, esExito) {
    const alerta = document.getElementById("alertaDestino");
    alerta.textContent = mensaje;
    alerta.className = `alert mt-3 py-2 small text-center ${esExito ? 'alert-success' : 'alert-danger'}`;
    alerta.classList.remove("d-none");
}
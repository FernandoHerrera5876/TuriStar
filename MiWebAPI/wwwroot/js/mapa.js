document.addEventListener("DOMContentLoaded", () => {
    cargarDestinosEnMapa();
});

async function cargarDestinosEnMapa() {
    const contenedor = document.getElementById("listaLugaresMapa");

    try {
        // Hacemos fetch a la misma ruta que usamos en explorar.js
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Destino/todos`);
        const resultado = await respuesta.json();

        // Borramos el spinner
        contenedor.innerHTML = "";

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {
            generarListaLateral(resultado.objeto, contenedor);
        } else {
            contenedor.innerHTML = `<div class="alert alert-info small text-center">No hay lugares para mostrar en el mapa.</div>`;
        }

    } catch (error) {
        console.error("Error al cargar destinos:", error);
        contenedor.innerHTML = `<div class="alert alert-danger small text-center">Ocurrió un error de conexión.</div>`;
    }
}

function generarListaLateral(listaDestinos, contenedor) {
    listaDestinos.forEach((destino, index) => {

        // El primer elemento lo marcamos como seleccionado por defecto
        const isActive = index === 0 ? "border-start border-4 border-success bg-light" : "";

        // Tarjeta miniatura que llama a "actualizarMapa" al darle clic
        const html = `
            <div class="card border-0 shadow-sm mb-3 rounded-4 location-item ${isActive}" onclick="actualizarMapa(${destino.latitud}, ${destino.longitud}, this)">
                <div class="card-body p-3 d-flex gap-3 align-items-center">
                    <img src="${destino.urlFoto}" alt="${destino.nombre}" class="rounded-3 shadow-sm" style="width: 60px; height: 60px; object-fit: cover;">
                    <div>
                        <h6 class="fw-bold mb-1" style="font-size: 0.9rem;">${destino.nombre}</h6>
                        <p class="text-muted small mb-0"><i class="bi bi-geo-alt-fill text-success"></i> ${destino.municipio}</p>
                    </div>
                </div>
            </div>
        `;

        contenedor.insertAdjacentHTML('beforeend', html);
    });

    // Añadimos el botón del catálogo al final
    const btnCatalogo = `
        <a href="explorar.html" class="btn btn-outline-success w-100 rounded-pill fw-medium mt-3" style="color: #528233; border-color: #528233;">Ver catálogo completo</a>
    `;
    contenedor.insertAdjacentHTML('beforeend', btnCatalogo);

    // Inicializar el mapa con las coordenadas del primer destino de la lista
    if (listaDestinos.length > 0) {
        actualizarMapa(listaDestinos[0].latitud, listaDestinos[0].longitud, null);
    }
}

// Función que cambia el origen del iframe de Google Maps usando Latitud y Longitud
function actualizarMapa(lat, lon, elementoHtml) {
    const iframe = document.getElementById("iframeMapa");

    // Inyectamos las coordenadas en una URL embedida de Google Maps
    iframe.src = `https://www.google.com/maps?q=${lat},${lon}&hl=es&z=15&output=embed`;

    // Si se hizo clic en una tarjeta, le agregamos el borde verde y se lo quitamos a las demás
    if (elementoHtml) {
        const items = document.querySelectorAll('.location-item');
        items.forEach(item => {
            item.classList.remove('border-start', 'border-4', 'border-success', 'bg-light');
        });
        elementoHtml.classList.add('border-start', 'border-4', 'border-success', 'bg-light');
    }
}
document.addEventListener("DOMContentLoaded", () => {
    cargarDestinosEnMapa();
    configurarScrollBarraLateral();
});

function configurarScrollBarraLateral() {
    const lista = document.getElementById("listaLugaresMapa");
    if (!lista) return;

    let scrollTimeout;
    lista.addEventListener("scroll", () => {
        lista.classList.add("is-scrolling");
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            lista.classList.remove("is-scrolling");
        }, 220);
    }, { passive: true });
}

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
        const isActive = index === 0 ? "active-location" : "";

        // Tarjeta miniatura que llama a "actualizarMapa" al darle clic
        const html = `
            <div class="card mb-3 rounded-4 location-item ${isActive}" onclick="actualizarMapa(${destino.latitud}, ${destino.longitud}, this)">
                <div class="card-body p-3 d-flex gap-3 align-items-center overflow-hidden">
                    <img src="${destino.urlFoto}" alt="${destino.nombre}" class="rounded-3 shadow-sm flex-shrink-0" style="width: 60px; height: 60px; object-fit: cover;">
                    <div class="flex-grow-1" style="min-width: 0; overflow: hidden;">
                        <div class="location-scroll-text">
                            <h6 class="fw-bold mb-1 text-white location-scroll-title" style="font-size: 0.9rem;">${destino.nombre}</h6>
                        </div>
                        <p class="text-turistar-green small mb-0 text-truncate"><i class="bi bi-geo-alt-fill me-1"></i> ${destino.municipio}</p>
                    </div>
                </div>
            </div>
        `;

        contenedor.insertAdjacentHTML('beforeend', html);
    });

    // Calculamos cuánto necesita desplazarse cada título largo al pasar el cursor
    document.querySelectorAll('.location-item').forEach(card => {
        const box = card.querySelector('.location-scroll-text');
        const title = card.querySelector('.location-scroll-title');
        if (box && title) {
            const diff = title.scrollWidth - box.clientWidth;
            if (diff > 0) {
                title.style.setProperty('--scroll-x', `-${diff + 8}px`);
            }
        }
    });

    // Añadimos el botón del catálogo al final con el estilo de cristal iOS garantizado
    const btnCatalogo = `
        <a href="explorar.html" class="btn w-100 mt-3" style="background: rgba(74, 222, 128, 0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(74, 222, 128, 0.55); color: #ffffff; border-radius: 999px; padding: 0.65rem 1.4rem; font-weight: 600; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 6px 18px rgba(0, 0, 0, 0.35);">
            <i class="bi bi-grid-3x3-gap-fill me-2"></i>Ver catálogo completo
        </a>
    `;
    contenedor.insertAdjacentHTML('beforeend', btnCatalogo);

    // Inicializar el mapa con las coordenadas del primer destino de la lista
    if (listaDestinos.length > 0) {
        actualizarMapa(listaDestinos[0].latitud, listaDestinos[0].longitud, null);
    }
}

function actualizarMapa(lat, lon, elementoHtml) {
    const iframe = document.getElementById("iframeMapa");

    // Inyectamos las coordenadas en una URL embedida de Google Maps
    iframe.src = `https://www.google.com/maps?q=${lat},${lon}&hl=es&z=15&output=embed`;

    // Si se hizo clic en una tarjeta, le agregamos el estado activo y se lo quitamos a las demás
    if (elementoHtml) {
        const items = document.querySelectorAll('.location-item');
        items.forEach(item => {
            item.classList.remove('active-location');
        });
        elementoHtml.classList.add('active-location');

        // En celular (< 768px), sube suavemente hasta el mapa al tocar un lugar
        if (window.innerWidth < 768) {
            const contenedorMapa = document.getElementById("contenedorMapaPrincipal");
            if (contenedorMapa) {
                contenedorMapa.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }
}
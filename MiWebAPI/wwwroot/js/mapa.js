let todosLosDestinosMapa = [];
let paginaActualMapa = 1;
let destinoActivoIdMapa = null;
const LUGARES_MAPA_POR_PAGINA = 6;

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
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Destino/todos`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = "";

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {
            todosLosDestinosMapa = resultado.objeto;
            paginaActualMapa = 1;
            destinoActivoIdMapa = todosLosDestinosMapa[0].idDestino;

            actualizarVistaMapa();
            actualizarMapa(todosLosDestinosMapa[0].latitud, todosLosDestinosMapa[0].longitud, null, todosLosDestinosMapa[0].idDestino);
        } else {
            contenedor.innerHTML = `<div class="alert alert-info small text-center">No hay lugares para mostrar en el mapa.</div>`;
        }

    } catch (error) {
        console.error("Error al cargar destinos:", error);
        contenedor.innerHTML = `<div class="alert alert-danger small text-center">Ocurrió un error de conexión.</div>`;
    }
}

function actualizarVistaMapa() {
    const contenedor = document.getElementById("listaLugaresMapa");
    if (!contenedor) return;

    const totalPaginas = Math.max(1, Math.ceil(todosLosDestinosMapa.length / LUGARES_MAPA_POR_PAGINA));
    if (paginaActualMapa > totalPaginas) paginaActualMapa = totalPaginas;

    const inicio = (paginaActualMapa - 1) * LUGARES_MAPA_POR_PAGINA;
    const paginaItems = todosLosDestinosMapa.slice(inicio, inicio + LUGARES_MAPA_POR_PAGINA);

    contenedor.innerHTML = "";
    generarListaLateral(paginaItems, contenedor);
    contenedor.scrollTop = 0;

    renderizarPaginacion({
        contenedorId: "paginacionMapa",
        totalItems: todosLosDestinosMapa.length,
        porPagina: LUGARES_MAPA_POR_PAGINA,
        paginaActual: paginaActualMapa,
        compacto: true,
        onCambioPagina: (nuevaPagina) => {
            paginaActualMapa = nuevaPagina;
            actualizarVistaMapa();
        }
    });
}

function generarListaLateral(listaDestinos, contenedor) {
    listaDestinos.forEach(destino => {
        const isActive = destino.idDestino === destinoActivoIdMapa ? "active-location" : "";

        const html = `
            <div class="card mb-3 rounded-4 location-item ${isActive}" onclick="actualizarMapa(${destino.latitud}, ${destino.longitud}, this, ${destino.idDestino})">
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
}

function actualizarMapa(lat, lon, elementoHtml, idDestino = null) {
    const iframe = document.getElementById("iframeMapa");
    iframe.src = `https://www.google.com/maps?q=${lat},${lon}&hl=es&z=15&output=embed`;

    if (idDestino !== null) {
        destinoActivoIdMapa = idDestino;
    }

    if (elementoHtml) {
        const items = document.querySelectorAll('.location-item');
        items.forEach(item => item.classList.remove('active-location'));
        elementoHtml.classList.add('active-location');

        if (window.innerWidth < 768) {
            const contenedorMapa = document.getElementById("contenedorMapaPrincipal");
            if (contenedorMapa) {
                contenedorMapa.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }
}
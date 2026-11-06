let destinosGlobal = []; // Guardamos los destinos en memoria para filtrar rápido

document.addEventListener("DOMContentLoaded", () => {
    cargarDestinos();
    configurarBuscadorLocal();
});

async function cargarDestinos() {
    const contenedor = document.getElementById("contenedorDestinos");
    const spinner = document.getElementById("spinnerCarga");
    const mensajeEstado = document.getElementById("mensajeEstado");

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Destino/todos`);
        const resultado = await respuesta.json();

        spinner.classList.add("d-none");

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {
            destinosGlobal = resultado.objeto; // Guardamos en la variable global

            // Verificamos si alguien buscó desde el Header (ej. explorar.html?q=tula)
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');

            if (query) {
                const inputBusqueda = document.getElementById("inputBuscarDestino");
                if (inputBusqueda) inputBusqueda.value = query; // Escribimos el término en la barra
                filtrarDestinos(query); // Filtramos inmediatamente
            } else {
                generarTarjetasHTML(destinosGlobal, contenedor); // Mostramos todos por defecto
            }

        } else {
            mostrarMensaje("No se encontraron destinos registrados por el momento.", "info");
        }
    } catch (error) {
        console.error("Error al cargar destinos:", error);
        spinner.classList.add("d-none");
        mostrarMensaje("Ocurrió un error al cargar la información desde la base de datos.", "danger");
    }
}

// Escuchar lo que el usuario escribe en la barra grande
function configurarBuscadorLocal() {
    const inputBusqueda = document.getElementById("inputBuscarDestino");
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            filtrarDestinos(e.target.value);
        });
    }
}

// Función que filtra el arreglo en memoria y redibuja las tarjetas
function filtrarDestinos(texto) {
    const contenedor = document.getElementById("contenedorDestinos");
    const termino = texto.toLowerCase().trim();

    // Si borró todo, mostramos todos los destinos
    if (termino === "") {
        generarTarjetasHTML(destinosGlobal, contenedor);
        return;
    }

    // Buscamos coincidencias en nombre, municipio o descripción
    const destinosFiltrados = destinosGlobal.filter(d =>
        (d.nombre && d.nombre.toLowerCase().includes(termino)) ||
        (d.municipio && d.municipio.toLowerCase().includes(termino)) ||
        (d.descripcion && d.descripcion.toLowerCase().includes(termino))
    );

    if (destinosFiltrados.length > 0) {
        generarTarjetasHTML(destinosFiltrados, contenedor);
    } else {
        // Mensaje de que no hubo resultados
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-light border-0 shadow-sm text-center py-5 w-100">
                    <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-dark">No encontramos resultados para "${texto}"</h5>
                    <p class="text-muted small">Intenta buscar con otras palabras o revisar la ortografía.</p>
                </div>
            </div>`;
    }
}

function generarTarjetasHTML(listaDestinos, contenedor) {
    contenedor.innerHTML = ""; // Limpiamos contenedor

    listaDestinos.forEach(destino => {
        const calificacion = destino.calificacionPromedio || 0;
        let estrellasHTML = "";
        for (let i = 1; i <= 5; i++) {
            if (calificacion >= i) estrellasHTML += `<i class="bi bi-star-fill"></i>`;
            else if (calificacion >= i - 0.5) estrellasHTML += `<i class="bi bi-star-half"></i>`;
            else estrellasHTML += `<i class="bi bi-star text-muted"></i>`;
        }

        const html = `
            <div class="col">
                <a href="detalle.html?id=${destino.idDestino}" class="text-decoration-none text-dark">
                    <div class="card destination-card h-100 shadow-sm border-0">
                        <img src="${destino.urlFoto}" class="card-img-top" alt="${destino.nombre}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column p-4">
                            <h3 class="h5 fw-bold mb-1">${destino.nombre}</h3>
                            <p class="text-muted small mb-2"><i class="bi bi-geo-alt text-success"></i> ${destino.municipio}, Hidalgo</p>
                            <p class="small text-secondary mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${destino.descripcion}
                            </p>
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                                <div class="text-warning small">
                                    ${estrellasHTML}
                                    <span class="text-dark fw-medium ms-1">${calificacion.toFixed(1)}</span>
                                </div>
                                <span class="badge bg-light text-success border border-success fw-medium px-2 py-1">Ver Detalles</span>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `;

        contenedor.insertAdjacentHTML('beforeend', html);
    });
}

function mostrarMensaje(texto, tipo) {
    const mensajeEstado = document.getElementById("mensajeEstado");
    if (mensajeEstado) {
        mensajeEstado.textContent = texto;
        mensajeEstado.className = `alert alert-${tipo} text-center`;
        mensajeEstado.classList.remove("d-none");
    }
}
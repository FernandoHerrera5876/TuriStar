document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar sesión
    const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usuarioGuardado) {
        window.location.replace("login.html");
        return;
    }

    const usuarioSesion = JSON.parse(usuarioGuardado);
    const idUsuario = usuarioSesion.idUsuario || usuarioSesion.IdUsuario;

    // Ponemos el nombre base mientras llegan los datos
    document.getElementById('perfilNombre').textContent = usuarioSesion.nombre || 'Cargando...';

    // 2. Traer los datos reales y frescos de la Base de Datos
    await cargarDatosCompletos(idUsuario);

    // 3. Cargar las reseñas
    cargarMisResenas(idUsuario);
});

async function cargarDatosCompletos(id) {
    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Auth/${id}`);
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            const usr = resultado.objeto;

            // Actualizar textos
            document.getElementById('perfilNombre').textContent = `${usr.nombres} ${usr.apellidos}`;
            document.getElementById('perfilCorreo').textContent = usr.correo || 'Sin correo registrado';

            // Actualizar la foto
            const divFoto = document.getElementById('perfilInicial').parentElement;
            if (usr.fotoPerfil && usr.fotoPerfil !== "") {
                divFoto.innerHTML = `<img src="${usr.fotoPerfil}" class="w-100 h-100 object-fit-cover">`;
            } else {
                divFoto.innerHTML = `<span id="perfilInicial">${usr.nombres.charAt(0).toUpperCase()}</span>`;
            }
        }
    } catch (error) {
        console.error("Error al obtener la foto de perfil:", error);
    }
}

async function cargarMisResenas(idUsuario) {
    const contenedor = document.getElementById('contenedorResenas');

    try {
        // Ahora SÍ consultamos la base de datos real
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/usuario/${idUsuario}`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = ""; // Limpiamos contenedor

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {

            // Si el usuario tiene reseñas, las dibujamos una por una
            resultado.objeto.forEach(resena => {
                let estrellasHTML = "";
                for (let i = 1; i <= 5; i++) {
                    estrellasHTML += i <= resena.calificacion
                        ? '<i class="bi bi-star-fill text-warning"></i> '
                        : '<i class="bi bi-star text-muted"></i> ';
                }

                const fecha = new Date(resena.fechaCreacion).toLocaleDateString();

                const html = `
                    <div class="card shadow-sm border-0 rounded-4 mb-3">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="fw-bold mb-0 text-success"><i class="bi bi-geo-alt-fill"></i> ${resena.nombreDestino}</h6>
                                <small class="text-muted">${fecha}</small>
                            </div>
                            <div class="mb-2 fs-5">
                                ${estrellasHTML}
                            </div>
                            <p class="text-secondary mb-3">${resena.comentario}</p>
                            <a href="detalle.html?id=${resena.idDestino}" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
                                Ver lugar
                            </a>
                        </div>
                    </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', html);
            });

        } else {
            // Si no tiene reseñas, mostramos la pantalla vacía
            contenedor.innerHTML = `
                <div class="card shadow-sm border-0 rounded-4 text-center py-5">
                    <div class="card-body">
                        <i class="bi bi-chat-square-text text-muted" style="font-size: 4rem;"></i>
                        <h4 class="mt-3 fw-bold text-dark">Aún no has escrito ninguna reseña</h4>
                        <p class="text-muted mb-4">Tu opinión ayuda a otros viajeros. ¡Comparte tus experiencias con la comunidad de TuriStar!</p>
                        <a href="explorar.html" class="btn bg-turistar-green text-white rounded-pill px-4 fw-medium">
                            <i class="bi bi-search"></i> Explorar destinos para reseñar
                        </a>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar reseñas:", error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center">Ocurrió un error al cargar tus reseñas.</div>`;
    }
}

// --- LÓGICA DE PESTAÑAS Y LUGARES GUARDADOS ---
document.getElementById('tabResenas').addEventListener('click', (e) => {
    e.preventDefault();
    cambiarPestana('tabResenas', 'tabGuardados', 'contenedorResenas', 'contenedorGuardados');
});

document.getElementById('tabGuardados').addEventListener('click', async (e) => {
    e.preventDefault();
    cambiarPestana('tabGuardados', 'tabResenas', 'contenedorGuardados', 'contenedorResenas');

    // Cargar los favoritos al darle clic a la pestaña
    const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar'));
    await cargarMisGuardados(usuarioSesion.idUsuario || usuarioSesion.IdUsuario);
});

function cambiarPestana(tabActiva, tabInactiva, contActivo, contInactivo) {
    const tActiva = document.getElementById(tabActiva);
    tActiva.classList.add('active', 'fw-bold', 'text-turistar-green', 'border-bottom', 'border-2', 'border-success');
    tActiva.classList.remove('text-muted');

    const tInactiva = document.getElementById(tabInactiva);
    tInactiva.classList.remove('active', 'fw-bold', 'text-turistar-green', 'border-bottom', 'border-2', 'border-success');
    tInactiva.classList.add('text-muted');

    document.getElementById(contActivo).classList.remove('d-none');
    document.getElementById(contInactivo).classList.add('d-none');
}

async function cargarMisGuardados(idUsuario) {
    const contenedor = document.getElementById('contenedorGuardados');
    contenedor.innerHTML = '<div class="col-12 text-center my-4"><div class="spinner-border text-success"></div></div>';

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Favorito/usuario/${idUsuario}`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = "";

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {
            resultado.objeto.forEach(destino => {
                const calificacion = destino.calificacionPromedio || 0;
                const html = `
                    <div class="col">
                        <a href="detalle.html?id=${destino.idDestino}" class="text-decoration-none text-dark">
                            <div class="card h-100 shadow-sm border-0 rounded-4">
                                <img src="${destino.urlFoto}" class="card-img-top rounded-top-4" style="height: 150px; object-fit: cover;">
                                <div class="card-body p-3">
                                    <h6 class="fw-bold mb-1">${destino.nombre}</h6>
                                    <p class="text-muted small mb-2"><i class="bi bi-geo-alt text-success"></i> ${destino.municipio}</p>
                                    <div class="text-warning small"><i class="bi bi-star-fill"></i> <span class="text-dark fw-medium">${calificacion.toFixed(1)}</span></div>
                                </div>
                            </div>
                        </a>
                    </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', html);
            });
        } else {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-bookmark-heart text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-dark">No tienes lugares guardados</h5>
                    <p class="text-muted small">Explora y guarda tus destinos favoritos para verlos aquí.</p>
                </div>
            `;
        }
    } catch (error) { console.error("Error al cargar favoritos", error); }
}
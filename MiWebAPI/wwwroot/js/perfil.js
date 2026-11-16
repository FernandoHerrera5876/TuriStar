document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar sesión
    const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usuarioGuardado) {
        window.location.replace("login.html");
        return;
    }

    const usuarioSesion = JSON.parse(usuarioGuardado);

    // SOLUCIÓN: Aseguramos la extracción del ID y lo convertimos a entero
    const idUsuario = parseInt(usuarioSesion.idUsuario || usuarioSesion.IdUsuario);

    // Si el idUsuario es inválido (NaN o 0), sacamos al usuario por seguridad
    if (!idUsuario || isNaN(idUsuario)) {
        localStorage.removeItem('usuarioTuriStar');
        window.location.replace("login.html");
        return;
    }

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
        // Consultamos la base de datos real
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

                // Galería de fotos de la reseña
                let galeriaHTML = "";
                if (resena.fotos && resena.fotos.length > 0) {
                    galeriaHTML = '<div class="d-flex gap-2 mt-3 flex-wrap">';
                    resena.fotos.forEach(url => {
                        const urlBackend = CONFIG.API_URL_BASE.replace('/api/Auth', '').replace('/api/Resena', '').replace('/api', '');
                        galeriaHTML += `<img src="${urlBackend}${url}" 
                                        class="rounded-3 shadow-sm object-fit-cover" 
                                        style="width: 100px; height: 100px; border: 1px solid #eaeaea;">`;
                    });
                    galeriaHTML += '</div>';
                }

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
                            
                            <!-- Galería de fotos locales de la reseña -->
                            ${galeriaHTML}

                            <div class="mt-3">
                                <a href="detalle.html?id=${resena.idDestino}" class="btn btn-sm btn-outline-secondary rounded-pill px-3 me-2">Ver lugar</a>
                                
                                <!-- BOTÓN DE EDITAR -->
                                <button onclick="abrirModalEdicion(${resena.idResena}, ${resena.calificacion}, \`${resena.comentario.replace(/`/g, '')}\`)" class="btn btn-sm btn-warning rounded-pill px-3 text-dark fw-medium me-2">
                                    <i class="bi bi-pencil-square"></i> Editar
                                </button>
                                
                                <!-- BOTÓN DE BORRAR (Con doble confirmación y texto visible) -->
                                <button onclick="borrarMiResena(this, ${resena.idResena})" class="btn btn-sm btn-outline-danger rounded-pill px-3">
                                    <i class="bi bi-trash"></i> Borrar
                                </button>
                            </div>
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

let modalEdicionInstance = null;

function abrirModalEdicion(idResena, calificacionActual, comentarioActual) {
    document.getElementById('editIdResena').value = idResena;
    document.getElementById('editCalificacion').value = calificacionActual;
    document.getElementById('editComentario').value = comentarioActual;

    document.getElementById('alertaEditarResena').classList.add('d-none');

    if (!modalEdicionInstance) {
        modalEdicionInstance = new bootstrap.Modal(document.getElementById('modalEditarResena'));
    }
    modalEdicionInstance.show();
}

document.getElementById('btnGuardarEdicionResena').addEventListener('click', async () => {
    const btn = document.getElementById('btnGuardarEdicionResena');
    const alerta = document.getElementById('alertaEditarResena');

    const idResena = document.getElementById('editIdResena').value;
    const calificacion = document.getElementById('editCalificacion').value;
    const comentario = document.getElementById('editComentario').value.trim();

    const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar'));
    if (!usuarioSesion) return;

    if (!comentario) {
        alerta.textContent = "El comentario no puede ir vacío.";
        alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Actualizando...";
    alerta.classList.add('d-none');

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/actualizar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                IdResena: parseInt(idResena),
                IdUsuario: usuarioSesion.idUsuario || usuarioSesion.IdUsuario,
                Calificacion: parseFloat(calificacion),
                Comentario: comentario
            })
        });
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            alerta.textContent = "¡Reseña actualizada correctamente!";
            alerta.className = "alert alert-success d-block small py-2 text-center mt-2";

            setTimeout(() => {
                modalEdicionInstance.hide();
                cargarMisResenas(usuarioSesion.idUsuario || usuarioSesion.IdUsuario);
            }, 1500);
        } else {
            alerta.textContent = resultado.mensaje || "Error al actualizar.";
            alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
        }
    } catch (error) {
        alerta.textContent = "Error de conexión con el servidor.";
        alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
    } finally {
        btn.disabled = false;
        btn.textContent = "Actualizar Reseña";
    }
});


// ===================================================================================
// SECCIÓN CRÍTICA DE BOTONES (Sin error de this)
// ===================================================================================

// --- ACCIÓN DEL BOTÓN CERRAR SESIÓN ---
function cerrarSesionPerfil() {
    localStorage.removeItem('usuarioTuriStar');
    window.location.replace("login.html");
}

// --- ACCIÓN DEL BOTÓN ELIMINAR CUENTA (Doble confirmación) ---
async function borrarCuentaPerfil(btn) {
    if (!btn.classList.contains('confirming')) {
        btn.classList.add('confirming', 'btn-danger', 'text-white');
        btn.classList.remove('btn-outline-danger');
        const txtOrg = btn.innerHTML;
        btn.innerHTML = '¡Es irreversible! Clic para borrar cuenta';

        setTimeout(() => {
            btn.classList.remove('confirming', 'btn-danger', 'text-white');
            btn.classList.add('btn-outline-danger');
            btn.innerHTML = txtOrg;
        }, 3000);
        return;
    }

    const usr = JSON.parse(localStorage.getItem('usuarioTuriStar'));
    if (!usr) return;

    const id = usr.idUsuario || usr.IdUsuario;
    try {
        const req = await fetch(`${CONFIG.API_URL_BASE}/Usuario/eliminar/${id}`, { method: 'DELETE' });
        if (req.ok) {
            localStorage.removeItem('usuarioTuriStar');
            window.location.replace("login.html");
        }
    } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
    }
}

// --- ACCIÓN PARA BORRAR UNA RESEÑA (Doble confirmación) ---
async function borrarMiResena(btn, idResena) {
    if (!btn.classList.contains('confirming')) {
        btn.classList.add('confirming', 'btn-danger', 'text-white');
        btn.classList.remove('btn-outline-danger');
        btn.innerHTML = '<i class="bi bi-check-circle"></i> ¿Borrar?';
        setTimeout(() => {
            btn.classList.remove('confirming', 'btn-danger', 'text-white');
            btn.classList.add('btn-outline-danger');
            btn.innerHTML = '<i class="bi bi-trash"></i> Borrar';
        }, 3000);
        return;
    }

    const usr = JSON.parse(localStorage.getItem('usuarioTuriStar'));
    const idUsr = usr.idUsuario || usr.IdUsuario;

    try {
        const req = await fetch(`${CONFIG.API_URL_BASE}/Resena/eliminar/${idResena}/${idUsr}`, { method: 'DELETE' });
        if (req.ok) {
            cargarMisResenas(idUsr);
        }
    } catch (error) { console.error(error); }
}
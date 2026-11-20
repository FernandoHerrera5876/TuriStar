let resenasUsuarioCache = new Map();

document.addEventListener('DOMContentLoaded', async () => {
    // Quitar foco antes de ocultar modales para evitar advertencias de accesibilidad
    const modalEditarEl = document.getElementById('modalEditarResena');
    if (modalEditarEl) {
        modalEditarEl.addEventListener('hide.bs.modal', () => {
            if (document.activeElement && modalEditarEl.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        });
    }

    // 1. Validar sesión
    const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usuarioGuardado) {
        window.location.replace("login.html");
        return;
    }

    const usuarioSesion = JSON.parse(usuarioGuardado);
    const idUsuario = parseInt(usuarioSesion.idUsuario || usuarioSesion.IdUsuario, 10);

    if (!idUsuario || isNaN(idUsuario)) {
        localStorage.removeItem('usuarioTuriStar');
        window.location.replace("login.html");
        return;
    }

    const elNombre = document.getElementById('perfilNombre');
    if (elNombre) elNombre.textContent = usuarioSesion.nombre || 'Cargando...';

    // 2. Traer los datos reales y frescos de la Base de Datos
    await cargarDatosCompletos(idUsuario);

    // 3. Cargar las reseñas
    await cargarMisResenas(idUsuario);
});

async function cargarDatosCompletos(id) {
    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Auth/${id}`);
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess && resultado.objeto) {
            const usr = resultado.objeto;
            const nombres = usr.nombres ?? usr.Nombres ?? "";
            const apellidos = usr.apellidos ?? usr.Apellidos ?? "";
            const correo = usr.correo ?? usr.Correo ?? "Sin correo registrado";
            const fotoPerfil = usr.fotoPerfil ?? usr.FotoPerfil ?? "";

            const elNombre = document.getElementById('perfilNombre');
            const elCorreo = document.getElementById('perfilCorreo');
            if (elNombre) elNombre.textContent = `${nombres} ${apellidos}`.trim() || "Viajero";
            if (elCorreo) elCorreo.textContent = correo;

            const spanInicial = document.getElementById('perfilInicial');
            const divFoto = spanInicial ? spanInicial.parentElement : null;
            if (divFoto) {
                if (fotoPerfil !== "") {
                    divFoto.innerHTML = `<img src="${fotoPerfil}" class="w-100 h-100 object-fit-cover">`;
                } else {
                    const inicial = (nombres || "U").charAt(0).toUpperCase();
                    divFoto.innerHTML = `<span id="perfilInicial">${inicial}</span>`;
                }
            }
        }
    } catch (error) {
        console.error("Error al obtener los datos de perfil:", error);
    }
}

async function cargarMisResenas(idUsuario) {
    const contenedor = document.getElementById('contenedorResenas');
    if (!contenedor) return;

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/usuario/${idUsuario}`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = "";
        resenasUsuarioCache.clear();

        if (respuesta.ok && resultado.isSuccess && Array.isArray(resultado.objeto) && resultado.objeto.length > 0) {
            resultado.objeto.forEach(resena => {
                const idRes = resena.idResena ?? resena.IdResena;
                resenasUsuarioCache.set(Number(idRes), resena);

                const calif = resena.calificacion ?? resena.Calificacion ?? 5;
                const comentarioTxt = resena.comentario ?? resena.Comentario ?? "";
                const destinoTxt = resena.nombreDestino ?? resena.NombreDestino ?? "Destino";
                const fechaRaw = resena.fechaCreacion ?? resena.FechaCreacion;
                const idDestino = resena.idDestino ?? resena.IdDestino;
                const fotos = resena.fotos ?? resena.Fotos;

                let estrellasHTML = "";
                for (let i = 1; i <= 5; i++) {
                    estrellasHTML += i <= calif
                        ? '<i class="bi bi-star-fill text-warning" style="filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.45));"></i> '
                        : '<i class="bi bi-star text-secondary"></i> ';
                }

                const fecha = fechaRaw ? new Date(fechaRaw).toLocaleDateString() : "";

                let galeriaHTML = "";
                if (Array.isArray(fotos) && fotos.length > 0) {
                    galeriaHTML = '<div class="d-flex gap-2 mt-3 flex-wrap">';
                    fotos.forEach(url => {
                        const urlBackend = CONFIG.API_URL_BASE.replace('/api/Auth', '').replace('/api/Resena', '').replace('/api', '');
                        galeriaHTML += `<img src="${urlBackend}${url}" 
                                        class="rounded-3 shadow-sm object-fit-cover" 
                                        style="width: 100px; height: 100px; border: 1.5px solid rgba(74, 222, 128, 0.45);">`;
                    });
                    galeriaHTML += '</div>';
                }

                const html = `
                    <div class="card profile-panel-card border-0 rounded-4 mb-3">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="fw-bold mb-0 text-turistar-green"><i class="bi bi-geo-alt-fill me-1"></i> ${destinoTxt}</h6>
                                <small class="text-muted">${fecha}</small>
                            </div>
                            <div class="mb-2 fs-5">
                                ${estrellasHTML}
                            </div>
                            <p class="text-light mb-3" style="color: #cbd5e1 !important;">${comentarioTxt}</p>
                            
                            ${galeriaHTML}

                            <div class="mt-3 d-flex flex-wrap gap-2">
                                <a href="detalle.html?id=${idDestino}" class="btn btn-glass-ios btn-sm px-3">Ver lugar</a>
                                
                                <button type="button" onclick="abrirModalEdicion(${idRes})" class="btn btn-glass-ios-amber btn-sm px-3">
                                    <i class="bi bi-pencil-square me-1"></i> Editar
                                </button>
                                
                                <button type="button" onclick="borrarMiResena(this, ${idRes})" class="btn btn-glass-ios-red btn-sm px-3">
                                    <i class="bi bi-trash me-1"></i> Borrar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', html);
            });
        } else {
            contenedor.innerHTML = `
                <div class="card profile-panel-card border-0 rounded-4 text-center py-5 px-4">
                    <div class="card-body d-flex flex-column align-items-center">
                        <div class="empty-state-icon-ring d-flex align-items-center justify-content-center mb-3">
                            <i class="bi bi-chat-square-text text-turistar-green" style="font-size: 2.4rem; filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.55));"></i>
                        </div>
                        <h4 class="mt-1 fw-bold text-white">Aún no has escrito ninguna reseña</h4>
                        <p class="text-muted mb-4" style="max-width: 420px;">Tu opinión ayuda a otros viajeros. ¡Comparte tus experiencias con la comunidad de TuriStar!</p>
                        <a href="explorar.html" class="btn btn-glass-ios rounded-pill px-4 fw-medium">
                            <i class="bi bi-search me-1"></i> Explorar destinos para reseñar
                        </a>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar reseñas:", error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center rounded-4">Ocurrió un error al cargar tus reseñas.</div>`;
    }
}

// --- LÓGICA DE PESTAÑAS Y LUGARES GUARDADOS ---
const tabResenas = document.getElementById('tabResenas');
if (tabResenas) {
    tabResenas.addEventListener('click', (e) => {
        e.preventDefault();
        cambiarPestana('tabResenas', 'tabGuardados', 'contenedorResenas', 'contenedorGuardados');
    });
}

const tabGuardados = document.getElementById('tabGuardados');
if (tabGuardados) {
    tabGuardados.addEventListener('click', async (e) => {
        e.preventDefault();
        cambiarPestana('tabGuardados', 'tabResenas', 'contenedorGuardados', 'contenedorResenas');

        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar') || 'null');
        if (usuarioSesion) {
            await cargarMisGuardados(usuarioSesion.idUsuario || usuarioSesion.IdUsuario);
        }
    });
}

function cambiarPestana(tabActiva, tabInactiva, contActivo, contInactivo) {
    const tActiva = document.getElementById(tabActiva);
    const tInactiva = document.getElementById(tabInactiva);
    const cActivo = document.getElementById(contActivo);
    const cInactivo = document.getElementById(contInactivo);

    if (tActiva) tActiva.classList.add('active');
    if (tInactiva) tInactiva.classList.remove('active');
    if (cActivo) cActivo.classList.remove('d-none');
    if (cInactivo) cInactivo.classList.add('d-none');
}

async function cargarMisGuardados(idUsuario) {
    const contenedor = document.getElementById('contenedorGuardados');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="col-12 text-center my-4"><div class="spinner-border text-success"></div></div>';

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Favorito/usuario/${idUsuario}`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = "";

        if (respuesta.ok && resultado.isSuccess && Array.isArray(resultado.objeto) && resultado.objeto.length > 0) {
            resultado.objeto.forEach(destino => {
                const calificacion = destino.calificacionPromedio || 0;
                const html = `
                    <div class="col">
                        <a href="detalle.html?id=${destino.idDestino}" class="text-decoration-none">
                            <div class="card destination-card h-100 border-0 rounded-4">
                                <img src="${destino.urlFoto}" class="card-img-top rounded-top-4" style="height: 150px; object-fit: cover;">
                                <div class="card-body p-3">
                                    <h6 class="fw-bold mb-1 text-white">${destino.nombre}</h6>
                                    <p class="text-turistar-green small mb-2"><i class="bi bi-geo-alt-fill me-1"></i> ${destino.municipio}</p>
                                    <div class="rating-badge d-inline-block"><i class="bi bi-star-fill text-warning me-1"></i> <span>${calificacion.toFixed(1)}</span></div>
                                </div>
                            </div>
                        </a>
                    </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', html);
            });
        } else {
            contenedor.innerHTML = `
                <div class="col-12">
                    <div class="card profile-panel-card text-center py-5 px-4">
                        <div class="card-body d-flex flex-column align-items-center">
                            <div class="empty-state-icon-ring d-flex align-items-center justify-content-center mb-3">
                                <i class="bi bi-bookmark-heart text-turistar-green" style="font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.5));"></i>
                            </div>
                            <h5 class="mt-1 fw-bold text-white">No tienes lugares guardados</h5>
                            <p class="text-muted small mb-0" style="max-width: 380px;">Explora y guarda tus destinos favoritos para verlos aquí.</p>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar favoritos", error);
    }
}

function abrirModalEdicion(idResena) {
    const resena = resenasUsuarioCache.get(Number(idResena));
    if (!resena) {
        console.warn("No se encontró la reseña en caché con id:", idResena);
        return;
    }

    const calif = resena.calificacion ?? resena.Calificacion ?? 5;
    const comentario = resena.comentario ?? resena.Comentario ?? "";

    const elId = document.getElementById('editIdResena');
    const elCalif = document.getElementById('editCalificacion');
    const elComent = document.getElementById('editComentario');
    const alerta = document.getElementById('alertaEditarResena');

    if (elId) elId.value = idResena;
    if (elCalif) elCalif.value = Math.round(Number(calif));
    if (elComent) elComent.value = comentario;

    if (alerta) {
        alerta.classList.add('d-none');
        alerta.textContent = "";
    }

    const modalEl = document.getElementById('modalEditarResena');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const modalInst = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInst.show();
    }
}

document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "formEditarResena") {
        e.preventDefault();
        const btn = document.getElementById("btnGuardarEdicionResena");
        if (btn) btn.click();
    }
});

document.addEventListener("click", async (e) => {
    const btn = e.target.closest("#btnGuardarEdicionResena");
    if (!btn) return;

    e.preventDefault();

    const alerta = document.getElementById("alertaEditarResena");
    const idResena = parseInt(document.getElementById("editIdResena")?.value, 10);
    const calificacion = parseInt(document.getElementById("editCalificacion")?.value, 10);
    const comentario = document.getElementById("editComentario")?.value.trim() || "";

    const usuarioGuardado = localStorage.getItem("usuarioTuriStar");
    if (!usuarioGuardado) return;

    const usuarioSesion = JSON.parse(usuarioGuardado);
    const idUsuario = parseInt(usuarioSesion.idUsuario || usuarioSesion.IdUsuario, 10);

    if (!comentario) {
        if (alerta) {
            alerta.textContent = "El comentario no puede ir vacío.";
            alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
        }
        return;
    }

    const resenaOriginal = resenasUsuarioCache.get(idResena) || {};
    const idDestino = parseInt(resenaOriginal.idDestino ?? resenaOriginal.IdDestino ?? 0, 10);

    const payload = {
        IdResena: idResena,
        idResena: idResena,
        IdUsuario: idUsuario,
        idUsuario: idUsuario,
        Calificacion: calificacion,
        calificacion: calificacion,
        Comentario: comentario,
        comentario: comentario
    };
    if (idDestino > 0) {
        payload.IdDestino = idDestino;
        payload.idDestino = idDestino;
    }

    btn.disabled = true;
    const textoPrevio = btn.textContent;
    btn.textContent = "Actualizando...";
    if (alerta) alerta.classList.add("d-none");

    const rutas = [
        { url: `${CONFIG.API_URL_BASE}/Resena/actualizar`, method: "PUT" },
        { url: `${CONFIG.API_URL_BASE}/Resena/actualizar`, method: "POST" }
    ];

    try {
        let respuesta = null;
        let resultado = null;

        for (const r of rutas) {
            respuesta = await fetch(r.url, {
                method: r.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            try {
                resultado = await respuesta.json();
            } catch (_) {
                resultado = null;
            }

            if (respuesta.status !== 404 && respuesta.status !== 405) {
                break;
            }
        }

        const ok = respuesta && respuesta.ok && (resultado === null || resultado.isSuccess !== false);

        if (ok) {
            if (alerta) {
                alerta.textContent = (resultado && resultado.mensaje) || "¡Reseña actualizada correctamente!";
                alerta.className = "alert alert-success d-block small py-2 text-center mt-2";
            }
            setTimeout(() => {
                const modalEl = document.getElementById("modalEditarResena");
                if (modalEl && document.activeElement && modalEl.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
                const modalInst = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
                if (modalInst) modalInst.hide();
                cargarMisResenas(idUsuario);
            }, 900);
        } else {
            const msgApi = (resultado && (resultado.mensaje || resultado.message || resultado.title)) || "";
            if (alerta) {
                alerta.textContent = `Error ${respuesta ? respuesta.status : ""}: ${msgApi || "No se pudo actualizar la reseña."}`;
                alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
            }
            console.warn("Respuesta actualizar reseña:", respuesta?.status, resultado, payload);
        }
    } catch (error) {
        console.error("Error al actualizar reseña:", error);
        if (alerta) {
            alerta.textContent = "Error de conexión con el servidor.";
            alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
        }
    } finally {
        btn.disabled = false;
        btn.textContent = textoPrevio || "Actualizar Reseña";
    }
});

// ===================================================================================
// SECCIÓN CRÍTICA DE BOTONES (Sin error de this)
// ===================================================================================

function cerrarSesionPerfil() {
    localStorage.removeItem('usuarioTuriStar');
    window.location.replace("login.html");
}

async function borrarCuentaPerfil(btn) {
    if (!btn.classList.contains('confirming')) {
        btn.classList.add('confirming');
        const txtOrg = btn.innerHTML;
        btn.innerHTML = '¡Es irreversible! Clic para borrar cuenta';

        setTimeout(() => {
            btn.classList.remove('confirming');
            btn.innerHTML = txtOrg;
        }, 3000);
        return;
    }

    const usr = JSON.parse(localStorage.getItem('usuarioTuriStar') || 'null');
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

async function borrarMiResena(btn, idResena) {
    if (!btn.classList.contains('confirming')) {
        btn.classList.add('confirming');
        btn.innerHTML = '<i class="bi bi-check-circle"></i> ¿Borrar?';
        setTimeout(() => {
            btn.classList.remove('confirming');
            btn.innerHTML = '<i class="bi bi-trash"></i> Borrar';
        }, 3000);
        return;
    }

    const usr = JSON.parse(localStorage.getItem('usuarioTuriStar') || 'null');
    if (!usr) return;
    const idUsr = usr.idUsuario || usr.IdUsuario;

    try {
        const req = await fetch(`${CONFIG.API_URL_BASE}/Resena/eliminar/${idResena}/${idUsr}`, { method: 'DELETE' });
        if (req.ok) {
            cargarMisResenas(idUsr);
        }
    } catch (error) {
        console.error(error);
    }
}
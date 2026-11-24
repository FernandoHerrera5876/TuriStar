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
    actualizarVistaRolPerfil(Boolean(usuarioSesion.esAdmin ?? usuarioSesion.EsAdmin));
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
            const esAdminBD = usr.esAdmin ?? usr.EsAdmin;
            if (esAdminBD === true) {
                actualizarVistaRolPerfil(true);
            }
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
                const fotos = resena.fotos ?? resena.Fotos ?? resena.fotosResena;

                let estrellasHTML = "";
                for (let i = 1; i <= 5; i++) {
                    estrellasHTML += i <= calif
                        ? '<i class="bi bi-star-fill text-warning" style="filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.45));"></i> '
                        : '<i class="bi bi-star text-secondary"></i> ';
                }

                const fecha = fechaRaw ? new Date(fechaRaw).toLocaleDateString() : "";
                const galeriaHTML = construirGaleriaResenaHTML(fotos);

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

let editFotosOriginales = [];
let editFotosAEliminar = new Set();
let editArchivosNuevos = [];
let editPreviewUrls = [];
let actualizandoResena = false;

function limpiarPreviewsEdicion() {
    editPreviewUrls.forEach(u => URL.revokeObjectURL(u));
    editPreviewUrls = [];
}

function renderizarFotosActualesEdicion() {
    const cont = document.getElementById('editFotosActuales');
    if (!cont) return;
    cont.innerHTML = "";

    if (editFotosOriginales.length === 0) {
        cont.innerHTML = `<span class="small text-muted">Esta reseña no tiene fotos todavía.</span>`;
        return;
    }

    editFotosOriginales.forEach((urlOriginal) => {
        const marcada = editFotosAEliminar.has(urlOriginal);
        const srcCompleto = obtenerUrlImagenResena(urlOriginal);

        const item = document.createElement('div');
        item.className = `edit-photo-item${marcada ? ' marked-delete' : ''}`;
        item.innerHTML = `
            <img src="${srcCompleto}" alt="Foto actual">
            ${marcada ? '<span class="edit-photo-badge-del">Se borrará</span>' : ''}
            <button type="button" class="edit-photo-action" title="${marcada ? 'Deshacer eliminación' : 'Eliminar foto'}">
                <i class="bi ${marcada ? 'bi-arrow-counterclockwise' : 'bi-x-lg'}"></i>
            </button>
        `;

        item.querySelector('.edit-photo-action').addEventListener('click', () => {
            if (editFotosAEliminar.has(urlOriginal)) {
                editFotosAEliminar.delete(urlOriginal);
            } else {
                editFotosAEliminar.add(urlOriginal);
            }
            renderizarFotosActualesEdicion();
        });

        cont.appendChild(item);
    });
}

function renderizarPreviewsNuevasEdicion() {
    const cont = document.getElementById('editPreviewNuevas');
    if (!cont) return;

    limpiarPreviewsEdicion();
    cont.innerHTML = "";

    editArchivosNuevos.forEach((file, index) => {
        const blobUrl = URL.createObjectURL(file);
        editPreviewUrls.push(blobUrl);

        const item = document.createElement('div');
        item.className = 'edit-photo-item';
        item.innerHTML = `
            <img src="${blobUrl}" alt="${file.name}">
            <button type="button" class="edit-photo-action" title="Quitar foto nueva">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        item.querySelector('.edit-photo-action').addEventListener('click', () => {
            editArchivosNuevos.splice(index, 1);
            renderizarPreviewsNuevasEdicion();
        });

        cont.appendChild(item);
    });
}

document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "editFotosNuevas") {
        const nuevos = Array.from(e.target.files || []);
        if (nuevos.length > 0) {
            editArchivosNuevos.push(...nuevos);
            renderizarPreviewsNuevasEdicion();
        }
        // Limpiamos el input para permitir volver a elegir más archivos
        e.target.value = "";
    }
});

function abrirModalEdicion(idResena) {
    const resena = resenasUsuarioCache.get(Number(idResena));
    if (!resena) {
        console.warn("No se encontró la reseña en caché con id:", idResena);
        return;
    }

    const calif = resena.calificacion ?? resena.Calificacion ?? 5;
    const comentario = resena.comentario ?? resena.Comentario ?? "";
    const fotosRaw = resena.fotos ?? resena.Fotos ?? [];

    editFotosOriginales = Array.isArray(fotosRaw)
        ? fotosRaw.map(u => String(u).trim()).filter(Boolean)
        : [];
    editFotosAEliminar = new Set();
    editArchivosNuevos = [];

    const inputNuevas = document.getElementById('editFotosNuevas');
    if (inputNuevas) inputNuevas.value = "";

    renderizarFotosActualesEdicion();
    renderizarPreviewsNuevasEdicion();

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
    if (actualizandoResena) return;

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

    const formData = new FormData();
    formData.append("idResena", idResena);
    formData.append("idUsuario", idUsuario);
    formData.append("calificacion", calificacion);
    formData.append("comentario", comentario);

    editFotosAEliminar.forEach(url => formData.append("fotosEliminar", url));
    editArchivosNuevos.forEach(file => formData.append("fotosNuevas", file));

    actualizandoResena = true;
    btn.disabled = true;
    const textoPrevio = btn.textContent;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...';
    if (alerta) alerta.classList.add("d-none");

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/actualizar`, {
            method: "PUT",
            body: formData
        });

        let resultado = null;
        try {
            resultado = await respuesta.json();
        } catch (_) {
            resultado = null;
        }

        const ok = respuesta.ok && (resultado === null || resultado.isSuccess !== false);

        if (ok) {
            if (alerta) {
                alerta.textContent = (resultado && resultado.mensaje) || "¡Reseña actualizada correctamente!";
                alerta.className = "alert alert-success d-block small py-2 text-center mt-2";
            }
            setTimeout(() => {
                limpiarPreviewsEdicion();
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
                alerta.textContent = `Error ${respuesta.status}: ${msgApi || "No se pudo actualizar la reseña."}`;
                alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
            }
        }
    } catch (error) {
        console.error("Error al actualizar reseña:", error);
        if (alerta) {
            alerta.textContent = "Error de conexión con el servidor.";
            alerta.className = "alert alert-danger d-block small py-2 text-center mt-2";
        }
    } finally {
        actualizandoResena = false;
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
    if (btn.dataset.busy === "1") return;

    const confirmado = await confirmarEliminacionModal({
        titulo: 'Eliminar cuenta',
        mensaje: 'Se eliminará tu cuenta, tus reseñas y tus favoritos permanentemente. Si pulsas Cancelar, no se realizará ningún cambio.',
        textoConfirmar: 'Sí, eliminar mi cuenta'
    });
    if (!confirmado) return;

    const usr = JSON.parse(localStorage.getItem('usuarioTuriStar') || 'null');
    if (!usr) return;

    btn.dataset.busy = "1";
    const htmlOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Eliminando...';

    const id = usr.idUsuario || usr.IdUsuario;
    try {
        // Ruta corregida: Auth en lugar de Usuario
        const req = await fetch(`${CONFIG.API_URL_BASE}/Auth/eliminar/${id}`, { method: 'DELETE' });
        const res = await req.json().catch(() => ({}));

        if (req.ok && res.isSuccess !== false) {
            localStorage.removeItem('usuarioTuriStar');
            window.location.replace("login.html");
            return;
        }

        mostrarErrorPerfil(btn, res.mensaje || res.respuesta || "No se pudo eliminar la cuenta.");
    } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
        mostrarErrorPerfil(btn, "Error de conexión con la API al intentar eliminar la cuenta.");
    }

    btn.dataset.busy = "0";
    btn.disabled = false;
    btn.innerHTML = htmlOriginal;
}

function mostrarErrorPerfil(btn, mensaje) {
    let alerta = document.getElementById('alertaPerfilAccion');
    if (!alerta) {
        alerta = document.createElement('div');
        alerta.id = 'alertaPerfilAccion';
        alerta.className = 'alert alert-danger small py-2 text-center rounded-3 mt-3 mb-0';
        btn.parentElement?.appendChild(alerta);
    }
    alerta.textContent = mensaje;
    alerta.classList.remove('d-none');
}

async function borrarMiResena(btn, idResena) {
    if (btn.dataset.busy === "1") return;

    const confirmado = await confirmarEliminacionModal({
        titulo: 'Eliminar reseña',
        mensaje: '¿Deseas borrar esta reseña? Haz clic en Cancelar para conservarla.',
        textoConfirmar: 'Sí, borrar reseña'
    });
    if (!confirmado) return;

    const usr = JSON.parse(localStorage.getItem('usuarioTuriStar') || 'null');
    if (!usr) return;
    const idUsr = usr.idUsuario || usr.IdUsuario;

    btn.dataset.busy = "1";
    const htmlOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        const req = await fetch(`${CONFIG.API_URL_BASE}/Resena/eliminar/${idResena}/${idUsr}`, { method: 'DELETE' });
        if (req.ok) {
            await cargarMisResenas(idUsr);
            return;
        }
    } catch (error) {
        console.error("Error al eliminar reseña:", error);
    }

    btn.dataset.busy = "0";
    btn.disabled = false;
    btn.innerHTML = htmlOriginal;
}

function actualizarVistaRolPerfil(esAdmin) {
    const tipoCuentaEl = document.getElementById('perfilTipoCuenta')
        || document.querySelector('main .text-turistar-green.text-uppercase');
    const btnGraficas = document.getElementById('btnPerfilGraficas');

    if (esAdmin) {
        if (tipoCuentaEl) {
            tipoCuentaEl.innerHTML = '<i class="bi bi-shield-lock-fill me-1"></i> Cuenta Administrativa';
            tipoCuentaEl.style.color = '#facc15';
        }
        if (btnGraficas) btnGraficas.classList.remove('d-none');
    } else {
        if (tipoCuentaEl) {
            tipoCuentaEl.textContent = 'Cuenta de Viajero';
            tipoCuentaEl.style.color = '';
        }
        if (btnGraficas) btnGraficas.classList.add('d-none');
    }
}
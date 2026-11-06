// js/editar_perfil.js

let fotoBase64 = "";
let idUsuarioLogueado = 0;

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usuarioGuardado) {
        window.location.replace("login.html");
        return;
    }

    const usuarioSession = JSON.parse(usuarioGuardado);
    idUsuarioLogueado = usuarioSession.idUsuario; // Dependiendo de cómo lo serialice .NET, podría ser IdUsuario
    if (!idUsuarioLogueado) idUsuarioLogueado = usuarioSession.IdUsuario;

    // Al cargar la página, traemos todos los datos para autocompletar
    await cargarDatosActuales();
});

async function cargarDatosActuales() {
    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Auth/${idUsuarioLogueado}`);
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            const usr = resultado.objeto;

            // Autocompletar campos
            document.getElementById('editNombres').value = usr.nombres || "";
            document.getElementById('editApellidos').value = usr.apellidos || "";

            // Formatear fecha para el input type="date" (YYYY-MM-DD)
            if (usr.fechaNacimiento) {
                document.getElementById('editFechaNac').value = usr.fechaNacimiento.split('T')[0];
            }

            // Si ya tiene foto, la mostramos
            if (usr.fotoPerfil) {
                fotoBase64 = usr.fotoPerfil;
                document.getElementById('previewFoto').src = fotoBase64;
            }
        }
    } catch (error) {
        console.error("Error al cargar los datos actuales:", error);
    }
}

// Convertir nueva foto a Base64
document.getElementById('inputFoto').addEventListener('change', function (evento) {
    const archivo = evento.target.files[0];
    if (archivo) {
        if (archivo.size > 3 * 1024 * 1024) { // Límite de 3MB
            mostrarAlerta("La imagen es muy pesada. Máximo 3MB.", false);
            return;
        }

        const lector = new FileReader();
        lector.onload = function (e) {
            fotoBase64 = e.target.result;
            document.getElementById('previewFoto').src = fotoBase64;
        };
        lector.readAsDataURL(archivo);
    }
});

// Guardar los cambios
document.getElementById('formEditarPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = "Guardando...";

    const datosActualizados = {
        idUsuario: idUsuarioLogueado,
        nombres: document.getElementById('editNombres').value.trim(),
        apellidos: document.getElementById('editApellidos').value.trim(),
        fechaNacimiento: document.getElementById('editFechaNac').value,
        fotoPerfil: fotoBase64
    };

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Auth/actualizar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosActualizados)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            mostrarAlerta("¡Perfil actualizado con éxito!", true);

            // Actualizar la sesión básica local
            let usuario = JSON.parse(localStorage.getItem('usuarioTuriStar'));
            usuario.nombre = datosActualizados.nombres;
            usuario.fotoPerfil = fotoBase64;
            localStorage.setItem('usuarioTuriStar', JSON.stringify(usuario));

            setTimeout(() => { window.location.href = "perfil.html"; }, 1500);
        } else {
            mostrarAlerta(resultado.respuesta || "No se pudo actualizar el perfil.", false);
        }
    } catch (error) {
        console.error("Error:", error);
        mostrarAlerta("Error al conectar con el servidor.", false);
    } finally {
        btn.disabled = false;
        btn.textContent = "Guardar Cambios";
    }
});

function mostrarAlerta(mensaje, esExito) {
    const alerta = document.getElementById('mensajeAlerta');
    alerta.textContent = mensaje;
    alerta.className = `alert ${esExito ? 'alert-success' : 'alert-danger'} py-2 px-3 small text-center`;
    alerta.classList.remove('d-none');
}
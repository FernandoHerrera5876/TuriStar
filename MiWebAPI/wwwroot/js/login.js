// js/login.js
const API_BASE_URL = "/api/Auth";

function switchTab(tab) {
    console.log("Cambiando a pestaña:", tab);
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    const alerta = document.getElementById('mensajeAlerta');

    if (alerta) alerta.classList.add('d-none'); // Ocultar mensajes al cambiar

    if (tab === 'login') {
        if (tabLogin) tabLogin.className = 'w-50 tab-active';
        if (tabRegistro) tabRegistro.className = 'w-50 tab-inactive';
        if (formLogin) formLogin.classList.add('active');
        if (formRegistro) formRegistro.classList.remove('active');
    } else {
        if (tabRegistro) tabRegistro.className = 'w-50 tab-active';
        if (tabLogin) tabLogin.className = 'w-50 tab-inactive';
        if (formRegistro) formRegistro.classList.add('active');
        if (formLogin) formLogin.classList.remove('active');
    }
}

function mostrarAlerta(mensaje, esExito) {
    const alerta = document.getElementById('mensajeAlerta');
    if (!alerta) return;
    alerta.textContent = mensaje;
    alerta.className = `alert ${esExito ? 'alert-success' : 'alert-danger'} py-2 px-3 small`;
    alerta.classList.remove('d-none');
}

// Envío del Login
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnLogin');
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Verificando...";
        }

        try {
            console.log("Intentando iniciar sesión...");
            const respuesta = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    correo: document.getElementById('loginCorreo').value.trim(),
                    password: document.getElementById('loginPassword').value
                })
            });

            const resultado = await respuesta.json();
            console.log("Respuesta del servidor:", resultado);

            if (respuesta.ok && resultado.isSuccess) {
                // LLAVE UNIFICADA: Guardamos con "empleados_usuario" en sessionStorage para que components.js la detecte al instante
                // LLAVE UNIFICADA: misma clave y mismo almacenamiento que usan components.js y perfil.js
                localStorage.setItem('usuarioTuriStar', JSON.stringify(resultado.objeto));

                const esAdministrador = resultado.objeto.esAdmin || resultado.objeto.EsAdmin;

                if (esAdministrador) {
                    window.location.replace("dashboard.html");
                } else {
                    window.location.replace("explorar.html");
                }
            } else {
                mostrarAlerta(resultado.respuesta || resultado.mensaje || "Credenciales incorrectas.", false);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            mostrarAlerta("Error al conectar con el servidor. Revisa que el backend esté ejecutándose.", false);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Iniciar Sesión";
            }
        }
    });
}

// Envío del Registro
const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnRegistro');
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Creando cuenta...";
        }

        try {
            console.log("Intentando registrar usuario...");
            const respuesta = await fetch(`${API_BASE_URL}/registrar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombres: document.getElementById('regNombres').value.trim(),
                    apellidos: document.getElementById('regApellidos').value.trim(),
                    fechaNacimiento: document.getElementById('regFechaNac').value,
                    correo: document.getElementById('regCorreo').value.trim(),
                    contrasena: document.getElementById('regPassword').value
                })
            });

            const resultado = await respuesta.json();
            console.log("Respuesta del servidor:", resultado);

            if (respuesta.ok && resultado.isSuccess) {
                mostrarAlerta("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.", true);
                formRegistro.reset();
                switchTab('login');
            } else {
                mostrarAlerta(resultado.respuesta || resultado.mensaje || "No se pudo crear la cuenta.", false);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            mostrarAlerta("Error al conectar con el servidor.", false);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Crear cuenta";
            }
        }
    });
}
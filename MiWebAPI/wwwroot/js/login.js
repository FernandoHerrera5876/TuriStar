// La URL base ahora usa rutas relativas para evitar problemas de puertos cruzados
const API_BASE_URL = "/api/Auth";

// Limpiamos la sesión antigua de la plantilla si existe
sessionStorage.removeItem("empleados_usuario");

function switchTab(tab) {
    console.log("Cambiando a pestaña:", tab);
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    const alerta = document.getElementById('mensajeAlerta');

    alerta.classList.add('d-none'); // Ocultar mensajes al cambiar

    if (tab === 'login') {
        tabLogin.className = 'w-50 tab-active';
        tabRegistro.className = 'w-50 tab-inactive';
        formLogin.classList.add('active');
        formRegistro.classList.remove('active');
    } else {
        tabRegistro.className = 'w-50 tab-active';
        tabLogin.className = 'w-50 tab-inactive';
        formRegistro.classList.add('active');
        formLogin.classList.remove('active');
    }
}

function mostrarAlerta(mensaje, esExito) {
    const alerta = document.getElementById('mensajeAlerta');
    alerta.textContent = mensaje;
    alerta.className = `alert ${esExito ? 'alert-success' : 'alert-danger'} py-2 px-3 small`;
    alerta.classList.remove('d-none');
}

// Envío del Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    btn.disabled = true;
    btn.textContent = "Verificando...";

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
            localStorage.setItem('usuarioTuriStar', JSON.stringify(resultado.objeto));
            window.location.replace("index.html");
        } else {
            mostrarAlerta(resultado.respuesta || resultado.mensaje || "Credenciales incorrectas.", false);
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        mostrarAlerta("Error al conectar con el servidor. Revisa que el backend esté ejecutándose.", false);
    } finally {
        btn.disabled = false;
        btn.textContent = "Iniciar Sesión";
    }
});

// Envío del Registro
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnRegistro');
    btn.disabled = true;
    btn.textContent = "Creando cuenta...";

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
            document.getElementById('formRegistro').reset();
            switchTab('login');
        } else {
            mostrarAlerta(resultado.respuesta || resultado.mensaje || "No se pudo crear la cuenta.", false);
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        mostrarAlerta("Error al conectar con el servidor.", false);
    } finally {
        btn.disabled = false;
        btn.textContent = "Crear cuenta";
    }
});
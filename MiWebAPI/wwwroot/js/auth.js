// js/auth.js
// Misma clave y mismo almacenamiento que usan login.js, components.js y perfil.js
const SESSION_KEY_S = "usuarioTuriStar";

function obtenerUsuario() {
    const valor = localStorage.getItem(SESSION_KEY_S);
    try {
        return valor ? JSON.parse(valor) : null;
    } catch {
        localStorage.removeItem(SESSION_KEY_S);
        return null;
    }
}

function protegerPagina() {
    if (!obtenerUsuario()) {
        window.location.replace("login.html");
    }
}

// Los botones Ingresar / Salir / saludo los maneja components.js (navbar).
// Se deja esta función vacía por si alguna página todavía la llama.
function mostrarUsuario() { }

// Igual que la de components.js, así no importa cuál se cargue al final
function cerrarSesion() {
    localStorage.removeItem(SESSION_KEY_S);
    sessionStorage.removeItem("empleados_usuario"); // clave vieja, por limpieza
    window.location.replace("login.html");
}
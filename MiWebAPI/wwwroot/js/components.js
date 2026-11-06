// js/components.js
document.addEventListener("DOMContentLoaded", () => {
    fetch('components/navbar.html?v=' + new Date().getTime())
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-placeholder').innerHTML = data;

            // Marcar enlace activo según la URL
            const currentLocation = location.href;
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.href === currentLocation) {
                    link.classList.add('active');
                }
            });

            // Verificar sesión para el nombre
            const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
            const spanUsuario = document.getElementById('nombreUsuario');
            const btnCerrar = document.getElementById('btnCerrarSesion');
            const loginLink = document.getElementById('loginLink');

            if (usuarioGuardado && spanUsuario) {
                const usuario = JSON.parse(usuarioGuardado);
                spanUsuario.textContent = `Hola, ${usuario.nombre || 'Usuario'}`;
                spanUsuario.classList.remove('d-none');
                btnCerrar.classList.remove('d-none');
                if (loginLink) loginLink.classList.add('d-none');
            } else if (!window.location.pathname.endsWith('login.html')) {
                // Si requiere login forzoso, descomenta la siguiente línea
                // window.location.href = 'login.html';
            }
        });
});

function cerrarSesion() {
    localStorage.removeItem('usuarioTuriStar');
    window.location.href = 'login.html';
}

// Activar búsqueda desde el Header (Navbar) de forma infalible
document.addEventListener("keypress", (e) => {
    // 1. Si el usuario presiona Enter
    if (e.key === "Enter") {
        const elementoActivo = e.target;

        // Verificamos si estaba escribiendo en un input dentro del navbar
        if (elementoActivo.tagName === "INPUT" && elementoActivo.closest("#navbar-placeholder, nav, header")) {
            e.preventDefault(); // Evitamos que la página parpadee o se recargue
            const termino = elementoActivo.value.trim();

            if (termino !== "") {
                window.location.href = `explorar.html?q=${encodeURIComponent(termino)}`;
            }
        }
    }
});

// 2. Por si el usuario prefiere darle clic al ícono de la lupa en el Header
document.addEventListener("click", (e) => {
    // Buscamos si el clic fue en la lupa o en el contenedor de la lupa dentro del navbar
    const iconoLupa = e.target.closest(".bi-search, .input-group-text");

    if (iconoLupa && iconoLupa.closest("#navbar-placeholder, nav, header")) {
        // Encontramos el input que está al lado de la lupa
        const inputAsociado = iconoLupa.closest(".input-group").querySelector("input");

        if (inputAsociado && inputAsociado.value.trim() !== "") {
            window.location.href = `explorar.html?q=${encodeURIComponent(inputAsociado.value.trim())}`;
        }
    }
});
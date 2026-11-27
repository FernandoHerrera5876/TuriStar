# TuriStar — Guía Turística Colaborativa de Hidalgo

Plataforma web full-stack desarrollada con **ASP.NET Core Web API**, **SQL Server / Azure SQL** y **HTML5/CSS3/JavaScript** que permite descubrir, calificar, comentar y compartir destinos turísticos del estado de Hidalgo, México.

**Aplicación desplegada en Azure:**  
`https://proyectogestorempleadosfer-gmbcddbpfehnc9c2.westcentralus-01.azurewebsites.net`

---

## 1. Objetivo del Proyecto

Ofrecer una aplicación web centralizada y colaborativa para explorar los principales destinos turísticos de Hidalgo, consultando información real y actualizada (horarios de lunes a domingo, costos de entrada y estacionamiento, ubicación en mapa con ruta en Google Maps, fotografías y reseñas verificadas de la comunidad). Asimismo, proporcionar a los administradores herramientas de gestión de destinos, categorías y un panel de estadísticas en tiempo real.

### Funcionalidades principales
- **Autenticación y verificación de cuenta:** Registro con validación en vivo de correo y contraseña segura, verificación mediante código de 6 dígitos enviado por correo electrónico (vigencia de 10 minutos) y contraseñas protegidas con hashing **BCrypt**.
- **Catálogo de destinos (`Explorar`):** Consulta dinámica desde base de datos con búsqueda en tiempo real, botón de limpieza rápida y paginado.
- **Detalle del destino y favoritos:** Portada, costos, horarios por día, botón de ruta directa en Google Maps, guardado en favoritos y muro de reseñas con galería de fotos y visor **Lightbox**.
- **Mapa interactivo:** Geolocalización automática por coordenadas GPS y navegación por lugares paginados.
- **Gestión de lugares y reseñas (CRUD completo):** Alta, consulta, edición (con botón explícito de cancelar) y eliminación física (con confirmación modal) de destinos, reseñas con múltiples fotografías, perfil de usuario y categorías.
- **Panel de administrador (`Dashboard`):** Gráficas dinámicas con **Chart.js** sobre lugares más populares y mejores calificaciones.
- **Seguridad:** Prevención de inyección SQL mediante **Stored Procedures parametrizados**, usuario de base de datos con **principio de mínimo privilegio** (`usr_turistar_app`), credenciales externalizadas en variables de entorno de Azure, y validación de imágenes por extensión, MIME type, firma binaria (*magic bytes*) y límite de **5 MB** tanto en backend como en SQL Server.

---

## 2. Tecnologías Utilizadas

| Capa | Tecnologías |
| :--- | :--- |
| **Backend / API** | C#, ASP.NET Core Web API (.NET 8 / .NET 10), ADO.NET (`System.Data.SqlClient`), `BCrypt.Net-Next`, `System.Net.Mail` (SMTP) |
| **Base de Datos** | Microsoft SQL Server / Azure SQL Database (Tablas relacionales, Constraints `CHECK`, Procedimientos Almacenados) |
| **Frontend** | HTML5, CSS3 (Tema oscuro / *Glassmorphism*), JavaScript (ES6+ / Fetch API), Bootstrap 5.3, Bootstrap Icons, Chart.js |
| **Servicios Externos** | Google Maps Embed / Directions, OpenStreetMap Nominatim (Geocodificación), Gmail SMTP |
| **Infraestructura y Pruebas** | Microsoft Azure App Service, Git & GitHub, Postman |

---

## 3. Estructura del Repositorio

> **Nota sobre la organización de Frontend y API:** El proyecto sirve los archivos estáticos del frontend desde `wwwroot/` dentro del proyecto ASP.NET Core para evitar conflictos de CORS y simplificar el despliegue unificado en Azure App Service.

```text
TuriStar/
├── BaseDatos/
│   └── Scripts.sql            # Script completo: tablas, constraints, SPs, usuario mínimo y datos base
├── Postman/
│   └── Coleccion.json         # Colección Postman v2.1 con pruebas y ejemplos de respuesta
├── Capturas/                  # Capturas de pantalla del sistema en funcionamiento
├── Controllers/               # Endpoints REST (Auth, Destino, Resena, Favorito, Categoria, Dashboard, Upload)
├── Data/                      # Capa de acceso a datos con ADO.NET y Stored Procedures
├── Helpers/                   # ValidadorImagen.cs (5 MB + magic bytes) y EmailHelper.cs (SMTP)
├── Models/                    # Modelos de dominio y DTOs de petición/respuesta
├── wwwroot/                   # Frontend completo (HTML, CSS, JS, componentes e imágenes)
│   ├── components/            # navbar.html y footer.html inyectados dinámicamente
│   ├── css/                   # styles.css (diseño oscuro y cristal responsivo)
│   ├── img/                   # Imágenes locales de destinos y reseñas
│   ├── js/                    # config.js, components.js y lógica por vista
│   └── *.html                 # Vistas de la aplicación
├── appsettings.json           # Plantilla de configuración (sin contraseñas expuestas)
├── Program.cs                 # Configuración de servicios, archivos estáticos y pipeline HTTP
└── README.md                  # Documentación general del proyecto
```

---

## 4. Requisitos de Ejecución

Para ejecutar el proyecto de forma local se requiere:

- **Visual Studio 2022 / 2026** (con la carga de trabajo *Desarrollo de ASP.NET y web*) o **.NET SDK** (`.NET 8.0` / `.NET 10.0`).
- **SQL Server** (Express, Developer o Azure SQL Database) y **SQL Server Management Studio (SSMS)**.
- Navegador web moderno (Chrome, Edge o Firefox).
- **Postman** (opcional, para ejecutar la colección de pruebas `Postman/Coleccion.json`).
- Cuenta de **Gmail con Verificación en 2 pasos** y una **Contraseña de aplicación** (solo si se desea probar el envío real de códigos de registro en local).

---

## 5. Configuración de la Base de Datos

1. Abre **SQL Server Management Studio (SSMS)** y conéctate a tu instancia local o servidor de Azure SQL.
2. Crea la base de datos (por ejemplo `TURISTAR`).
3. Abre el archivo **`BaseDatos/Scripts.sql`** y ejecútalo en orden:
   - Creación de tablas (`USUARIO`, `CATEGORIA`, `DESTINO`, `FOTO_DESTINO`, `RESENA`, `FOTO_RESENA`, `FAVORITO`, `REGISTRO_PENDIENTE`).
   - Restricciones `CHECK` para validación de imágenes y límite de 5 MB.
   - Procedimientos almacenados (`sp_Usuario_*`, `sp_Registro_*`, `sp_Destino_*`, `sp_Resena_*`, `sp_FotoResena_*`, `sp_Favorito_*`, `sp_Categoria_*`, `sp_Dashboard_Estadisticas`).
   - Inserción de categorías y destinos iniciales de Hidalgo.
4. **Usuario con privilegios mínimos (Seguridad):** Crea el login `usr_turistar_app` en `master` y su usuario en la base de datos con permisos únicamente de ejecución sobre procedimientos almacenados (`GRANT EXECUTE ON SCHEMA::dbo TO [usr_turistar_app]`) y lectura puntual de categorías, impidiendo operaciones destructivas (`DROP TABLE`, `ALTER TABLE`, etc.).

---

## 6. Configuración de la Cadena de Conexión y Correo

Por seguridad, el archivo `appsettings.json` del repositorio no contiene contraseñas reales.

### En entorno local (`appsettings.Development.json`)
Crea o edita el archivo `appsettings.Development.json` (ignorado por Git en `.gitignore`) en la raíz del proyecto con tus credenciales locales:

```json
{
  "ConnectionStrings": {
    "CadenaSQL": "Server=TU_SERVIDOR\\SQLEXPRESS;Database=TURISTAR;User ID=usr_turistar_app;Password=TU_PASSWORD;TrustServerCertificate=True;"
  },
  "EmailSettings": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "CorreoEmisor": "turistarhidalgo@gmail.com",
    "PasswordApp": "TU_CONTRASENA_DE_APLICACION_16_LETRAS",
    "NombreEmisor": "TuriStar"
  }
}
```

### En producción (Azure App Service)
Configura las credenciales en **Azure Portal → App Service → Configuración → Variables de entorno**:
- **Cadenas de conexión (`Connection strings`):**
  - Nombre: `CadenaSQL` | Tipo: `SQLAzure` | Valor: cadena de conexión a Azure SQL.
- **Configuración de la aplicación (`App settings`):**
  - Nombre: `EmailSettings__PasswordApp` | Valor: clave de aplicación SMTP de Gmail.

---

## 7. Ejecución de la API

### Desde Visual Studio
1. Clona el repositorio:
   ```bash
   git clone https://github.com/FernandoHerrera5876/TuriStar.git
   cd TuriStar
   ```
2. Abre la solución (`.sln`) en Visual Studio.
3. Restaura los paquetes NuGet (incluye `BCrypt.Net-Next` y `System.Data.SqlClient`).
4. Presiona **F5** (o el botón **Iniciar**).

### Desde la terminal (.NET CLI)
```bash
dotnet restore
dotnet build
dotnet run
```

### Endpoints principales de la API

| Módulo | Método | Ruta | Descripción |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/Auth/solicitar-codigo` | Genera y envía código de verificación de 6 dígitos por correo |
| **Auth** | `POST` | `/api/Auth/confirmar-registro` | Valida el código y crea la cuenta definitiva con hash BCrypt |
| **Auth** | `POST` | `/api/Auth/login` | Inicia sesión verificando hash BCrypt y devuelve datos/rol |
| **Auth** | `GET` / `PUT` / `DELETE` | `/api/Auth/{id}` · `/actualizar` · `/eliminar/{id}` | Consulta, edición (con foto Base64 ≤ 5 MB) y eliminación física de cuenta |
| **Destinos** | `GET` | `/api/Destino/todos` · `/{id}` · `/categorias` | Consulta general, por ID y catálogo de categorías |
| **Destinos** | `POST` / `PUT` / `DELETE` | `/api/Destino/registrar` · `/actualizar` · `/eliminar/{id}` | CRUD completo de destinos turísticos |
| **Reseñas** | `GET` | `/api/Resena/todas` · `/destino/{id}` · `/usuario/{id}` | Muro global, por destino y por usuario (incluye galería de fotos) |
| **Reseñas** | `POST` / `PUT` / `DELETE` | `/api/Resena/registrar` · `/actualizar` · `/eliminar/{id}/{idUsuario}` | CRUD de reseñas con carga y borrado de múltiples fotografías |
| **Favoritos** | `POST` / `GET` | `/api/Favorito/toggle` · `/verificar/{u}/{d}` · `/usuario/{u}` | Guardado y consulta de destinos favoritos |
| **Categorías** | `POST` | `/api/Categoria/registrar` | Alta de categorías con respuesta estructurada (`numeroError`, `respuesta`) |
| **Dashboard** | `GET` | `/api/Dashboard/estadisticas` | Top de destinos más populares y mejor calificados |
| **Archivos** | `POST` | `/api/Upload/imagen` | Carga de imágenes con validación de tipo, firma binaria y límite de 5 MB |

> Para probar todos los endpoints, importa **`Postman/Coleccion.json`** en Postman y define la variable `baseUrl` con tu URL local o de Azure.

---

## 8. Ejecución del Frontend

El frontend está integrado dentro de `wwwroot/` y configurado en `wwwroot/js/config.js` mediante `API_URL_BASE: "/api"`, por lo que funciona automáticamente en el mismo puerto que la API sin configuraciones extra:

1. Con la API ejecutándose, abre en tu navegador la URL asignada por Visual Studio (ej. `https://localhost:7198/index.html` o `http://localhost:5299/index.html`) o ingresa directamente al sitio publicado en Azure.
2. Si no hay sesión activa, el sistema protegerá las vistas internas y te redirigirá a `login.html`.
3. Una vez autenticado, navega por **Explorar**, **Mapa**, **Reseñas**, **Nuevo Destino**, **Perfil** y **Gráficas** (si el usuario es administrador).

---

## 9. Credenciales de Prueba

> ⚠️ *Sustituye los valores de ejemplo por las cuentas de prueba activas que usarán el día de la evaluación.*

| Rol | Correo Electrónico | Contraseña | Accesos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `correo_admin@ejemplo.com` | `PasswordAdmin123!` | Todos los módulos + edición/eliminación de destinos + **Gráficas (Dashboard)** + gestión de categorías |
| **Viajero (Estándar)** | `correo_viajero@ejemplo.com` | `PasswordViajero123!` | Explorar, Mapa, Reseñas, Favoritos, Nuevo Destino y Perfil propio |

*(También es posible crear una cuenta nueva en vivo desde `login.html` → **Registrarse** usando cualquier correo real para recibir el código de confirmación de 6 dígitos).*

---

## 10. Integrantes del Equipo y Flujo de Ramas

| Integrante | Rol / Rama de Trabajo | GitHub |
| :--- | :--- | :--- |
| **Bryan Fernando Herrera Monter** | Desarrollo Full-Stack / `develop-fernando` | `@FernandoHerrera5876` |
| **Noam Jesús Nieto Gante** | Desarrollo / `develop-noam` | `@noamnieto43` |

**Estrategia de control de versiones (Git Flow):**
- `develop-fernando` y `develop-noam` → ramas individuales de desarrollo.
- `develop` → integración continua del equipo.
- `release` → versión candidata a despliegue y pruebas finales.
- `main` → rama de producción final.

---

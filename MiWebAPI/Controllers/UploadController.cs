using Microsoft.AspNetCore.Mvc;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        // Inyectamos el entorno para saber dónde está instalada la API y encontrar la carpeta wwwroot
        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("imagen")]
        public async Task<IActionResult> SubirImagen(IFormFile archivo)
        {
            var (esValida, error) = MiWebAPI.Helpers.ValidadorImagen.Validar(archivo);
            if (!esValida)
                return BadRequest(new { isSuccess = false, respuesta = error, mensaje = error });
            if (archivo == null || archivo.Length == 0)
                return BadRequest(new { isSuccess = false, respuesta = "No se envió ningún archivo." });

            try
            {
                // 1. Definir la ruta física: MiWebAPI/wwwroot/img
                string rutaCarpeta = Path.Combine(_env.ContentRootPath, "wwwroot", "img");

                if (!Directory.Exists(rutaCarpeta))
                    Directory.CreateDirectory(rutaCarpeta); // Si no existe, la crea sola

                // 2. Generar nombre único corto + la extensión original
                string extension = Path.GetExtension(archivo.FileName);
                string nombreArchivo = Guid.NewGuid().ToString().Substring(0, 8) + extension;
                string rutaCompleta = Path.Combine(rutaCarpeta, nombreArchivo);

                // 3. Guardar el archivo físicamente en el disco duro
                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await archivo.CopyToAsync(stream);
                }

                // 4. Devolver la URL local lista para guardarse en la Base de Datos
                // Quedará algo como: /img/3b8d1a4f.jpg
                string urlLocal = $"/img/{nombreArchivo}";
                return Ok(new { isSuccess = true, url = urlLocal });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { isSuccess = false, respuesta = "Error al guardar imagen: " + ex.Message });
            }
        }
    }
}

namespace MiWebAPI.Helpers
{
    public static class ValidadorImagen
    {
        public const long MaxBytes = 5 * 1024 * 1024; // 5 MB exactos (5,242,880 bytes)

        private static readonly HashSet<string> ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        private static readonly HashSet<string> TiposMimePermitidos = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
        };

        public static (bool EsValida, string Error) Validar(IFormFile? archivo)
        {
            if (archivo == null || archivo.Length == 0)
                return (false, "No se envió ningún archivo.");

            if (archivo.Length > MaxBytes)
                return (false, "La imagen supera el tamaño máximo permitido de 5 MB.");

            var extension = Path.GetExtension(archivo.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !ExtensionesPermitidas.Contains(extension))
                return (false, "Formato no permitido. Solo se aceptan imágenes JPG, PNG, WEBP o GIF.");

            if (string.IsNullOrWhiteSpace(archivo.ContentType) || !TiposMimePermitidos.Contains(archivo.ContentType))
                return (false, "El tipo de archivo no corresponde a una imagen válida.");

            // Verificar firma real del archivo (magic bytes) para evitar archivos renombrados
            using var stream = archivo.OpenReadStream();
            byte[] header = new byte[12];
            int leidos = stream.Read(header, 0, header.Length);
            if (leidos < 4)
                return (false, "El archivo de imagen está vacío o dañado.");

            bool esJpeg = header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
            bool esPng = header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
            bool esGif = header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38;
            bool esWebp = leidos >= 12
                && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50;

            if (!esJpeg && !esPng && !esGif && !esWebp)
                return (false, "El contenido del archivo no es una imagen válida.");

            return (true, string.Empty);
        }
    }
}
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
using Microsoft.AspNetCore.Mvc;
using MiWebAPI.Data;
using MiWebAPI.Helpers;
using MiWebAPI.Models;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResenaController : ControllerBase
    {
        private readonly ResenaData _resenaData;

        public ResenaController(IConfiguration configuracion)
        {
            _resenaData = new ResenaData(configuracion);
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar(
            [FromForm] int idUsuario,
            [FromForm] int idDestino,
            [FromForm] decimal calificacion,
            [FromForm] string comentario,
            [FromForm] List<IFormFile>? fotos = null)
        {
            // Validar todas las imágenes antes de registrar la reseña en SQL
            if (fotos != null && fotos.Count > 0)
            {
                foreach (var archivo in fotos)
                {
                    var (esValida, error) = ValidadorImagen.Validar(archivo);
                    if (!esValida)
                    {
                        return BadRequest(new { isSuccess = false, respuesta = error, mensaje = error });
                    }
                }
            }

            var resena = new Resena
            {
                IdUsuario = idUsuario,
                IdDestino = idDestino,
                Calificacion = calificacion,
                Comentario = comentario
            };

            var respuesta = await _resenaData.Registrar(resena);

            if (respuesta.IsSuccess && respuesta.Objeto != null)
            {
                int idNuevaResena = Convert.ToInt32(respuesta.Objeto);

                // Si el usuario subió fotos válidas, las guardamos localmente
                if (fotos != null && fotos.Count > 0)
                {
                    string rutaCarpeta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "resenas");
                    if (!Directory.Exists(rutaCarpeta)) Directory.CreateDirectory(rutaCarpeta);

                    foreach (var archivo in fotos)
                    {
                        string extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
                        string nombreArchivo = Guid.NewGuid().ToString() + extension;
                        string rutaFisica = Path.Combine(rutaCarpeta, nombreArchivo);

                        using (var stream = new FileStream(rutaFisica, FileMode.Create))
                        {
                            await archivo.CopyToAsync(stream);
                        }

                        // Guardamos la URL en SQL
                        await _resenaData.InsertarFotoResena(idNuevaResena, $"/img/resenas/{nombreArchivo}");
                    }
                }

                return Ok(new { isSuccess = true, mensaje = respuesta.Mensaje });
            }

            return BadRequest(new { isSuccess = false, respuesta = respuesta.Mensaje, mensaje = respuesta.Mensaje });
        }

        [HttpGet("destino/{idDestino}")]
        public async Task<IActionResult> ObtenerPorDestino(long idDestino)
        {
            var lista = await _resenaData.ObtenerPorDestino(idDestino);
            return Ok(new { isSuccess = true, objeto = lista });
        }

        [HttpGet("todas")]
        public async Task<IActionResult> ObtenerTodas()
        {
            var lista = await _resenaData.ObtenerTodas();
            return Ok(new { isSuccess = true, objeto = lista });
        }

        [HttpGet("usuario/{idUsuario}")]
        public async Task<IActionResult> ObtenerPorUsuario(int idUsuario)
        {
            var lista = await _resenaData.ObtenerPorUsuario(idUsuario);
            return Ok(new { isSuccess = true, objeto = lista });
        }

        [HttpPut("actualizar")]
        public async Task<IActionResult> Actualizar(
            [FromForm] long idResena,
            [FromForm] int idUsuario,
            [FromForm] decimal calificacion,
            [FromForm] string comentario,
            [FromForm] List<string>? fotosEliminar = null,
            [FromForm] List<IFormFile>? fotosNuevas = null)
        {
            // Validar todas las fotos nuevas antes de modificar texto o borrar fotos existentes
            if (fotosNuevas != null && fotosNuevas.Count > 0)
            {
                foreach (var archivo in fotosNuevas)
                {
                    var (esValida, error) = ValidadorImagen.Validar(archivo);
                    if (!esValida)
                    {
                        return BadRequest(new { isSuccess = false, respuesta = error, mensaje = error });
                    }
                }
            }

            var req = new Resena
            {
                IdResena = idResena,
                IdUsuario = idUsuario,
                Calificacion = calificacion,
                Comentario = comentario
            };

            var respuesta = await _resenaData.Actualizar(req);
            if (!respuesta.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, respuesta = respuesta.Mensaje, mensaje = respuesta.Mensaje });
            }

            string rutaCarpeta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "resenas");

            // 1. Eliminar las fotos marcadas por el usuario
            if (fotosEliminar != null && fotosEliminar.Count > 0)
            {
                foreach (var url in fotosEliminar)
                {
                    if (string.IsNullOrWhiteSpace(url)) continue;

                    var resDel = await _resenaData.EliminarFotoResena(idResena, idUsuario, url.Trim());
                    if (resDel.IsSuccess)
                    {
                        // Borrar archivo físico de forma segura solo dentro de wwwroot/img/resenas
                        string nombreArchivo = Path.GetFileName(url.Trim());
                        if (!string.IsNullOrWhiteSpace(nombreArchivo))
                        {
                            string rutaFisica = Path.Combine(rutaCarpeta, nombreArchivo);
                            if (System.IO.File.Exists(rutaFisica))
                            {
                                try { System.IO.File.Delete(rutaFisica); } catch { }
                            }
                        }
                    }
                }
            }

            // 2. Guardar las fotos nuevas válidas si el usuario seleccionó alguna
            if (fotosNuevas != null && fotosNuevas.Count > 0)
            {
                if (!Directory.Exists(rutaCarpeta)) Directory.CreateDirectory(rutaCarpeta);

                foreach (var archivo in fotosNuevas)
                {
                    string extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
                    string nombreArchivo = Guid.NewGuid().ToString() + extension;
                    string rutaFisica = Path.Combine(rutaCarpeta, nombreArchivo);

                    using (var stream = new FileStream(rutaFisica, FileMode.Create))
                    {
                        await archivo.CopyToAsync(stream);
                    }

                    await _resenaData.InsertarFotoResena(idResena, $"/img/resenas/{nombreArchivo}");
                }
            }

            return Ok(new { isSuccess = true, mensaje = respuesta.Mensaje });
        }

        [HttpDelete("eliminar/{idResena}/{idUsuario}")]
        public async Task<IActionResult> Eliminar(int idResena, int idUsuario)
        {
            var res = await _resenaData.Eliminar(idResena, idUsuario);
            return res.IsSuccess
                ? Ok(new { isSuccess = true, mensaje = res.Mensaje })
                : BadRequest(new { isSuccess = false, respuesta = res.Mensaje, mensaje = res.Mensaje });
        }
    }
}
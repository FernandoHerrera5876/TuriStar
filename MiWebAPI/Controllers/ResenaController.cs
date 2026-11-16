using Microsoft.AspNetCore.Mvc;
using MiWebAPI.Data;
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
        public async Task<IActionResult> Registrar([FromForm] int idUsuario, [FromForm] int idDestino, [FromForm] decimal calificacion, [FromForm] string comentario, [FromForm] List<IFormFile> fotos)
        {
            var resena = new Resena { IdUsuario = idUsuario, IdDestino = idDestino, Calificacion = calificacion, Comentario = comentario };
            var respuesta = await _resenaData.Registrar(resena);

            if (respuesta.IsSuccess && respuesta.Objeto != null)
            {
                int idNuevaResena = Convert.ToInt32(respuesta.Objeto);

                // Si el usuario subió fotos, las guardamos localmente
                if (fotos != null && fotos.Count > 0)
                {
                    string rutaCarpeta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "img", "resenas");
                    if (!Directory.Exists(rutaCarpeta)) Directory.CreateDirectory(rutaCarpeta);

                    foreach (var archivo in fotos)
                    {
                        string nombreArchivo = Guid.NewGuid().ToString() + Path.GetExtension(archivo.FileName);
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
            return BadRequest(new { isSuccess = false, mensaje = respuesta.Mensaje });
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
        public async Task<IActionResult> Actualizar([FromBody] Resena req)
        {
            var respuesta = await _resenaData.Actualizar(req);
            return respuesta.IsSuccess ? Ok(new { isSuccess = true, mensaje = respuesta.Mensaje }) : BadRequest(new { isSuccess = false, mensaje = respuesta.Mensaje });
        }

        [HttpDelete("eliminar/{idResena}/{idUsuario}")]
        public async Task<IActionResult> Eliminar(int idResena, int idUsuario)
        {
            var res = await _resenaData.Eliminar(idResena, idUsuario);
            return res.IsSuccess ? Ok(new { isSuccess = true, mensaje = res.Mensaje }) : BadRequest(new { isSuccess = false });
        }
    }
}
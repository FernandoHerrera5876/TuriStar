using Microsoft.AspNetCore.Mvc;
using MiWebAPI.Data;
using MiWebAPI.Models;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DestinoController : ControllerBase
    {
        private readonly DestinoData _destinoData;

        public DestinoController(IConfiguration configuracion)
        {
            _destinoData = new DestinoData(configuracion);
        }

        [HttpGet("todos")]
        public async Task<IActionResult> GetTodos()
        {
            var lista = await _destinoData.ObtenerTodos();

            if (lista == null || lista.Count == 0)
            {
                return NotFound(new { isSuccess = false, respuesta = "No se encontraron destinos registrados." });
            }

            return Ok(new { isSuccess = true, objeto = lista });
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetPorId(long id)
        {
            var lista = await _destinoData.ObtenerTodos();
            var destino = lista.FirstOrDefault(d => d.IdDestino == id);

            if (destino == null)
            {
                return NotFound(new { isSuccess = false, respuesta = "Destino no encontrado." });
            }

            return Ok(new { isSuccess = true, objeto = destino });
        }

        [HttpGet("categorias")]
        public async Task<IActionResult> GetCategorias()
        {
            var lista = await _destinoData.ObtenerCategorias();
            return Ok(new { isSuccess = true, objeto = lista });
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] Destino request)
        {
            var resultado = await _destinoData.Registrar(request);

            if (!resultado.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, respuesta = resultado.Mensaje });
            }

            return Ok(new { isSuccess = true, respuesta = resultado.Mensaje, idDestino = resultado.IdDestino });
        }

        [HttpPut("actualizar")]
        public async Task<IActionResult> Actualizar([FromBody] Destino req)
        {
            var respuesta = await _destinoData.Actualizar(req);
            return respuesta.IsSuccess
                ? Ok(new { isSuccess = true, mensaje = respuesta.Mensaje })
                : BadRequest(new { isSuccess = false, mensaje = respuesta.Mensaje });
        }

        [HttpDelete("eliminar/{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var res = await _destinoData.Eliminar(id);
            return res.IsSuccess
                ? Ok(new { isSuccess = true, mensaje = res.Mensaje })
                : BadRequest(new { isSuccess = false });
        }
    }
}
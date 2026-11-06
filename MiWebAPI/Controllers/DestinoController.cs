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

            // Devolvemos el mismo formato JSON que usamos en el login para mantener consistencia
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

            // Regresamos también el idDestino recién creado
            return Ok(new { isSuccess = true, respuesta = resultado.Mensaje, idDestino = resultado.IdDestino });
        }
    }
}
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
        public async Task<IActionResult> Registrar([FromBody] Resena request)
        {
            // Ahora recibimos la tupla (IsSuccess, Mensaje)
            var resultado = await _resenaData.Registrar(request);

            if (!resultado.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, respuesta = resultado.Mensaje });
            }
            return Ok(new { isSuccess = true, respuesta = resultado.Mensaje });
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
    }
}
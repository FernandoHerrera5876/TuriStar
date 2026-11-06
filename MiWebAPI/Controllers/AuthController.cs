using Microsoft.AspNetCore.Mvc;
using MiWebAPI.Models;
using MiWebAPI.Data; // Asegúrate de tener esta carpeta y clase creada
using System.Threading.Tasks;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UsuarioData _usuarioData;

        public AuthController(IConfiguration configuration)
        {
            // Instanciamos la clase que se conecta a SQL Server
            _usuarioData = new UsuarioData(configuration);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Usamos ValidarLogin pasándole los datos del modelo (asegúrate de que request.Password coincida con tu modelo JS)
            var respuesta = await _usuarioData.ValidarLogin(request.Correo, request.Password);

            if (!respuesta.IsSuccess)
            {
                return Unauthorized(new
                {
                    isSuccess = false,
                    numeroError = 401,
                    respuesta = respuesta.Mensaje
                });
            }

            return Ok(new
            {
                isSuccess = true,
                numeroError = 0,
                respuesta = respuesta.Mensaje,
                // El objeto usuario ahora viene de la base de datos (Id, Nombre, Correo)
                objeto = respuesta.Objeto
            });
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] Usuario request)
        {
            // Usamos Registrar pasándole el modelo de Usuario completo
            var respuesta = await _usuarioData.Registrar(request);

            if (!respuesta.IsSuccess)
            {
                return BadRequest(new
                {
                    isSuccess = false,
                    numeroError = 400,
                    respuesta = respuesta.Mensaje
                });
            }

            return Ok(new
            {
                isSuccess = true,
                numeroError = 0,
                respuesta = respuesta.Mensaje
            });
        }

        [HttpPut("actualizar")]
        public async Task<IActionResult> Actualizar([FromBody] Usuario request)
        {
            var respuesta = await _usuarioData.Actualizar(request);

            if (!respuesta.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, respuesta = respuesta.Mensaje });
            }

            return Ok(new { isSuccess = true, respuesta = respuesta.Mensaje });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPerfil(int id)
        {
            var usuario = await _usuarioData.ObtenerPorId(id);

            if (usuario.IdUsuario == 0)
            {
                return NotFound(new { isSuccess = false, respuesta = "Usuario no encontrado" });
            }

            return Ok(new { isSuccess = true, objeto = usuario });
        }
    }
}
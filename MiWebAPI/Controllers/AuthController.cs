using Microsoft.AspNetCore.Mvc;
using MiWebAPI.Models;
using MiWebAPI.Data;
using MiWebAPI.Helpers;
using System.Threading.Tasks;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UsuarioData _usuarioData;
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
            _usuarioData = new UsuarioData(configuration);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
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
                objeto = respuesta.Objeto
            });
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] Usuario request)
        {
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

        [HttpDelete("eliminar/{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var res = await _usuarioData.Eliminar(id);
            return res.IsSuccess
                ? Ok(new { isSuccess = true, mensaje = res.Mensaje })
                : BadRequest(new { isSuccess = false, mensaje = res.Mensaje, respuesta = res.Mensaje });
        }

        [HttpPost("solicitar-codigo")]
        public async Task<IActionResult> SolicitarCodigo([FromBody] Usuario request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombres) ||
                string.IsNullOrWhiteSpace(request.Apellidos) ||
                string.IsNullOrWhiteSpace(request.Correo) ||
                string.IsNullOrWhiteSpace(request.Contrasena))
            {
                return BadRequest(new { isSuccess = false, respuesta = "Todos los campos son obligatorios." });
            }

            string codigo = EmailHelper.GenerarCodigo6Digitos();
            var respuesta = await _usuarioData.SolicitarCodigoRegistro(request, codigo);

            if (!respuesta.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, respuesta = respuesta.Mensaje });
            }

            try
            {
                await EmailHelper.EnviarCodigoVerificacionAsync(_configuration, request.Correo.Trim(), request.Nombres.Trim(), codigo);
                return Ok(new
                {
                    isSuccess = true,
                    respuesta = "Te enviamos un código de 6 dígitos a tu correo. Ingrésalo para terminar el registro."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error SMTP: " + ex.Message);
                return StatusCode(500, new
                {
                    isSuccess = false,
                    respuesta = "No se pudo enviar el correo de verificación. Revisa que el correo sea válido o intenta más tarde."
                });
            }
        }

        [HttpPost("confirmar-registro")]
        public async Task<IActionResult> ConfirmarRegistro([FromBody] ConfirmarRegistroRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Codigo))
            {
                return BadRequest(new { isSuccess = false, respuesta = "Ingresa el código de verificación." });
            }

            var respuesta = await _usuarioData.ConfirmarRegistro(request.Correo, request.Codigo);

            if (!respuesta.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, respuesta = respuesta.Mensaje });
            }

            return Ok(new { isSuccess = true, respuesta = respuesta.Mensaje });
        }
    }
}
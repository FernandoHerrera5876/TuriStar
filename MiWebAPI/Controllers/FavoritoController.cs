using Microsoft.AspNetCore.Mvc;
using MiWebAPI.Models;
using System.Data;
using System.Data.SqlClient;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FavoritoController : ControllerBase
    {
        private readonly string _conexion;

        public FavoritoController(IConfiguration config)
        {
            _conexion = config.GetConnectionString("CadenaSQL");
        }

        [HttpPost("toggle")]
        public async Task<IActionResult> Toggle([FromBody] FavoritoRequest req)
        {
            using (SqlConnection con = new SqlConnection(_conexion))
            {
                SqlCommand cmd = new SqlCommand("sp_Favorito_Toggle", con);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdUsuario", req.IdUsuario);
                cmd.Parameters.AddWithValue("@IdDestino", req.IdDestino);

                await con.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                        return Ok(new { isSuccess = true, mensaje = reader["Mensaje"].ToString(), isFavorito = Convert.ToInt32(reader["IsFavorito"]) == 1 });
                }
            }
            return BadRequest();
        }

        [HttpGet("verificar/{idUsuario}/{idDestino}")]
        public async Task<IActionResult> Verificar(long idUsuario, long idDestino)
        {
            using (SqlConnection con = new SqlConnection(_conexion))
            {
                SqlCommand cmd = new SqlCommand("sp_Favorito_Verificar", con);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);
                cmd.Parameters.AddWithValue("@IdDestino", idDestino);

                await con.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                        return Ok(new { isFavorito = Convert.ToInt32(reader["IsFavorito"]) == 1 });
                }
            }
            return Ok(new { isFavorito = false });
        }

        [HttpGet("usuario/{idUsuario}")]
        public async Task<IActionResult> ObtenerPorUsuario(long idUsuario)
        {
            List<Destino> lista = new List<Destino>();
            using (SqlConnection con = new SqlConnection(_conexion))
            {
                SqlCommand cmd = new SqlCommand("sp_Favorito_ObtenerPorUsuario", con);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);

                await con.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        lista.Add(new Destino
                        {
                            IdDestino = Convert.ToInt64(reader["ID_DESTINO"]),
                            Nombre = reader["NOMBRE"].ToString(),
                            Municipio = reader["MUNICIPIO"].ToString(),
                            Descripcion = reader["DESCRIPCION"].ToString(),
                            CalificacionPromedio = Convert.ToDecimal(reader["CALIFICACION_PROMEDIO"]),
                            UrlFoto = reader["UrlFoto"].ToString()
                        });
                    }
                }
            }
            return Ok(new { isSuccess = true, objeto = lista });
        }
    }

    // Modelo sencillo para recibir la petición
    public class FavoritoRequest
    {
        public long IdUsuario { get; set; }
        public long IdDestino { get; set; }
    }
}
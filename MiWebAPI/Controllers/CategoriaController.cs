using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriaController : ControllerBase
    {
        private readonly string _conexion;
        public CategoriaController(IConfiguration config)
        {
            _conexion = config.GetConnectionString("CadenaSQL");
        }

        // Petición POST (Punto de rúbrica)
        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] CategoriaRequest req)
        {
            using (SqlConnection con = new SqlConnection(_conexion))
            {
                SqlCommand cmd = new SqlCommand("sp_Categoria_Registrar", con);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Nombre", req.Nombre);
                cmd.Parameters.AddWithValue("@Descripcion", req.Descripcion);

                await con.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        // La información llega a la API y devuelve el formato exacto de la rúbrica
                        return Ok(new
                        {
                            numeroError = Convert.ToInt32(reader["numeroError"]),
                            respuesta = reader["respuesta"].ToString(),
                            id = Convert.ToInt32(reader["idNuevo"]),
                            nombre = reader["nombreNuevo"].ToString(),
                            descripcion = reader["descripcionNueva"].ToString()
                        });
                    }
                }
            }
            return BadRequest(new { numeroError = 500, respuesta = "Error interno de servidor." });
        }
    }

    public class CategoriaRequest
    {
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
    }
}
using Microsoft.AspNetCore.Mvc;
using MiWebAPI.Models;
using System.Data;
using System.Data.SqlClient;
using TuriStar.Models;

namespace MiWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly string _conexion;

        public DashboardController(IConfiguration config)
        {
            _conexion = config.GetConnectionString("CadenaSQL");
        }

        [HttpGet("estadisticas")]
        public async Task<IActionResult> ObtenerEstadisticas()
        {
            List<Estadistica> lista = new List<Estadistica>();
            using (SqlConnection con = new SqlConnection(_conexion))
            {
                SqlCommand cmd = new SqlCommand("sp_Dashboard_Estadisticas", con);
                cmd.CommandType = CommandType.StoredProcedure;

                await con.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        lista.Add(new Estadistica
                        {
                            Nombre = reader["NOMBRE"].ToString(),
                            Calificacion = Convert.ToDecimal(reader["CALIFICACION_PROMEDIO"]),
                            TotalVisitas = Convert.ToInt32(reader["TotalInteracciones"])
                        });
                    }
                }
            }
            return Ok(new { isSuccess = true, objeto = lista });
        }
    }
}
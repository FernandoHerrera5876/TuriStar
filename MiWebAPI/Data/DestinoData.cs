using System.Data;
using System.Data.SqlClient;
using MiWebAPI.Models;

namespace MiWebAPI.Data
{
    public class DestinoData
    {
        private readonly string _conexion;

        public DestinoData(IConfiguration configuracion)
        {
            _conexion = configuracion.GetConnectionString("CadenaSQL");
        }

        public async Task<List<Destino>> ObtenerTodos()
        {
            List<Destino> lista = new List<Destino>();

            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Destino_ObtenerTodos", con);
                    cmd.CommandType = CommandType.StoredProcedure;

                    await con.OpenAsync();

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            lista.Add(new Destino
                            {
                                IdDestino = Convert.ToInt64(reader["ID_DESTINO"]),
                                Nombre = reader["NOMBRE"].ToString(),
                                Municipio = reader["MUNICIPIO"].ToString(),
                                Descripcion = reader["DESCRIPCION"].ToString(),
                                Horarios = reader["HORARIOS"].ToString(),
                                PrecioEntrada = reader["PRECIO_ENTRADA"] != DBNull.Value ? Convert.ToDecimal(reader["PRECIO_ENTRADA"]) : 0,
                                PrecioEstacionamiento = reader["PRECIO_ESTACIONAMIENTO"] != DBNull.Value ? Convert.ToDecimal(reader["PRECIO_ESTACIONAMIENTO"]) : 0,
                                ComoLlegar = reader["COMO_LLEGAR"].ToString(),
                                Latitud = reader["LATITUD"] != DBNull.Value ? Convert.ToDecimal(reader["LATITUD"]) : 0,
                                Longitud = reader["LONGITUD"] != DBNull.Value ? Convert.ToDecimal(reader["LONGITUD"]) : 0,
                                CalificacionPromedio = reader["CALIFICACION_PROMEDIO"] != DBNull.Value ? Convert.ToDecimal(reader["CALIFICACION_PROMEDIO"]) : 0,
                                IdCategoria = Convert.ToInt64(reader["ID_CATEGORIA"]),
                                UrlFoto = reader["URL_FOTO"] != DBNull.Value ? reader["URL_FOTO"].ToString() : "https://via.placeholder.com/500x300?text=Sin+Foto"
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // En consola de Visual Studio podremos ver si falla algo de SQL
                Console.WriteLine("Error al consultar destinos: " + ex.Message);
            }

            return lista;
        }

        public async Task<(bool IsSuccess, string Mensaje, long IdDestino)> Registrar(Destino destino)
        {
            bool isSuccess = false;
            string mensaje = string.Empty;
            long idDestino = 0;

            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Destino_Registrar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Nombre", destino.Nombre);
                    cmd.Parameters.AddWithValue("@Municipio", destino.Municipio);
                    cmd.Parameters.AddWithValue("@Descripcion", destino.Descripcion);
                    cmd.Parameters.AddWithValue("@UrlFoto", string.IsNullOrEmpty(destino.UrlFoto) ? "https://via.placeholder.com/500?text=Sin+Foto" : destino.UrlFoto);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            isSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            mensaje = reader["Mensaje"].ToString();
                            idDestino = Convert.ToInt64(reader["IdDestino"]);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                isSuccess = false;
                mensaje = ex.Message;
            }

            return (isSuccess, mensaje, idDestino);
        }
    }
}

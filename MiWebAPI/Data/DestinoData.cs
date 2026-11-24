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
                                Horarios = reader["HORARIOS"] != DBNull.Value ? reader["HORARIOS"].ToString() : "",
                                PrecioEntrada = reader["PRECIO_ENTRADA"] != DBNull.Value ? Convert.ToDecimal(reader["PRECIO_ENTRADA"]) : 0,
                                PrecioEstacionamiento = reader["PRECIO_ESTACIONAMIENTO"] != DBNull.Value ? Convert.ToDecimal(reader["PRECIO_ESTACIONAMIENTO"]) : 0,
                                ComoLlegar = reader["COMO_LLEGAR"] != DBNull.Value ? reader["COMO_LLEGAR"].ToString() : "",
                                Latitud = reader["LATITUD"] != DBNull.Value ? Convert.ToDecimal(reader["LATITUD"]) : 0,
                                Longitud = reader["LONGITUD"] != DBNull.Value ? Convert.ToDecimal(reader["LONGITUD"]) : 0,
                                CalificacionPromedio = reader["CALIFICACION_PROMEDIO"] != DBNull.Value ? Convert.ToDecimal(reader["CALIFICACION_PROMEDIO"]) : 0,
                                IdCategoria = reader["ID_CATEGORIA"] != DBNull.Value ? Convert.ToInt64(reader["ID_CATEGORIA"]) : 0,
                                UrlFoto = reader["UrlFoto"] != DBNull.Value ? reader["UrlFoto"].ToString() : "https://via.placeholder.com/500x300?text=Sin+Foto",
                                HorarioLunes = reader["HORARIO_LUNES"] != DBNull.Value ? reader["HORARIO_LUNES"].ToString() : "Sin dato",
                                HorarioMartes = reader["HORARIO_MARTES"] != DBNull.Value ? reader["HORARIO_MARTES"].ToString() : "Sin dato",
                                HorarioMiercoles = reader["HORARIO_MIERCOLES"] != DBNull.Value ? reader["HORARIO_MIERCOLES"].ToString() : "Sin dato",
                                HorarioJueves = reader["HORARIO_JUEVES"] != DBNull.Value ? reader["HORARIO_JUEVES"].ToString() : "Sin dato",
                                HorarioViernes = reader["HORARIO_VIERNES"] != DBNull.Value ? reader["HORARIO_VIERNES"].ToString() : "Sin dato",
                                HorarioSabado = reader["HORARIO_SABADO"] != DBNull.Value ? reader["HORARIO_SABADO"].ToString() : "Sin dato",
                                HorarioDomingo = reader["HORARIO_DOMINGO"] != DBNull.Value ? reader["HORARIO_DOMINGO"].ToString() : "Sin dato",
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al consultar destinos: " + ex.Message);
            }

            return lista;
        }

        public async Task<List<object>> ObtenerCategorias()
        {
            List<object> lista = new List<object>();

            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("SELECT ID_CATEGORIA, NOMBRE FROM dbo.CATEGORIA ORDER BY NOMBRE", con);
                    await con.OpenAsync();

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            lista.Add(new
                            {
                                idCategoria = Convert.ToInt64(reader["ID_CATEGORIA"]),
                                nombre = reader["NOMBRE"].ToString()
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al consultar categorías: " + ex.Message);
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
                    cmd.Parameters.AddWithValue("@Latitud", destino.Latitud);
                    cmd.Parameters.AddWithValue("@Longitud", destino.Longitud);
                    cmd.Parameters.AddWithValue("@PrecioEntrada", destino.PrecioEntrada);
                    cmd.Parameters.AddWithValue("@PrecioEstacionamiento", destino.PrecioEstacionamiento);
                    cmd.Parameters.AddWithValue("@ComoLlegar", string.IsNullOrWhiteSpace(destino.ComoLlegar) ? "Sigue la ruta en el mapa." : destino.ComoLlegar.Trim());
                    cmd.Parameters.AddWithValue("@IdCategoria", destino.IdCategoria);
                    cmd.Parameters.AddWithValue("@HLunes", destino.HorarioLunes ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HMartes", destino.HorarioMartes ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HMiercoles", destino.HorarioMiercoles ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HJueves", destino.HorarioJueves ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HViernes", destino.HorarioViernes ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HSabado", destino.HorarioSabado ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HDomingo", destino.HorarioDomingo ?? "09:00 - 18:00");

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

        public async Task<Respuesta> Actualizar(Destino destino)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Destino_Actualizar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@IdDestino", destino.IdDestino);
                    cmd.Parameters.AddWithValue("@Nombre", destino.Nombre);
                    cmd.Parameters.AddWithValue("@Municipio", destino.Municipio);
                    cmd.Parameters.AddWithValue("@Descripcion", destino.Descripcion);
                    cmd.Parameters.AddWithValue("@PrecioEntrada", destino.PrecioEntrada);
                    cmd.Parameters.AddWithValue("@PrecioEstacionamiento", destino.PrecioEstacionamiento);
                    cmd.Parameters.AddWithValue("@ComoLlegar", string.IsNullOrWhiteSpace(destino.ComoLlegar) ? "Sigue la ruta en el mapa." : destino.ComoLlegar.Trim());
                    cmd.Parameters.AddWithValue("@IdCategoria", destino.IdCategoria);
                    cmd.Parameters.AddWithValue("@Latitud", destino.Latitud != 0 ? (object)destino.Latitud : DBNull.Value);
                    cmd.Parameters.AddWithValue("@Longitud", destino.Longitud != 0 ? (object)destino.Longitud : DBNull.Value);
                    cmd.Parameters.AddWithValue("@UrlFoto", string.IsNullOrWhiteSpace(destino.UrlFoto) ? DBNull.Value : (object)destino.UrlFoto);
                    cmd.Parameters.AddWithValue("@HLunes", destino.HorarioLunes ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HMartes", destino.HorarioMartes ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HMiercoles", destino.HorarioMiercoles ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HJueves", destino.HorarioJueves ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HViernes", destino.HorarioViernes ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HSabado", destino.HorarioSabado ?? "09:00 - 18:00");
                    cmd.Parameters.AddWithValue("@HDomingo", destino.HorarioDomingo ?? "09:00 - 18:00");

                    await con.OpenAsync();
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            respuesta.IsSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            respuesta.Mensaje = reader["Mensaje"].ToString();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                respuesta.IsSuccess = false;
                respuesta.Mensaje = ex.Message;
            }
            return respuesta;
        }

        public async Task<Respuesta> Eliminar(long idDestino)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Destino_Eliminar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@IdDestino", idDestino);

                    await con.OpenAsync();
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            respuesta.IsSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            respuesta.Mensaje = reader["Mensaje"].ToString();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                respuesta.IsSuccess = false;
                respuesta.Mensaje = ex.Message;
            }
            return respuesta;
        }
    }
}
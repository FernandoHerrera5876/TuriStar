using System.Data;
using System.Data.SqlClient;
using MiWebAPI.Models;

namespace MiWebAPI.Data
{
    public class ResenaData
    {
        private readonly string _conexion;

        public ResenaData(IConfiguration configuracion)
        {
            _conexion = configuracion.GetConnectionString("CadenaSQL");
        }

        // Devolvemos una tupla (bool IsSuccess, string Mensaje) en lugar del objeto Respuesta
        public async Task<(bool IsSuccess, string Mensaje)> Registrar(Resena resena)
        {
            bool isSuccess = false;
            string mensaje = string.Empty;

            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Resena_Registrar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Calificacion", resena.Calificacion);
                    cmd.Parameters.AddWithValue("@Comentario", resena.Comentario);
                    cmd.Parameters.AddWithValue("@IdUsuario", resena.IdUsuario);
                    cmd.Parameters.AddWithValue("@IdDestino", resena.IdDestino);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            isSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            mensaje = reader["Mensaje"].ToString();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                isSuccess = false;
                mensaje = ex.Message;
            }

            return (isSuccess, mensaje);
        }

        public async Task<List<Resena>> ObtenerPorDestino(long idDestino)
        {
            List<Resena> lista = new List<Resena>();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Resena_ObtenerPorDestino", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@IdDestino", idDestino);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            lista.Add(new Resena
                            {
                                IdResena = Convert.ToInt64(reader["ID_RESENA"]),
                                Calificacion = Convert.ToDecimal(reader["CALIFICACION"]),
                                Comentario = reader["COMENTARIO"].ToString(),
                                FechaCreacion = Convert.ToDateTime(reader["FECHA_CREACION"]),
                                IdUsuario = Convert.ToInt32(reader["ID_USUARIO"]),
                                NombreUsuario = reader["NombreUsuario"].ToString(),
                                FotoUsuario = reader["FotoUsuario"] != DBNull.Value ? reader["FotoUsuario"].ToString() : null
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al consultar reseñas: " + ex.Message);
            }
            return lista;
        }

        public async Task<List<Resena>> ObtenerTodas()
        {
            List<Resena> lista = new List<Resena>();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Resena_ObtenerTodas", con);
                    cmd.CommandType = CommandType.StoredProcedure;

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            lista.Add(new Resena
                            {
                                IdResena = Convert.ToInt64(reader["ID_RESENA"]),
                                Calificacion = Convert.ToDecimal(reader["CALIFICACION"]),
                                Comentario = reader["COMENTARIO"].ToString(),
                                FechaCreacion = Convert.ToDateTime(reader["FECHA_CREACION"]),
                                NombreUsuario = reader["NombreUsuario"].ToString(),
                                FotoUsuario = reader["FotoUsuario"] != DBNull.Value ? reader["FotoUsuario"].ToString() : null,
                                NombreDestino = reader["NombreDestino"].ToString(),
                                IdDestino = Convert.ToInt64(reader["ID_DESTINO"])
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }
            return lista;
        }

        public async Task<List<Resena>> ObtenerPorUsuario(int idUsuario)
        {
            List<Resena> lista = new List<Resena>();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Resena_ObtenerPorUsuario", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            lista.Add(new Resena
                            {
                                IdResena = Convert.ToInt64(reader["ID_RESENA"]),
                                Calificacion = Convert.ToDecimal(reader["CALIFICACION"]),
                                Comentario = reader["COMENTARIO"].ToString(),
                                FechaCreacion = Convert.ToDateTime(reader["FECHA_CREACION"]),
                                NombreDestino = reader["NombreDestino"].ToString(),
                                IdDestino = Convert.ToInt64(reader["ID_DESTINO"])
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }
            return lista;
        }
    }
}
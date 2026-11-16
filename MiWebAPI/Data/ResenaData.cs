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
        public async Task<Respuesta> Registrar(Resena resena)
        {
            Respuesta respuesta = new Respuesta(); // Soluciona el error CS0103
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Resena_Registrar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@IdUsuario", resena.IdUsuario);
                    cmd.Parameters.AddWithValue("@IdDestino", resena.IdDestino);
                    cmd.Parameters.AddWithValue("@Calificacion", resena.Calificacion);
                    cmd.Parameters.AddWithValue("@Comentario", resena.Comentario);

                    await con.OpenAsync();
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            respuesta.IsSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            respuesta.Mensaje = reader["Mensaje"].ToString();

                            if (respuesta.IsSuccess)
                            {
                                // Guardamos el ID en la propiedad Objeto (Soluciona el error CS1061 del controlador)
                                respuesta.Objeto = Convert.ToInt32(reader["IdResenaNueva"]);
                            }
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
                            string fotosBD = reader["FOTOS_RESENA"].ToString();
                            List<string> listaFotos = new List<string>();
                            if (!string.IsNullOrEmpty(fotosBD))
                            {
                                listaFotos = fotosBD.Split(',').ToList();
                            }
                            lista.Add(new Resena
                            {
                                IdResena = Convert.ToInt64(reader["ID_RESENA"]),
                                Calificacion = Convert.ToDecimal(reader["CALIFICACION"]),
                                Comentario = reader["COMENTARIO"].ToString(),
                                FechaCreacion = reader["FECHA_CREACION"] != DBNull.Value ? Convert.ToDateTime(reader["FECHA_CREACION"]) : DateTime.Now,
                                IdUsuario = Convert.ToInt32(reader["ID_USUARIO"]),
                                NombreUsuario = reader["NombreUsuario"].ToString(),
                                FotoUsuario = reader["FotoUsuario"] != DBNull.Value ? reader["FotoUsuario"].ToString() : null,
                                Fotos = listaFotos
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
                                FechaCreacion = reader["FECHA_CREACION"] != DBNull.Value ? Convert.ToDateTime(reader["FECHA_CREACION"]) : DateTime.Now,
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
                            // Extraer y procesar la cadena de fotos
                            string fotosBD = reader["FOTOS_RESENA"] != DBNull.Value ? reader["FOTOS_RESENA"].ToString() : "";
                            List<string> listaFotos = new List<string>();
                            if (!string.IsNullOrEmpty(fotosBD))
                            {
                                listaFotos = fotosBD.Split(',').ToList();
                            }

                            lista.Add(new Resena
                            {
                                IdResena = Convert.ToInt64(reader["ID_RESENA"]),
                                Calificacion = Convert.ToDecimal(reader["CALIFICACION"]),
                                Comentario = reader["COMENTARIO"].ToString(),
                                FechaCreacion = reader["FECHA_CREACION"] != DBNull.Value ? Convert.ToDateTime(reader["FECHA_CREACION"]) : DateTime.Now,
                                NombreDestino = reader["NombreDestino"].ToString(),
                                IdDestino = Convert.ToInt64(reader["ID_DESTINO"]),
                                Fotos = listaFotos // Agregamos la lista de fotos al objeto
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

        public async Task<Respuesta> Actualizar(Resena resena)
        {
            Respuesta respuesta = new Respuesta();
            using (SqlConnection con = new SqlConnection(_conexion))
            {
                SqlCommand cmd = new SqlCommand("sp_Resena_Actualizar", con);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdResena", resena.IdResena);
                cmd.Parameters.AddWithValue("@IdUsuario", resena.IdUsuario);
                cmd.Parameters.AddWithValue("@Calificacion", resena.Calificacion);
                cmd.Parameters.AddWithValue("@Comentario", resena.Comentario);

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
            return respuesta;
        }

        public async Task InsertarFotoResena(int idResena, string urlFoto)
        {
            using (SqlConnection con = new SqlConnection(_conexion))
            {
                SqlCommand cmd = new SqlCommand("sp_FotoResena_Registrar", con);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdResena", idResena);
                cmd.Parameters.AddWithValue("@UrlFoto", urlFoto);
                await con.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task<Respuesta> Eliminar(int idResena, int idUsuario)
        {
            Respuesta respuesta = new Respuesta(); // <-- ¡Faltaba declarar esta variable!
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Resena_Eliminar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@IdResena", idResena);
                    cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);

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
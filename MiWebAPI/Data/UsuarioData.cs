using System.Data;
using System.Data.SqlClient;
using MiWebAPI.Models;

namespace MiWebAPI.Data
{
    public class UsuarioData
    {
        private readonly string _conexion;

        public UsuarioData(IConfiguration configuracion)
        {
            _conexion = configuracion.GetConnectionString("CadenaSQL");
        }

        public async Task<Respuesta> Registrar(Usuario usuario)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Usuario_Registrar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Nombres", usuario.Nombres);
                    cmd.Parameters.AddWithValue("@Apellidos", usuario.Apellidos);
                    cmd.Parameters.AddWithValue("@FechaNacimiento", usuario.FechaNacimiento);
                    cmd.Parameters.AddWithValue("@Correo", usuario.Correo);
                    cmd.Parameters.AddWithValue("@Contrasena", usuario.Contrasena);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
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

        public async Task<Respuesta> ValidarLogin(string correo, string contrasena)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Usuario_ValidarLogin", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Correo", correo);
                    cmd.Parameters.AddWithValue("@Contrasena", contrasena);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            respuesta.IsSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            respuesta.Mensaje = reader["Mensaje"].ToString();

                            if (respuesta.IsSuccess)
                            {
                                respuesta.Objeto = new
                                {
                                    IdUsuario = Convert.ToInt32(reader["IdUsuario"]),
                                    Nombre = reader["Nombres"].ToString(),
                                    Correo = reader["Correo"].ToString()
                                };
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

        public async Task<Respuesta> Actualizar(Usuario usuario)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Usuario_Actualizar", con);
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@IdUsuario", usuario.IdUsuario);
                    cmd.Parameters.AddWithValue("@Nombres", usuario.Nombres);
                    cmd.Parameters.AddWithValue("@Apellidos", usuario.Apellidos);
                    cmd.Parameters.AddWithValue("@FechaNacimiento", usuario.FechaNacimiento);

                    // Si no envían foto, mandamos un nulo a la base de datos
                    if (string.IsNullOrEmpty(usuario.FotoPerfil))
                    {
                        cmd.Parameters.AddWithValue("@FotoPerfil", DBNull.Value);
                    }
                    else
                    {
                        cmd.Parameters.AddWithValue("@FotoPerfil", usuario.FotoPerfil);
                    }

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
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

        public async Task<Usuario> ObtenerPorId(int idUsuario)
        {
            Usuario usuario = new Usuario();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Usuario_ObtenerPorId", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            usuario.IdUsuario = Convert.ToInt32(reader["ID_USUARIO"]);
                            usuario.Nombres = reader["NOMBRES"].ToString();
                            usuario.Apellidos = reader["APELLIDOS"].ToString();
                            usuario.FechaNacimiento = Convert.ToDateTime(reader["FECHA_NACIMIENTO"]);
                            usuario.Correo = reader["CORREO"].ToString();
                            usuario.FotoPerfil = reader["FOTO_PERFIL"].ToString();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }
            return usuario;
        }
    }
}

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
                // PASO 1 y 2 del video: generar hash bcrypt con sal aleatoria y workFactor 11
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(usuario.Contrasena, workFactor: 11);

                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Usuario_Registrar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Nombres", usuario.Nombres);
                    cmd.Parameters.AddWithValue("@Apellidos", usuario.Apellidos);
                    cmd.Parameters.AddWithValue("@FechaNacimiento", usuario.FechaNacimiento);
                    cmd.Parameters.AddWithValue("@Correo", usuario.Correo.Trim());
                    cmd.Parameters.AddWithValue("@Contrasena", passwordHash); // Se guarda el hash, nunca texto plano

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
                int idUsuario = 0;
                string nombres = "";
                string correoBd = "";
                string hashGuardado = "";
                bool esAdmin = false;
                bool usuarioEncontrado = false;

                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Usuario_ValidarLogin", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Correo", correo.Trim());

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            usuarioEncontrado = true;
                            idUsuario = Convert.ToInt32(reader["IdUsuario"]);
                            nombres = reader["Nombres"].ToString() ?? "";
                            correoBd = reader["Correo"].ToString() ?? "";
                            hashGuardado = reader["ContrasenaHash"] != DBNull.Value
                                ? reader["ContrasenaHash"].ToString() ?? ""
                                : "";
                            esAdmin = reader["ES_ADMIN"] != DBNull.Value && Convert.ToBoolean(reader["ES_ADMIN"]);
                        }
                    }

                    if (!usuarioEncontrado || string.IsNullOrEmpty(hashGuardado))
                    {
                        respuesta.IsSuccess = false;
                        respuesta.Mensaje = "Correo o contraseña incorrectos.";
                        return respuesta;
                    }

                    // PASO 3 del video: en el login no se descifra, se compara con Verify
                    bool esBcrypt = hashGuardado.StartsWith("$2a$") || hashGuardado.StartsWith("$2b$") || hashGuardado.StartsWith("$2y$");
                    bool passwordValida = false;

                    if (esBcrypt)
                    {
                        passwordValida = BCrypt.Net.BCrypt.Verify(contrasena, hashGuardado);
                    }
                    else
                    {
                        // Respaldo temporal para cuentas creadas antes de bcrypt (como tu admin):
                        // si coincide una última vez, la convierte automáticamente a bcrypt en la BD.
                        passwordValida = hashGuardado == contrasena;
                        if (passwordValida)
                        {
                            string nuevoHash = BCrypt.Net.BCrypt.HashPassword(contrasena, workFactor: 11);
                            using (SqlCommand cmdMigrar = new SqlCommand("sp_Usuario_ActualizarHash", con))
                            {
                                cmdMigrar.CommandType = CommandType.StoredProcedure;
                                cmdMigrar.Parameters.AddWithValue("@IdUsuario", idUsuario);
                                cmdMigrar.Parameters.AddWithValue("@NuevoHash", nuevoHash);
                                await cmdMigrar.ExecuteNonQueryAsync();
                            }
                        }
                    }

                    if (!passwordValida)
                    {
                        respuesta.IsSuccess = false;
                        respuesta.Mensaje = "Correo o contraseña incorrectos.";
                        return respuesta;
                    }

                    // Nunca devolvemos ContrasenaHash al navegador
                    respuesta.IsSuccess = true;
                    respuesta.Mensaje = "Login exitoso.";
                    respuesta.Objeto = new
                    {
                        IdUsuario = idUsuario,
                        Nombre = nombres,
                        Correo = correoBd,
                        EsAdmin = esAdmin
                    };
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
                            usuario.EsAdmin = reader.GetSchemaTable().Select("ColumnName = 'ES_ADMIN'").Length > 0 ? Convert.ToBoolean(reader["ES_ADMIN"]) : false;
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

        public async Task<Respuesta> Eliminar(long idUsuario)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Usuario_Eliminar", con);
                    cmd.CommandType = CommandType.StoredProcedure;
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

        public async Task<Respuesta> SolicitarCodigoRegistro(Usuario usuario, string codigo)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(usuario.Contrasena, workFactor: 11);

                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Registro_SolicitarCodigo", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Nombres", usuario.Nombres.Trim());
                    cmd.Parameters.AddWithValue("@Apellidos", usuario.Apellidos.Trim());
                    cmd.Parameters.AddWithValue("@FechaNacimiento", usuario.FechaNacimiento);
                    cmd.Parameters.AddWithValue("@Correo", usuario.Correo.Trim().ToLowerInvariant());
                    cmd.Parameters.AddWithValue("@ContrasenaHash", passwordHash);
                    cmd.Parameters.AddWithValue("@Codigo", codigo);

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            respuesta.IsSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            respuesta.Mensaje = reader["Mensaje"].ToString() ?? "";
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

        public async Task<Respuesta> ConfirmarRegistro(string correo, string codigo)
        {
            Respuesta respuesta = new Respuesta();
            try
            {
                using (SqlConnection con = new SqlConnection(_conexion))
                {
                    SqlCommand cmd = new SqlCommand("sp_Registro_ConfirmarCodigo", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Correo", correo.Trim().ToLowerInvariant());
                    cmd.Parameters.AddWithValue("@Codigo", codigo.Trim());

                    await con.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            respuesta.IsSuccess = Convert.ToInt32(reader["IsSuccess"]) == 1;
                            respuesta.Mensaje = reader["Mensaje"].ToString() ?? "";
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

namespace MiWebAPI.Models
{
    public class Usuario
    {
        public int IdUsuario { get; set; }
        public string? Nombres { get; set; }
        public string? Apellidos { get; set; }
        public DateTime FechaNacimiento { get; set; }
        public string? Correo { get; set; }
        public string? Contrasena { get; set; }
        public string? FotoPerfil { get; set; }
    }
}
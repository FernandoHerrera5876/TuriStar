namespace MiWebAPI.Models
{
    public class ConfirmarRegistroRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
    }
}
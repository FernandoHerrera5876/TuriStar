namespace MiWebAPI.Models
{
    public class Resena
    {
        public long IdResena { get; set; }
        public decimal Calificacion { get; set; }
        public string? Comentario { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int IdUsuario { get; set; }
        public long IdDestino { get; set; }
        public string? NombreUsuario { get; set; }
        public string? FotoUsuario { get; set; }
        public string? NombreDestino { get; set; }
    }
}

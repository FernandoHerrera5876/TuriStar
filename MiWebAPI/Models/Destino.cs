namespace MiWebAPI.Models
{
    public class Destino
    {
        public long IdDestino { get; set; }
        public string? Nombre { get; set; }
        public string? Municipio { get; set; }
        public string? Descripcion { get; set; }
        public string? Horarios { get; set; }
        public decimal PrecioEntrada { get; set; }
        public decimal PrecioEstacionamiento { get; set; }
        public string? ComoLlegar { get; set; }
        public decimal Latitud { get; set; }
        public decimal Longitud { get; set; }
        public decimal CalificacionPromedio { get; set; }
        public long IdCategoria { get; set; }
        public string? UrlFoto { get; set; }
        public string? HorarioLunes { get; set; }
        public string? HorarioMartes { get; set; }
        public string? HorarioMiercoles { get; set; }
        public string? HorarioJueves { get; set; }
        public string? HorarioViernes { get; set; }
        public string? HorarioSabado { get; set; }
        public string? HorarioDomingo { get; set; }
    }
}

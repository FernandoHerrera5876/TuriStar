namespace MiWebAPI.Models
{
    public class Respuesta
    {
        public bool IsSuccess { get; set; }
        public string Mensaje { get; set; }
        public object Objeto { get; set; }
    }
}

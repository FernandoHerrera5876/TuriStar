using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;

namespace MiWebAPI.Helpers
{
    public static class EmailHelper
    {
        public static string GenerarCodigo6Digitos()
        {
            return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        }

        public static async Task EnviarCodigoVerificacionAsync(IConfiguration config, string correoDestino, string nombreUsuario, string codigo)
        {
            string host = config["EmailSettings:Host"] ?? "smtp.gmail.com";
            int port = int.TryParse(config["EmailSettings:Port"], out int p) ? p : 587;
            string correoEmisor = config["EmailSettings:CorreoEmisor"] ?? string.Empty;
            string passwordApp = (config["EmailSettings:PasswordApp"] ?? string.Empty).Replace(" ", "");
            string nombreEmisor = config["EmailSettings:NombreEmisor"] ?? "TuriStar";

            if (string.IsNullOrWhiteSpace(correoEmisor) || string.IsNullOrWhiteSpace(passwordApp))
            {
                throw new InvalidOperationException("El servicio de correo no está configurado en el servidor.");
            }

            string cuerpoHtml = $@"
                <div style='font-family: Arial, sans-serif; background-color: #0b1320; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #22c55e;'>
                    <h2 style='color: #4ade80; margin-top: 0;'>TuriStar · Verifica tu correo</h2>
                    <p style='color: #cbd5e1; font-size: 15px;'>Hola <strong>{WebUtility.HtmlEncode(nombreUsuario)}</strong>,</p>
                    <p style='color: #cbd5e1; font-size: 15px;'>Usa el siguiente código para completar tu registro en TuriStar:</p>
                    <div style='background-color: #132036; border: 1px solid #4ade80; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff;'>{codigo}</span>
                    </div>
                    <p style='color: #94a3b8; font-size: 13px; margin-bottom: 0;'>Este código caduca en <strong>10 minutos</strong>. Si no solicitaste esta cuenta, ignora este mensaje.</p>
                </div>";

            using var mensaje = new MailMessage
            {
                From = new MailAddress(correoEmisor, nombreEmisor),
                Subject = $"{codigo} es tu código de verificación de TuriStar",
                Body = cuerpoHtml,
                IsBodyHtml = true
            };
            mensaje.To.Add(correoDestino);

            using var smtp = new SmtpClient(host, port)
            {
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(correoEmisor, passwordApp)
            };

            await smtp.SendMailAsync(mensaje);
        }
    }
}
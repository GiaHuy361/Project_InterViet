using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;

namespace Interviet.Infrastructure.Services;

public sealed class SmtpEmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<EmailOptions> options, ILogger<SmtpEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        try
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
            email.To.Add(new MailboxAddress(message.ToName, message.ToAddress));
            email.Subject = message.Subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = message.HtmlBody,
                TextBody = message.TextBody
            };

            email.Body = bodyBuilder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_options.Host, _options.Port, SecureSocketOptions.StartTls, ct);
            await smtp.AuthenticateAsync(_options.Username, _options.Password, ct);
            await smtp.SendAsync(email, ct);
            await smtp.DisconnectAsync(true, ct);

            _logger.LogInformation("Email sent successfully to {ToAddress}. Subject: {Subject}", message.ToAddress, message.Subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToAddress}. Subject: {Subject}", message.ToAddress, message.Subject);
            // We swallow the exception to prevent email failures from breaking core flows (like User Registration).
            // In a production app, we might use a resilient outbox pattern instead.
        }
    }
}

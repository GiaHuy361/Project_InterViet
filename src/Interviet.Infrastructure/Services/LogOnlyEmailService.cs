using Interviet.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Stub email service — logs the email to Serilog instead of sending.
/// Replace with SendGrid/Resend/SMTP adapter in later phases.
/// </summary>
public sealed class LogOnlyEmailService : IEmailService
{
    private readonly ILogger<LogOnlyEmailService> _logger;

    public LogOnlyEmailService(ILogger<LogOnlyEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[EMAIL STUB] To={To} Subject={Subject} Template={Template}",
            message.ToAddress,
            message.Subject,
            message.TemplateCode ?? "inline");

        return Task.CompletedTask;
    }
}

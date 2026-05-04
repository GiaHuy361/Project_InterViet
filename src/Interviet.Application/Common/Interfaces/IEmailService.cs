namespace Interviet.Application.Common.Interfaces;

public record EmailMessage(
    string ToAddress,
    string ToName,
    string Subject,
    string HtmlBody,
    string? TextBody = null,
    string? TemplateCode = null
);

/// <summary>
/// Email sending abstraction.
/// Phase 0: implemented as LogOnlyEmailService (logs to Serilog, does not actually send).
/// </summary>
public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
}

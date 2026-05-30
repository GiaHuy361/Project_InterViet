using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;

namespace Interviet.Infrastructure.Services;

public sealed class ResendEmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(
        IOptions<EmailOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<ResendEmailService> logger)
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        try
        {
            var apiKey = _options.Password;
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Resend API key (Email:Password) is missing. Skipping email send to {ToAddress}.", message.ToAddress);
                return;
            }

            var client = _httpClientFactory.CreateClient("Resend");
            
            // Set Authorization Header using the API Key
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            // Construct the sender string
            var fromString = string.IsNullOrWhiteSpace(_options.FromName)
                ? _options.FromAddress
                : $"{_options.FromName} <{_options.FromAddress}>";

            // Prepare the payload matching Resend API: https://resend.com/docs/api-reference/emails/send-email
            var payload = new
            {
                from = fromString,
                to = new[] { message.ToAddress },
                subject = message.Subject,
                html = message.HtmlBody
            };

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation("Sending email to {ToAddress} via Resend API...", message.ToAddress);

            var response = await client.PostAsync("https://api.resend.com/emails", content, ct);
            if (!response.IsSuccessStatusCode)
            {
                var errorResponse = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Resend API returned error status {StatusCode}: {Error}", response.StatusCode, errorResponse);
                return;
            }

            _logger.LogInformation("Email sent successfully via Resend to {ToAddress}. Subject: {Subject}", message.ToAddress, message.Subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via Resend to {ToAddress}. Subject: {Subject}", message.ToAddress, message.Subject);
        }
    }
}

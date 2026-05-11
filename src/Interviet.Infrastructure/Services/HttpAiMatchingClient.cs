using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Calls the Python CV-JD matching service via HTTP JSON POST.
/// Never fakes results — returns Failure or Unavailable on errors.
/// </summary>
public sealed class HttpAiMatchingClient : IAiMatchingClient
{
    private readonly HttpClient _http;
    private readonly AiServicesOptions _opts;
    private readonly ILogger<HttpAiMatchingClient> _logger;

    public HttpAiMatchingClient(
        HttpClient http,
        IOptions<AiServicesOptions> opts,
        ILogger<HttpAiMatchingClient> logger)
    {
        _http   = http;
        _opts   = opts.Value;
        _logger = logger;
    }

    public async Task<AiMatchResult> MatchAsync(AiMatchRequest request, CancellationToken ct = default)
    {
        if (!_opts.MatchingEnabled)
        {
            _logger.LogInformation(
                "Matching service disabled. Skipping match for SessionId={SessionId}", request.MatchSessionId);
            return AiMatchResult.Unavailable("Dịch vụ matching hiện chưa được bật.");
        }

        try
        {
            // Build JSON body per Python contract
            var body = new
            {
                userId           = request.UserId.ToString(),
                resumeId         = request.ResumeId.ToString(),
                resumeVersionId  = request.ResumeVersionId.ToString(),
                jobDescriptionId = request.JobDescriptionId.ToString(),
                matchJobId       = request.MatchSessionId.ToString(),
                correlationId    = request.CorrelationId,
                requestId        = request.RequestId,
                schemaVersion    = "cv-jd-match-v1",
                matchIndex       = request.MatchIndex,   // optional, e.g. "1/3" for multi-match
                resumeParsedData = new
                {
                    rawText          = request.RawText,
                    skillsJson       = request.SkillsJson,
                    experiencesJson  = request.ExperiencesJson,
                    educationsJson   = request.EducationsJson,
                    sectionsJson     = request.SectionsJson,
                    projectsJson     = request.ProjectsJson,
                    certificationsJson = request.CertificationsJson,
                    languagesJson    = request.LanguagesJson
                },
                jobDescription = new
                {
                    rawText = request.JobDescriptionRawText
                }
            };

            var json    = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/v1/cv/match")
            {
                Content = content
            };
            httpRequest.Headers.TryAddWithoutValidation("X-User-ID",        request.UserId.ToString());
            httpRequest.Headers.TryAddWithoutValidation("X-Correlation-ID", request.CorrelationId);
            httpRequest.Headers.TryAddWithoutValidation("X-Request-ID",     request.RequestId);
            if (!string.IsNullOrEmpty(_opts.ApiKey))
                httpRequest.Headers.Add("X-Interviet-Api-Key", _opts.ApiKey);

            _logger.LogInformation(
                "Calling CV Matching Service. SessionId={SessionId} MatchIndex={MatchIndex} CorrelationId={CorrelationId}",
                request.MatchSessionId, request.MatchIndex ?? "single", request.CorrelationId);

            using var response = await _http.SendAsync(httpRequest, ct);
            var responseBody   = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Matching Service returned {Status}. SessionId={SessionId} Body={Body}",
                    response.StatusCode, request.MatchSessionId, responseBody);
                // Parse Python error body for structured error code/message
                return ParsePythonResponse(responseBody, request.MatchSessionId);
            }

            return ParsePythonResponse(responseBody, request.MatchSessionId);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("Matching Service timed out. SessionId={SessionId}", request.MatchSessionId);
            return AiMatchResult.Unavailable("Dịch vụ matching không phản hồi (timeout).");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Matching Service unreachable. SessionId={SessionId}", request.MatchSessionId);
            return AiMatchResult.Unavailable("Dịch vụ matching hiện chưa sẵn sàng.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling Matching Service. SessionId={SessionId}", request.MatchSessionId);
            return AiMatchResult.Failure("MATCHING_SERVICE_UNEXPECTED", "Lỗi không xác định khi gọi dịch vụ matching.");
        }
    }

    private static AiMatchResult ParsePythonResponse(string body, Guid sessionId)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var root      = doc.RootElement;

            var success = root.TryGetProperty("success", out var successProp) && successProp.GetBoolean();

            if (!success)
            {
                var errorCode = root.TryGetProperty("error", out var err) && err.TryGetProperty("code", out var c)
                    ? c.GetString() : "MATCH_ERROR";
                var errorMsg = err.TryGetProperty("message", out var m) ? m.GetString() : "Matching thất bại.";

                if (string.Equals(errorCode, "SERVICE_UNAVAILABLE", StringComparison.OrdinalIgnoreCase))
                    return AiMatchResult.Unavailable(errorMsg ?? "Dịch vụ matching hiện chưa sẵn sàng.");

                return AiMatchResult.Failure(errorCode ?? "MATCH_ERROR", errorMsg ?? "Matching thất bại.");
            }

            var data = root.GetProperty("data");

            decimal? GetDecimal(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null
                    ? (decimal?)p.GetDecimal() : null;

            string? GetStr(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null
                    ? p.GetString() : null;

            string? GetJson(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null
                    ? p.GetRawText() : null;

            var overallScore = GetDecimal("overallScore") ?? 0m;

            return AiMatchResult.Success(
                overallScore:       overallScore,
                skillScore:         GetDecimal("skillScore"),
                experienceScore:    GetDecimal("experienceScore"),
                educationScore:     GetDecimal("educationScore"),
                languageScore:      GetDecimal("languageScore"),
                matchedSkillsJson:  GetJson("matchedSkills"),
                missingSkillsJson:  GetJson("missingSkills"),
                strengthsJson:      GetJson("strengths"),
                weaknessesJson:     GetJson("weaknesses"),
                recommendationsJson: GetJson("recommendations"),
                summaryText:        GetStr("summary"),
                modelVersion:       GetStr("modelVersion"),
                schemaVersion:      GetStr("schemaVersion"),
                rawResponseJson:    body
            );
        }
        catch (JsonException)
        {
            return AiMatchResult.Failure("INVALID_RESPONSE",
                "Dịch vụ matching trả về dữ liệu không hợp lệ.");
        }
    }
}

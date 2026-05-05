using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Calls the Python CV parsing service via HTTP multipart/form-data.
/// Never fakes results — returns Failure or Unavailable on errors.
/// </summary>
public sealed class HttpAiResumeParserClient : IAiResumeParserClient
{
    private readonly HttpClient _http;
    private readonly AiServicesOptions _opts;
    private readonly ILogger<HttpAiResumeParserClient> _logger;

    public HttpAiResumeParserClient(
        HttpClient http,
        IOptions<AiServicesOptions> opts,
        ILogger<HttpAiResumeParserClient> logger)
    {
        _http   = http;
        _opts   = opts.Value;
        _logger = logger;
    }

    public async Task<AiParseResumeResult> ParseResumeAsync(AiParseResumeRequest request, CancellationToken ct = default)
    {
        if (!_opts.CvServiceEnabled)
        {
            _logger.LogInformation("CV Service disabled. Skipping parse for ResumeId={ResumeId}", request.ResumeId);
            return AiParseResumeResult.Unavailable("Dịch vụ phân tích CV hiện chưa được bật.");
        }

        if (!File.Exists(request.FilePath))
        {
            _logger.LogWarning("File not found for parsing. Path={Path} ResumeId={ResumeId}", request.FilePath, request.ResumeId);
            return AiParseResumeResult.Failure("FILE_NOT_FOUND", "File CV không tìm thấy để gửi đi phân tích.");
        }

        try
        {
            using var form = new MultipartFormDataContent();

            // Metadata fields
            form.Add(new StringContent(request.ResumeId.ToString()),        "resumeId");
            form.Add(new StringContent(request.ResumeVersionId.ToString()), "resumeVersionId");
            form.Add(new StringContent(request.UserId.ToString()),          "userId");
            form.Add(new StringContent(request.CorrelationId),              "correlationId");
            form.Add(new StringContent(request.RequestId),                  "requestId");
            form.Add(new StringContent(request.OriginalFileName),           "originalFileName");
            form.Add(new StringContent(request.ContentType),                "contentType");
            form.Add(new StringContent("resume-parse-v1"),                  "schemaVersion");

            // File content
            var fileBytes   = await File.ReadAllBytesAsync(request.FilePath, ct);
            var fileContent = new ByteArrayContent(fileBytes);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(request.ContentType);
            form.Add(fileContent, "file", request.OriginalFileName);

            // Request
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/v1/cv/parse") { Content = form };
            httpRequest.Headers.TryAddWithoutValidation("X-User-ID", request.UserId.ToString());
            httpRequest.Headers.TryAddWithoutValidation("X-Correlation-ID", request.CorrelationId);
            httpRequest.Headers.TryAddWithoutValidation("X-Request-ID", request.RequestId);
            
            if (!string.IsNullOrEmpty(_opts.ApiKey))
                httpRequest.Headers.Add("X-Interviet-Api-Key", _opts.ApiKey);

            _logger.LogInformation("Calling CV Service. ResumeId={ResumeId} CorrelationId={CorrelationId}",
                request.ResumeId, request.CorrelationId);

            using var response = await _http.SendAsync(httpRequest, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("CV Service returned {Status}. ResumeId={ResumeId} Body={Body}",
                    response.StatusCode, request.ResumeId, body);
                // Parse Python error body to get structured error code/message
                return ParsePythonResponse(body, request.ResumeId);
            }

            return ParsePythonResponse(body, request.ResumeId);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("CV Service timed out. ResumeId={ResumeId}", request.ResumeId);
            return AiParseResumeResult.Unavailable("Dịch vụ phân tích CV không phản hồi (timeout).");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "CV Service unreachable. ResumeId={ResumeId}", request.ResumeId);
            return AiParseResumeResult.Unavailable("Dịch vụ phân tích CV hiện chưa sẵn sàng.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling CV Service. ResumeId={ResumeId}", request.ResumeId);
            return AiParseResumeResult.Failure("CV_SERVICE_UNEXPECTED", "Lỗi không xác định khi gọi dịch vụ phân tích CV.");
        }
    }

    private static AiParseResumeResult ParsePythonResponse(string body, Guid resumeId)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var root      = doc.RootElement;

            var success = root.TryGetProperty("success", out var successProp) && successProp.GetBoolean();

            if (!success)
            {
                var errorCode = root.TryGetProperty("error", out var err) && err.TryGetProperty("code", out var c)
                    ? c.GetString() : "PARSE_ERROR";
                var errorMsg = err.TryGetProperty("message", out var m) ? m.GetString() : "Xử lý CV thất bại.";

                // Map SERVICE_UNAVAILABLE to Unavailable() so job status is set correctly
                if (string.Equals(errorCode, "SERVICE_UNAVAILABLE", StringComparison.OrdinalIgnoreCase))
                    return AiParseResumeResult.Unavailable(errorMsg ?? "Dịch vụ phân tích CV hiện chưa sẵn sàng.");

                return AiParseResumeResult.Failure(errorCode ?? "PARSE_ERROR", errorMsg ?? "Xử lý CV thất bại.", body);
            }

            var data = root.GetProperty("data");

            string? GetStr(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null ? p.GetString() : null;

            string? GetJson(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null
                    ? p.GetRawText() : null;

            var sections = data.TryGetProperty("sections", out var s) && s.ValueKind != JsonValueKind.Null
                ? s.GetRawText() : null;

            return AiParseResumeResult.Success(
                rawText:         GetStr("rawText"),
                detectedLanguage: GetStr("detectedLanguage"),
                sectionsJson:    sections,
                skillsJson:      GetJson("skills"),
                experiencesJson: GetJson("experiences"),
                educationsJson:  GetJson("educations"),
                projectsJson:    GetJson("projects"),
                certificationsJson: GetJson("certifications"),
                languagesJson:   GetJson("languages"),
                warningsJson:    GetJson("warnings"),
                modelVersion:    GetStr("modelVersion"),
                schemaVersion:   GetStr("schemaVersion"),
                externalJobId:   GetStr("jobId")
            );
        }
        catch (JsonException)
        {
            return AiParseResumeResult.Failure("INVALID_RESPONSE",
                $"Dịch vụ phân tích CV trả về dữ liệu không hợp lệ.");
        }
    }
}

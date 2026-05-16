using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.Common.Options;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Calls the Python AI Interview service via HTTP JSON POST.
/// Never fakes results — returns Failure or Unavailable on errors.
/// </summary>
public sealed class HttpAiInterviewClient : IAiInterviewClient
{
    private readonly HttpClient _http;
    private readonly AiServicesOptions _opts;
    private readonly ILogger<HttpAiInterviewClient> _logger;

    public HttpAiInterviewClient(
        HttpClient http,
        IOptions<AiServicesOptions> opts,
        ILogger<HttpAiInterviewClient> logger)
    {
        _http   = http;
        _opts   = opts.Value;
        _logger = logger;
    }

    // ── GenerateQuestion ──────────────────────────────────────────────────────
    public async Task<AiInterviewQuestionResult> GenerateQuestionAsync(
        AiGenerateQuestionRequest request, CancellationToken ct = default)
    {
        if (!_opts.InterviewEnabled)
        {
            _logger.LogInformation(
                "Interview service disabled. Skipping generate-question for SessionId={SessionId}",
                request.SessionId);
            return AiInterviewQuestionResult.Unavailable("Dịch vụ AI phỏng vấn hiện chưa được bật.");
        }

        try
        {
            var body = new
            {
                sessionId               = request.SessionId.ToString(),
                userId                  = request.UserId.ToString(),
                correlationId           = request.CorrelationId,
                requestId               = request.RequestId,
                position                = request.Position,
                level                   = request.Level,
                goal                    = request.Goal,
                interviewType           = request.InterviewType,
                interviewerMode         = request.InterviewerMode,
                aiModel                 = request.AiModel,
                questionNumber          = request.QuestionNumber,
                totalExpectedQuestions  = request.TotalExpectedQuestions,
                conversationHistoryJson = request.ConversationHistoryJson
            };

            var response = await SendJsonAsync("/ai/interviews/generate-question", body,
                request.UserId, request.CorrelationId, request.RequestId, ct);

            return ParseQuestionResponse(response, request.SessionId);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("Interview service timed out. SessionId={SessionId}", request.SessionId);
            return AiInterviewQuestionResult.Unavailable("Dịch vụ AI phỏng vấn không phản hồi (timeout).");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Interview service unreachable. SessionId={SessionId}", request.SessionId);
            return AiInterviewQuestionResult.Unavailable("Dịch vụ AI phỏng vấn hiện chưa sẵn sàng.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling Interview service. SessionId={SessionId}", request.SessionId);
            return AiInterviewQuestionResult.Failure("INTERVIEW_SERVICE_UNEXPECTED",
                "Lỗi không xác định khi gọi dịch vụ phỏng vấn.");
        }
    }

    // ── AnalyzeInterview ──────────────────────────────────────────────────────
    public async Task<AiInterviewAnalysisResult> AnalyzeInterviewAsync(
        AiAnalyzeInterviewRequest request, CancellationToken ct = default)
    {
        if (!_opts.InterviewEnabled)
        {
            _logger.LogInformation(
                "Interview service disabled. Skipping analyze for SessionId={SessionId}", request.SessionId);
            return AiInterviewAnalysisResult.Unavailable("Dịch vụ AI phỏng vấn hiện chưa được bật.");
        }

        try
        {
            var body = new
            {
                sessionId      = request.SessionId.ToString(),
                userId         = request.UserId.ToString(),
                correlationId  = request.CorrelationId,
                requestId      = request.RequestId,
                position       = request.Position,
                level          = request.Level,
                goal           = request.Goal,
                interviewType  = request.InterviewType,
                aiModel        = request.AiModel,
                transcriptJson = request.TranscriptJson
            };

            var response = await SendJsonAsync("/ai/interviews/analyze", body,
                request.UserId, request.CorrelationId, request.RequestId, ct);

            return ParseAnalysisResponse(response, request.SessionId);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("Interview analysis timed out. SessionId={SessionId}", request.SessionId);
            return AiInterviewAnalysisResult.Unavailable("Dịch vụ phân tích phỏng vấn không phản hồi (timeout).");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Interview analysis unreachable. SessionId={SessionId}", request.SessionId);
            return AiInterviewAnalysisResult.Unavailable("Dịch vụ phân tích phỏng vấn hiện chưa sẵn sàng.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling interview analysis. SessionId={SessionId}", request.SessionId);
            return AiInterviewAnalysisResult.Failure("ANALYSIS_SERVICE_UNEXPECTED",
                "Lỗi không xác định khi phân tích phỏng vấn.");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private async Task<string> SendJsonAsync(
        string endpoint, object body,
        Guid userId, string correlationId, string requestId,
        CancellationToken ct)
    {
        var json    = JsonSerializer.Serialize(body);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint) { Content = content };
        httpRequest.Headers.TryAddWithoutValidation("X-User-ID",        userId.ToString());
        httpRequest.Headers.TryAddWithoutValidation("X-Correlation-ID", correlationId);
        httpRequest.Headers.TryAddWithoutValidation("X-Request-ID",     requestId);
        if (!string.IsNullOrEmpty(_opts.ApiKey))
            httpRequest.Headers.Add("X-Interviet-Api-Key", _opts.ApiKey);

        using var response = await _http.SendAsync(httpRequest, ct);
        return await response.Content.ReadAsStringAsync(ct);
    }

    private AiInterviewQuestionResult ParseQuestionResponse(string body, Guid sessionId)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var root      = doc.RootElement;
            var success   = root.TryGetProperty("success", out var sp) && sp.GetBoolean();

            if (!success)
            {
                var code = root.TryGetProperty("error", out var err) && err.TryGetProperty("code", out var c)
                    ? c.GetString() : "QUESTION_GENERATION_FAILED";
                var msg  = err.TryGetProperty("message", out var m) ? m.GetString() : "Tạo câu hỏi thất bại.";

                if (string.Equals(code, "SERVICE_UNAVAILABLE", StringComparison.OrdinalIgnoreCase))
                    return AiInterviewQuestionResult.Unavailable(msg ?? "Dịch vụ phỏng vấn hiện chưa sẵn sàng.");

                return AiInterviewQuestionResult.Failure(code ?? "QUESTION_GENERATION_FAILED", msg ?? "Tạo câu hỏi thất bại.");
            }

            var data = root.GetProperty("data");
            string? GetStr(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null ? p.GetString() : null;
            string? GetJson(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null ? p.GetRawText() : null;

            return AiInterviewQuestionResult.Success(
                questionText:             GetStr("questionText") ?? string.Empty,
                questionType:             GetStr("questionType"),
                difficulty:               GetStr("difficulty"),
                expectedAnswerPointsJson: GetJson("expectedAnswerPoints")
            );
        }
        catch (JsonException)
        {
            return AiInterviewQuestionResult.Failure("INVALID_RESPONSE",
                "Dịch vụ phỏng vấn trả về dữ liệu không hợp lệ.");
        }
    }

    private AiInterviewAnalysisResult ParseAnalysisResponse(string body, Guid sessionId)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var root      = doc.RootElement;
            var success   = root.TryGetProperty("success", out var sp) && sp.GetBoolean();

            if (!success)
            {
                var code = root.TryGetProperty("error", out var err) && err.TryGetProperty("code", out var c)
                    ? c.GetString() : "ANALYSIS_FAILED";
                var msg  = err.TryGetProperty("message", out var m) ? m.GetString() : "Phân tích thất bại.";

                if (string.Equals(code, "SERVICE_UNAVAILABLE", StringComparison.OrdinalIgnoreCase))
                    return AiInterviewAnalysisResult.Unavailable(msg ?? "Dịch vụ phân tích hiện chưa sẵn sàng.");

                return AiInterviewAnalysisResult.Failure(code ?? "ANALYSIS_FAILED", msg ?? "Phân tích thất bại.");
            }

            var data = root.GetProperty("data");
            decimal? GetDec(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind == JsonValueKind.Number ? p.GetDecimal() : null;
            string? GetStr(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null ? p.GetString() : null;
            string? GetJson(string key) =>
                data.TryGetProperty(key, out var p) && p.ValueKind != JsonValueKind.Null ? p.GetRawText() : null;

            return AiInterviewAnalysisResult.Success(
                overallScore:        GetDec("overallScore"),
                confidenceScore:     GetDec("confidenceScore"),
                clarityScore:        GetDec("clarityScore"),
                relevanceScore:      GetDec("relevanceScore"),
                strengthsJson:       GetJson("strengths"),
                weaknessesJson:      GetJson("weaknesses"),
                recommendationsJson: GetJson("recommendations"),
                scoreBreakdownsJson: GetJson("scoreBreakdowns"),
                feedbackItemsJson:   GetJson("feedbackItems"),
                modelVersion:        GetStr("modelVersion"),
                schemaVersion:       GetStr("schemaVersion")
            );
        }
        catch (JsonException)
        {
            return AiInterviewAnalysisResult.Failure("INVALID_RESPONSE",
                "Dịch vụ phân tích phỏng vấn trả về dữ liệu không hợp lệ.");
        }
    }

    // ── CreateRealtimeSession ─────────────────────────────────────────────────
    public async Task<AiRealtimeSessionResult> CreateRealtimeSessionAsync(
        AiCreateRealtimeSessionRequest request, CancellationToken ct = default)
    {
        if (!_opts.InterviewRealtimeEnabled)
        {
            _logger.LogInformation(
                "Realtime interview disabled. SessionId={SessionId}", request.SessionId);
            return AiRealtimeSessionResult.Unavailable("Dịch vụ phỏng vấn realtime hiện chưa được bật.");
        }

        var baseUrl = _opts.InterviewRealtimeBaseUrl ?? _opts.InterviewBaseUrl;
        if (string.IsNullOrWhiteSpace(baseUrl))
            return AiRealtimeSessionResult.Unavailable("Chưa cấu hình URL dịch vụ realtime.");

        try
        {
            var body = new
            {
                sessionId       = request.SessionId.ToString(),
                userId          = request.UserId.ToString(),
                correlationId   = request.CorrelationId,
                requestId       = request.RequestId,
                position        = request.Position,
                level           = request.Level,
                goal            = request.Goal,
                interviewType   = request.InterviewType,
                interviewerMode = request.InterviewerMode,
                aiModel         = request.AiModel,
                language        = request.Language,
                voice           = request.Voice,
                enableTranscript = request.EnableTranscript,
                tokenTtlSeconds = request.TokenTtlSeconds
            };

            var json    = JsonSerializer.Serialize(body);
            using var req = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/ai/interviews/realtime/session")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            req.Headers.TryAddWithoutValidation("X-Interviet-Api-Key", _opts.ApiKey);
            req.Headers.TryAddWithoutValidation("X-User-ID", request.UserId.ToString());
            req.Headers.TryAddWithoutValidation("X-Correlation-ID", request.CorrelationId);
            req.Headers.TryAddWithoutValidation("X-Request-ID", request.RequestId);

            using var resp = await _http.SendAsync(req, ct);
            var raw        = await resp.Content.ReadAsStringAsync(ct);

            using var doc  = JsonDocument.Parse(raw);
            var root       = doc.RootElement;

            var success = root.TryGetProperty("success", out var sv) && sv.GetBoolean();
            if (!success)
            {
                string? errCode = root.TryGetProperty("error", out var errEl) &&
                                  errEl.TryGetProperty("code", out var cProp)
                                  ? cProp.GetString() : null;
                string? errMsg  = root.TryGetProperty("error", out var errEl2) &&
                                  errEl2.TryGetProperty("message", out var mProp)
                                  ? mProp.GetString() : "Không thể tạo phiên realtime.";

                return MapPythonError(errCode, errMsg);
            }

            if (!root.TryGetProperty("data", out var data))
                return AiRealtimeSessionResult.Failure("INVALID_RESPONSE",
                    "Dịch vụ realtime trả về dữ liệu không hợp lệ.");

            DateTime? expiresAt = null;
            if (data.TryGetProperty("expiresAt", out var exp) && exp.ValueKind != JsonValueKind.Null)
                expiresAt = exp.GetDateTime();

            // ⚠️ clientSecret is returned to caller but NEVER logged here
            return AiRealtimeSessionResult.Success(
                providerSessionId: data.TryGetProperty("providerSessionId", out var pSid)  ? pSid.GetString()  : null,
                connectUrl:        data.TryGetProperty("connectUrl",        out var cu)    ? cu.GetString()    : null,
                clientSecret:      data.TryGetProperty("clientSecret",      out var cs)    ? cs.GetString()    : null,
                expiresAt:         expiresAt,
                provider:          data.TryGetProperty("provider",          out var prov)  ? prov.GetString()  : null,
                model:             data.TryGetProperty("model",             out var mdl)   ? mdl.GetString()   : null,
                instructions:      data.TryGetProperty("instructions",      out var instr) ? instr.GetString() : null
            );
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("Realtime session creation timed out for SessionId={SessionId}", request.SessionId);
            return AiRealtimeSessionResult.Unavailable("Dịch vụ realtime không phản hồi (timeout).");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Realtime session HTTP error for SessionId={SessionId}", request.SessionId);
            return AiRealtimeSessionResult.Unavailable("Không thể kết nối tới dịch vụ realtime.");
        }
        catch (JsonException)
        {
            return AiRealtimeSessionResult.Failure("INVALID_RESPONSE",
                "Dịch vụ realtime trả về dữ liệu không hợp lệ.");
        }
    }

    private static AiRealtimeSessionResult MapPythonError(string? code, string? message) =>
        code switch
        {
            "SERVICE_UNAVAILABLE"  => AiRealtimeSessionResult.Unavailable(message ?? "Dịch vụ chưa sẵn sàng."),
            "RATE_LIMIT_EXCEEDED"  => AiRealtimeSessionResult.Failure(code, message ?? "Rate limit."),
            "VALIDATION_ERROR"     => AiRealtimeSessionResult.Failure(code, message ?? "Validation error."),
            "MODEL_UNAVAILABLE"    => AiRealtimeSessionResult.Failure(code, message ?? "Model không khả dụng."),
            _                      => AiRealtimeSessionResult.Failure(code ?? "REALTIME_FAILED", message ?? "Lỗi tạo phiên realtime.")
        };
}

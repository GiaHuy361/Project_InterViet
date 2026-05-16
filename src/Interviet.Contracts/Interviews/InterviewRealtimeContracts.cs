namespace Interviet.Contracts.Interviews;

// ── Realtime Requests ─────────────────────────────────────────────────────────
public sealed record StartInterviewRealtimeRequest
{
    /// <summary>voice | hybrid. Required.</summary>
    public string Mode { get; init; } = "voice";

    /// <summary>AI model: gpt-4o-mini | gpt-4o | etc.</summary>
    public string AiModel { get; init; } = "gpt-4o-mini";

    /// <summary>TTS voice identifier (optional, depends on provider).</summary>
    public string? Voice { get; init; }

    /// <summary>Transcript language, default "vi".</summary>
    public string Language { get; init; } = "vi";

    /// <summary>Enable server-side transcript (recommended). Default true.</summary>
    public bool EnableTranscript { get; init; } = true;
}

public sealed record EndInterviewRealtimeRequest
{
    public Guid RealtimeSessionId { get; init; }
    /// <summary>user_ended | timeout | error | system</summary>
    public string? Reason { get; init; }
}

// ── Realtime Responses ────────────────────────────────────────────────────────
public sealed record StartInterviewRealtimeResponse
{
    public Guid SessionId { get; init; }
    public Guid RealtimeSessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Provider { get; init; }
    public string? Model { get; init; }
    public string? ProviderSessionId { get; init; }

    /// <summary>
    /// WebSocket/HTTPS URL to connect to the provider directly.
    /// Null when Python brokers the connection (Python-brokered mode).
    /// </summary>
    public string? ConnectUrl { get; init; }

    /// <summary>
    /// Ephemeral access token / client secret.
    /// Frontend uses this ONCE to authenticate with the provider.
    /// This value is NOT stored server-side in plaintext.
    /// Null when InterviewRealtimeEnabled=false.
    /// </summary>
    public string? ClientSecret { get; init; }

    /// <summary>System instructions / prompt sent to the AI model. Frontend may display for context.</summary>
    public string? Instructions { get; init; }

    public DateTime? ExpiresAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public bool IsIdempotent { get; init; }
}

public sealed record EndInterviewRealtimeResponse
{
    public Guid SessionId { get; init; }
    public Guid RealtimeSessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime? EndedAt { get; init; }
    public string? Message { get; init; }
}

public sealed record InterviewRealtimeSessionResponse
{
    public Guid RealtimeSessionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Provider { get; init; }
    public string? Model { get; init; }
    public string? ConnectUrl { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? EndedAt { get; init; }
    public string? ErrorCode { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record InterviewRealtimeEventResponse
{
    public Guid EventId { get; init; }
    public int SequenceNumber { get; init; }
    public string EventType { get; init; } = string.Empty;
    public string? Role { get; init; }
    public string? Text { get; init; }
    public string? ProviderEventId { get; init; }
    public DateTime OccurredAt { get; init; }
}

public sealed record GetInterviewRealtimeResponse
{
    public Guid SessionId { get; init; }
    public InterviewRealtimeSessionResponse? ActiveRealtimeSession { get; init; }
    public List<InterviewRealtimeEventResponse> Events { get; init; } = [];
    public int TotalEvents { get; init; }
}

// ── Internal Callback Requests ────────────────────────────────────────────────
public sealed record InternalRealtimeEventItem
{
    public int SequenceNumber { get; init; }
    public string EventType { get; init; } = string.Empty;
    public string? Role { get; init; }
    public string? Text { get; init; }
    public string? ProviderEventId { get; init; }
    public DateTime OccurredAt { get; init; }
    public object? Metadata { get; init; }
}

public sealed record InternalRealtimeEventsRequest
{
    public Guid SessionId { get; init; }
    public Guid RealtimeSessionId { get; init; }
    public List<InternalRealtimeEventItem> Events { get; init; } = [];
}

public sealed record InternalRealtimeQaPair
{
    public int QuestionNumber { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string? AnswerText { get; init; }
    public string? QuestionType { get; init; }
    public string? Difficulty { get; init; }
}

public sealed record InternalRealtimeFinalizeRequest
{
    public Guid SessionId { get; init; }
    public Guid RealtimeSessionId { get; init; }
    public string? TranscriptText { get; init; }
    public List<InternalRealtimeQaPair> QaPairs { get; init; } = [];
    public string? ModelVersion { get; init; }
    public string? SchemaVersion { get; init; }
}

public sealed record InternalCallbackResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public int ProcessedCount { get; init; }
}

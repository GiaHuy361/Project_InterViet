using FluentValidation;
using MediatR;
using Interviet.Application.Common.Interfaces;
using Interviet.Contracts.Matching;
using Interviet.Domain.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.JobDescriptions.Commands.CreateJobDescription;

public sealed record CreateJobDescriptionCommand(
    Guid UserId,
    string? Title,
    string? CompanyName,
    string? Location,
    string? SalaryText,
    string? SourceUrl,
    string RawText,
    DateOnly? PostedAt
) : IRequest<Result<JobDescriptionResponse>>;

public sealed class CreateJobDescriptionCommandValidator : AbstractValidator<CreateJobDescriptionCommand>
{
    public CreateJobDescriptionCommandValidator()
    {
        RuleFor(x => x.RawText)
            .NotEmpty().WithMessage("Nội dung mô tả công việc không được để trống.")
            .MaximumLength(50_000).WithMessage("Nội dung mô tả công việc không được vượt quá 50.000 ký tự.");

        RuleFor(x => x.Title)
            .MaximumLength(250).WithMessage("Tiêu đề không được vượt quá 250 ký tự.")
            .When(x => x.Title is not null);

        RuleFor(x => x.CompanyName)
            .MaximumLength(250).When(x => x.CompanyName is not null);

        RuleFor(x => x.Location)
            .MaximumLength(200).When(x => x.Location is not null);

        RuleFor(x => x.SourceUrl)
            .MaximumLength(500).When(x => x.SourceUrl is not null);
    }
}

public sealed class CreateJobDescriptionCommandHandler
    : IRequestHandler<CreateJobDescriptionCommand, Result<JobDescriptionResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;
    private readonly IActivityLogger _activityLogger;
    private readonly IUsageTracker _usageTracker;
    private readonly ILogger<CreateJobDescriptionCommandHandler> _logger;

    public CreateJobDescriptionCommandHandler(
        IAppDbContext db,
        IDateTimeProvider dt,
        IActivityLogger activityLogger,
        IUsageTracker usageTracker,
        ILogger<CreateJobDescriptionCommandHandler> logger)
    {
        _db             = db;
        _dt             = dt;
        _activityLogger = activityLogger;
        _usageTracker   = usageTracker;
        _logger         = logger;
    }

    public async Task<Result<JobDescriptionResponse>> Handle(
        CreateJobDescriptionCommand request, CancellationToken ct)
    {
        var now = _dt.UtcNow;
        var jd = new JobDescription
        {
            Id          = Guid.NewGuid(),
            UserId      = request.UserId,
            Title       = request.Title?.Trim(),
            CompanyName = request.CompanyName?.Trim(),
            Location    = request.Location?.Trim(),
            SalaryText  = request.SalaryText?.Trim(),
            SourceUrl   = request.SourceUrl?.Trim(),
            RawText     = request.RawText.Trim(),
            PostedAt    = request.PostedAt,
            CreatedAt   = now,
            UpdatedAt   = now
        };

        _db.JobDescriptions.Add(jd);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("JobDescription created. Id={Id} UserId={UserId}", jd.Id, jd.UserId);

        // Activity + Usage — non-critical
        try
        {
            await _activityLogger.LogAsync(request.UserId, ActivityActionKeys.JobDescriptionCreated,
                entityType: "JobDescription", entityId: jd.Id,
                description: $"JD '{jd.Title ?? "(không tiêu đề)"}' đã được tạo.");
            await _usageTracker.TrackAsync(request.UserId, QuotaFeatureKeys.JdCreate,
                referenceType: "JobDescription", referenceId: jd.Id);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "activity/usage log failed: job_description_created"); }

        return Result<JobDescriptionResponse>.Success(MapToResponse(jd));
    }

    internal static JobDescriptionResponse MapToResponse(JobDescription jd) => new()
    {
        Id          = jd.Id,
        UserId      = jd.UserId,
        Title       = jd.Title,
        CompanyName = jd.CompanyName,
        Location    = jd.Location,
        SalaryText  = jd.SalaryText,
        SourceUrl   = jd.SourceUrl,
        RawText     = jd.RawText,
        PostedAt    = jd.PostedAt,
        CreatedAt   = jd.CreatedAt,
        UpdatedAt   = jd.UpdatedAt
    };
}

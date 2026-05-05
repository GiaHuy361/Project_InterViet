using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Interviet.Application.Common.Interfaces;
using Interviet.Application.JobDescriptions.Commands.CreateJobDescription;
using Interviet.Contracts.Matching;
using Interviet.Shared.Results;

namespace Interviet.Application.JobDescriptions.Commands.UpdateJobDescription;

public sealed record UpdateJobDescriptionCommand(
    Guid JobDescriptionId,
    Guid UserId,
    string? Title,
    string? CompanyName,
    string? Location,
    string? SalaryText,
    string? SourceUrl,
    string? RawText,
    DateOnly? PostedAt
) : IRequest<Result<JobDescriptionResponse>>;

public sealed class UpdateJobDescriptionCommandValidator : AbstractValidator<UpdateJobDescriptionCommand>
{
    public UpdateJobDescriptionCommandValidator()
    {
        RuleFor(x => x.RawText)
            .MaximumLength(50_000).WithMessage("Nội dung mô tả công việc không được vượt quá 50.000 ký tự.")
            .When(x => x.RawText is not null);

        RuleFor(x => x.Title)
            .MaximumLength(250).When(x => x.Title is not null);
    }
}

public sealed class UpdateJobDescriptionCommandHandler
    : IRequestHandler<UpdateJobDescriptionCommand, Result<JobDescriptionResponse>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dt;

    public UpdateJobDescriptionCommandHandler(IAppDbContext db, IDateTimeProvider dt)
    {
        _db = db;
        _dt = dt;
    }

    public async Task<Result<JobDescriptionResponse>> Handle(
        UpdateJobDescriptionCommand request, CancellationToken ct)
    {
        var jd = await _db.JobDescriptions
            .FirstOrDefaultAsync(j => j.Id == request.JobDescriptionId && !j.IsDeleted, ct);

        if (jd is null)
            return Error.NotFound("JobDescription.NotFound", "Không tìm thấy mô tả công việc.");

        if (jd.UserId != request.UserId)
            return Error.Forbidden("JobDescription.Forbidden", "Bạn không có quyền chỉnh sửa mô tả công việc này.");

        if (request.Title is not null)       jd.Title       = request.Title.Trim();
        if (request.CompanyName is not null) jd.CompanyName = request.CompanyName.Trim();
        if (request.Location is not null)    jd.Location    = request.Location.Trim();
        if (request.SalaryText is not null)  jd.SalaryText  = request.SalaryText.Trim();
        if (request.SourceUrl is not null)   jd.SourceUrl   = request.SourceUrl.Trim();
        if (request.RawText is not null)     jd.RawText     = request.RawText.Trim();
        if (request.PostedAt is not null)    jd.PostedAt    = request.PostedAt;

        jd.UpdatedAt = _dt.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Result<JobDescriptionResponse>.Success(CreateJobDescriptionCommandHandler.MapToResponse(jd));
    }
}

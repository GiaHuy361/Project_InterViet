using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Interviet.Contracts.Reports;
using Interviet.Domain.Reports;
using Interviet.Shared.Results;

namespace Interviet.Application.Common.Interfaces;

public interface IReportShareService
{
    Task<Result<CreateShareLinkResponse>> CreateInterviewShareAsync(
        Guid userId,
        Guid interviewSessionId,
        CreateShareLinkRequest request,
        CancellationToken ct = default);

    Task<Result<CreateShareLinkResponse>> CreateMatchShareAsync(
        Guid userId,
        Guid matchSessionId,
        CreateShareLinkRequest request,
        CancellationToken ct = default);

    Task<Result<List<ShareLinkListItemResponse>>> GetInterviewSharesAsync(
        Guid userId,
        Guid interviewSessionId,
        CancellationToken ct = default);

    Task<Result<List<ShareLinkListItemResponse>>> GetMatchSharesAsync(
        Guid userId,
        Guid matchSessionId,
        CancellationToken ct = default);

    Task<Result<RevokeShareLinkResponse>> RevokeShareAsync(
        Guid userId,
        Guid shareId,
        CancellationToken ct = default);

    Task<Result<SharedInterviewReportResponse>> GetSharedInterviewReportAsync(
        string token,
        CancellationToken ct = default);

    Task<Result<SharedMatchReportResponse>> GetSharedMatchReportAsync(
        string token,
        CancellationToken ct = default);

    Task<Result<ReportShareLink>> ValidateTokenForPdfAsync(
        string token,
        CancellationToken ct = default);
}

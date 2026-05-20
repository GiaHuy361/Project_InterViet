using System;
using System.Threading;
using System.Threading.Tasks;
using Interviet.Shared.Results;

namespace Interviet.Application.Common.Interfaces;

public interface IReportPdfService
{
    Task<Result<byte[]>> GenerateInterviewReportPdfAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken ct = default);

    Task<Result<byte[]>> GenerateMatchReportPdfAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken ct = default);

    Task<Result<byte[]>> GenerateInterviewReportPdfFromShareAsync(
        string token,
        CancellationToken ct = default);

    Task<Result<byte[]>> GenerateMatchReportPdfFromShareAsync(
        string token,
        CancellationToken ct = default);
}

namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Object storage abstraction — backed by local filesystem, S3, MinIO, or Azure Blob.
/// Phase 0: implemented as LocalFileSystemStorageService.
/// </summary>
public interface IStorageService
{
    Task<string> UploadAsync(Stream stream, string key, string contentType, CancellationToken ct = default);
    Task<string> GetSignedDownloadUrlAsync(string key, TimeSpan expiry, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
    Task<bool> ExistsAsync(string key, CancellationToken ct = default);
}

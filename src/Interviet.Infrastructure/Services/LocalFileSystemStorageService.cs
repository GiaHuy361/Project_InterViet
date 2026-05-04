using Interviet.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// Local filesystem storage stub. Stores files in wwwroot/uploads/.
/// Replace with S3/MinIO/Azure Blob adapter in later phases.
/// </summary>
public sealed class LocalFileSystemStorageService : IStorageService
{
    private readonly string _basePath;
    private readonly ILogger<LocalFileSystemStorageService> _logger;

    public LocalFileSystemStorageService(
        ILogger<LocalFileSystemStorageService> logger,
        string? basePath = null)
    {
        _logger = logger;
        _basePath = basePath ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> UploadAsync(Stream stream, string key, string contentType, CancellationToken ct = default)
    {
        var filePath = GetFilePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);
        await using var fs = File.Create(filePath);
        await stream.CopyToAsync(fs, ct);
        _logger.LogInformation("[STORAGE STUB] Uploaded file Key={Key}", key);
        return key;
    }

    public Task<string> GetSignedDownloadUrlAsync(string key, TimeSpan expiry, CancellationToken ct = default)
    {
        // In production: generate pre-signed URL. Stub returns local path.
        var url = $"/uploads/{key.Replace('\\', '/')}";
        return Task.FromResult(url);
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        var filePath = GetFilePath(key);
        if (File.Exists(filePath)) File.Delete(filePath);
        _logger.LogInformation("[STORAGE STUB] Deleted file Key={Key}", key);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string key, CancellationToken ct = default) =>
        Task.FromResult(File.Exists(GetFilePath(key)));

    private string GetFilePath(string key) => Path.Combine(_basePath, key);
}

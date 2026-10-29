namespace Winston.Core;

public interface IStorageService
{
    Task<string> UploadFileAsync(
        Stream fileStream,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<StoredFile?> DownloadFileAsync(
        string blobName,
        CancellationToken cancellationToken = default);

    Task DeleteFileIfExistsAsync(
        string blobName,
        CancellationToken cancellationToken = default);
}

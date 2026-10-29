using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Winston.Core;

namespace Winston.API.Services;

public class AzureBlobStorageService : IStorageService
{
    private readonly BlobContainerClient _containerClient;

    public AzureBlobStorageService(IConfiguration config)
    {
        var connectionString = config["ReceiptStorage:ConnectionString"]
            ?? throw new InvalidOperationException("Azure Blob Storage connection string is not configured");
        var blobContainerName = config["ReceiptStorage:ContainerName"]
            ?? throw new InvalidOperationException("Azure Blob Storage container name is not configured");
        _containerClient = new BlobContainerClient(connectionString, blobContainerName);
    }

    public async Task<string> UploadFileAsync(
        Stream fileStream,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var extension = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => throw new ArgumentException("Unsupported receipt content type", nameof(contentType))
        };
        var blobName = $"{Guid.NewGuid():N}{extension}";
        var blobClient = _containerClient.GetBlobClient(blobName);
        await blobClient.UploadAsync(
            fileStream,
            new BlobHttpHeaders { ContentType = contentType },
            cancellationToken: cancellationToken);
        return blobName;
    }

    public async Task<StoredFile?> DownloadFileAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

        try
        {
            var download = await blobClient.DownloadStreamingAsync(
                cancellationToken: cancellationToken);
            return new StoredFile(
                download.Value.Content,
                download.Value.Details.ContentType ?? "application/octet-stream");
        }
        catch (RequestFailedException exception) when (exception.Status == StatusCodes.Status404NotFound)
        {
            return null;
        }
    }

    public async Task DeleteFileIfExistsAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);
        await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
    }
}

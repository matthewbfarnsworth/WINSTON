using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Winston.Core;

namespace Winston.API.Services;

public class AzureBlobStorageService : IStorageService
{
    private readonly BlobContainerClient _containerClient;

    public AzureBlobStorageService(IConfiguration config)
    {
        var connectionString = config["AzureBlobStorage:ConnectionString"]
            ?? throw new InvalidOperationException("Azure Blob Storage connection string is not configured");
        var blobContainerName = config["AzureBlobStorage:ContainerName"]
            ?? throw new InvalidOperationException("Azure Blob Storage container name is not configured");
        _containerClient = new BlobContainerClient(connectionString, blobContainerName);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName)
    {
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var blobClient = _containerClient.GetBlobClient(uniqueFileName);
        await blobClient.UploadAsync(fileStream, new BlobHttpHeaders { ContentType = "image/jpeg" } );
        return blobClient.Uri.ToString();
    }
}

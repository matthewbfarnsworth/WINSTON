using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Winston.Core;

namespace Winston.API.Services;

public class AzureBlobStorageService : IStorageService
{
    private readonly BlobContainerClient _containerClient;

    public AzureBlobStorageService(IConfiguration config)
    {
        var connectionString = config["AzureBlobStorage:ConnectionString"];
        var blobContainerName = "receipts";
        _containerClient = new BlobContainerClient(connectionString, blobContainerName);
        _containerClient.CreateIfNotExists(PublicAccessType.Blob);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName)
    {
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var blobClient = _containerClient.GetBlobClient(uniqueFileName);
        await blobClient.UploadAsync(fileStream, new BlobHttpHeaders { ContentType = "image/jpeg" } );
        return blobClient.Uri.ToString();
    }
}
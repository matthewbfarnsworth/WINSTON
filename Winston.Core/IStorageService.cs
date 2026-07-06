namespace Winston.Core;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName);
}
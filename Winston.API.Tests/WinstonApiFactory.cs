using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Winston.API.Authorization;
using Winston.API.Data;
using Winston.Core;

namespace Winston.API.Tests;

public sealed class WinstonApiFactory : WebApplicationFactory<Program>
{
    public static readonly Guid AliceId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid BobId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid CarolId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid UnallowedId = Guid.Parse("99999999-9999-9999-9999-999999999999");

    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    public FakeStorageService Storage { get; } = new();

    public WinstonApiFactory()
    {
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<WinstonDbContext>>();
            services.RemoveAll<WinstonDbContext>();
            services.AddDbContext<WinstonDbContext>(options => options.UseSqlite(_connection));

            services.RemoveAll<IStorageService>();
            services.AddSingleton<IStorageService>(Storage);

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName,
                    _ => { });

            services.PostConfigure<AccessControlOptions>(options =>
            {
                options.AccessRequestEmail = "owner@example.com";
                options.AllowedUserObjectIds = [AliceId, BobId, CarolId];
            });
        });
    }

    public HttpClient CreateAuthenticatedClient(Guid userId, string name = "Test User")
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserNameHeader, name);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return client;
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<WinstonDbContext>();
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
        Storage.Clear();
    }

    public async Task SeedAsync(params object[] entities)
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<WinstonDbContext>();
        context.AddRange(entities);
        await context.SaveChangesAsync();
    }

    public async Task<TResult> QueryAsync<TResult>(Func<WinstonDbContext, Task<TResult>> query)
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<WinstonDbContext>();
        return await query(context);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}

public sealed class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Test";
    public const string UserIdHeader = "X-Test-User-Id";
    public const string UserNameHeader = "X-Test-User-Name";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(UserIdHeader, out var userIdValue)
            || !Guid.TryParse(userIdValue, out var userId))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var name = Request.Headers.TryGetValue(UserNameHeader, out var userNameValue)
            ? userNameValue.ToString()
            : "Test User";
        var claims = new[]
        {
            new Claim("oid", userId.ToString()),
            new Claim("name", name),
            new Claim("scp", "access_as_user")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

public sealed class FakeStorageService : IStorageService
{
    private readonly ConcurrentDictionary<string, (byte[] Content, string ContentType)> _files = new();

    public IReadOnlyCollection<string> BlobNames => _files.Keys.ToArray();

    public async Task<string> UploadFileAsync(
        Stream fileStream,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        await using var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer, cancellationToken);
        var extension = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".bin"
        };
        var blobName = $"{Guid.NewGuid():N}{extension}";
        _files[blobName] = (buffer.ToArray(), contentType);
        return blobName;
    }

    public Task<StoredFile?> DownloadFileAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        if (!_files.TryGetValue(blobName, out var file))
        {
            return Task.FromResult<StoredFile?>(null);
        }

        return Task.FromResult<StoredFile?>(
            new StoredFile(new MemoryStream(file.Content), file.ContentType));
    }

    public Task DeleteFileIfExistsAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        _files.TryRemove(blobName, out _);
        return Task.CompletedTask;
    }

    public void Add(string blobName, byte[] content, string contentType)
    {
        _files[blobName] = (content, contentType);
    }

    public void Clear()
    {
        _files.Clear();
    }
}

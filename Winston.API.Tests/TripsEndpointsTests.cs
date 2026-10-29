using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Winston.Core;

namespace Winston.API.Tests;

public class TripsEndpointsTests(WinstonApiFactory factory)
    : IClassFixture<WinstonApiFactory>, IAsyncLifetime
{
    public async Task InitializeAsync()
    {
        await factory.ResetDatabaseAsync();
        await factory.SeedAsync(
            CreateUser(WinstonApiFactory.AliceId, "Alice"),
            CreateUser(WinstonApiFactory.BobId, "Bob"),
            CreateUser(WinstonApiFactory.CarolId, "Carol"));
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CreateTrip_OverridesOwnerAndAddsCurrentUser()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        var request = CreateTripRequest(
            total: 80M,
            ownerId: WinstonApiFactory.CarolId,
            users: [(WinstonApiFactory.BobId, 0M)]);

        var response = await client.PostAsJsonAsync("/api/trips", request);
        var created = await response.Content.ReadFromJsonAsync<Trip>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(created);
        Assert.Equal(WinstonApiFactory.AliceId, created.OwnerId);
        Assert.Contains(created.TripUsers, user => user.UserId == WinstonApiFactory.AliceId);
        Assert.Contains(created.TripUsers, user => user.UserId == WinstonApiFactory.BobId);
    }

    [Theory]
    [InlineData("", 10)]
    [InlineData("Dinner", 0)]
    [InlineData("Dinner", -1)]
    public async Task CreateTrip_RejectsInvalidNameOrTotal(string name, int total)
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        var request = CreateTripRequest((decimal)total, name: name);

        var response = await client.PostAsJsonAsync("/api/trips", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTrip_RejectsPersonalCostsAboveTotal()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        var request = CreateTripRequest(
            total: 20M,
            users:
            [
                (WinstonApiFactory.AliceId, 15M),
                (WinstonApiFactory.BobId, 10M)
            ]);

        var response = await client.PostAsJsonAsync("/api/trips", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTrip_RejectsDuplicateUsers()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        var request = CreateTripRequest(
            users:
            [
                (WinstonApiFactory.AliceId, 0M),
                (WinstonApiFactory.AliceId, 0M)
            ]);

        var response = await client.PostAsJsonAsync("/api/trips", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetTrips_OrdersNewestFirstAndCalculatesSplits()
    {
        var olderTrip = CreateStoredTrip(
            new DateOnly(2026, 1, 1),
            10M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        var newerTrip = CreateStoredTrip(
            new DateOnly(2026, 2, 1),
            30M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        await factory.SeedAsync(olderTrip, newerTrip);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);

        var trips = await client.GetFromJsonAsync<List<Trip>>("/api/trips");

        Assert.NotNull(trips);
        Assert.Equal([newerTrip.Id, olderTrip.Id], trips.Select(trip => trip.Id));
        Assert.All(trips, trip =>
            Assert.All(trip.TripUsers, user => Assert.Equal(trip.Total / 2, user.Split)));
    }

    [Fact]
    public async Task UpdateTrip_ReturnsForbidden_ForUserWhoIsNotOwner()
    {
        var trip = CreateStoredTrip(
            new DateOnly(2026, 1, 1),
            50M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        await factory.SeedAsync(trip);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.BobId);
        trip.Name = "Changed";

        var response = await client.PutAsJsonAsync($"/api/trips/{trip.Id}", trip);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTrip_RejectsRemovingOwner()
    {
        var trip = CreateStoredTrip(
            new DateOnly(2026, 1, 1),
            50M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        await factory.SeedAsync(trip);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        trip.TripUsers =
        [
            new TripUser { TripId = trip.Id, UserId = WinstonApiFactory.BobId }
        ];

        var response = await client.PutAsJsonAsync($"/api/trips/{trip.Id}", trip);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTrip_ReplacesEditableValuesAndUsers()
    {
        var trip = CreateStoredTrip(
            new DateOnly(2026, 1, 1),
            50M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        await factory.SeedAsync(trip);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        trip.Name = "Updated trip";
        trip.Total = 75M;
        trip.TripUsers =
        [
            new TripUser { TripId = trip.Id, UserId = WinstonApiFactory.AliceId },
            new TripUser { TripId = trip.Id, UserId = WinstonApiFactory.CarolId, PersonalCost = 5M }
        ];

        var response = await client.PutAsJsonAsync($"/api/trips/{trip.Id}", trip);
        var updated = await response.Content.ReadFromJsonAsync<Trip>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(updated);
        Assert.Equal("Updated trip", updated.Name);
        Assert.Equal(75M, updated.Total);
        Assert.Contains(updated.TripUsers, user => user.UserId == WinstonApiFactory.CarolId);
        Assert.DoesNotContain(updated.TripUsers, user => user.UserId == WinstonApiFactory.BobId);
    }

    [Fact]
    public async Task DeleteTrip_ReturnsForbidden_ForUserWhoIsNotOwner()
    {
        var trip = CreateStoredTrip(
            new DateOnly(2026, 1, 1),
            50M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        await factory.SeedAsync(trip);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.BobId);

        var response = await client.DeleteAsync($"/api/trips/{trip.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(1, await factory.QueryAsync(context => context.Trips.CountAsync()));
    }

    [Fact]
    public async Task DeleteTrip_RemovesDatabaseRecordAndReceipt()
    {
        var trip = CreateStoredTrip(
            new DateOnly(2026, 1, 1),
            50M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        trip.ReceiptImageUrl = "receipt.png";
        factory.Storage.Add("receipt.png", [1, 2, 3], "image/png");
        await factory.SeedAsync(trip);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);

        var response = await client.DeleteAsync($"/api/trips/{trip.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(0, await factory.QueryAsync(context => context.Trips.CountAsync()));
        Assert.Empty(factory.Storage.BlobNames);
    }

    [Fact]
    public async Task UploadReceipt_StoresSupportedImage()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        using var content = CreateUpload([1, 2, 3, 4], "image/png", "receipt.png");

        var response = await client.PostAsync("/api/trips/upload", content);
        var result = await response.Content.ReadFromJsonAsync<UploadResponse>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(result);
        Assert.EndsWith(".png", result.BlobName);
        Assert.Contains(result.BlobName, factory.Storage.BlobNames);
    }

    [Fact]
    public async Task UploadReceipt_RejectsUnsupportedContentType()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        using var content = CreateUpload([1, 2, 3], "text/plain", "receipt.txt");

        var response = await client.PostAsync("/api/trips/upload", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(factory.Storage.BlobNames);
    }

    [Fact]
    public async Task UploadReceipt_RejectsFileAboveFiveMegabytes()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        using var content = CreateUpload(new byte[(5 * 1024 * 1024) + 1], "image/jpeg", "large.jpg");

        var response = await client.PostAsync("/api/trips/upload", content);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(factory.Storage.BlobNames);
    }

    [Fact]
    public async Task GetReceipt_ReturnsStoredPrivateImageToAllowedUser()
    {
        var trip = CreateStoredTrip(
            new DateOnly(2026, 1, 1),
            50M,
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId);
        trip.ReceiptImageUrl = "receipt.webp";
        factory.Storage.Add("receipt.webp", [4, 5, 6], "image/webp");
        await factory.SeedAsync(trip);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.BobId);

        var response = await client.GetAsync($"/api/trips/{trip.Id}/receipt");

        response.EnsureSuccessStatusCode();
        Assert.Equal("image/webp", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal([4, 5, 6], await response.Content.ReadAsByteArrayAsync());
    }

    private static MultipartFormDataContent CreateUpload(
        byte[] bytes,
        string contentType,
        string fileName)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        var content = new MultipartFormDataContent();
        content.Add(file, "file", fileName);
        return content;
    }

    private static User CreateUser(Guid id, string name) => new() { Id = id, Name = name };

    private static Trip CreateTripRequest(
        decimal total = 50M,
        Guid? ownerId = null,
        string name = "Dinner",
        (Guid UserId, decimal PersonalCost)[]? users = null)
    {
        var tripId = Guid.NewGuid();
        users ??= [(WinstonApiFactory.AliceId, 0M), (WinstonApiFactory.BobId, 0M)];
        return new Trip
        {
            Id = tripId,
            OwnerId = ownerId ?? WinstonApiFactory.AliceId,
            Name = name,
            Date = new DateOnly(2026, 1, 1),
            Total = total,
            TripUsers = users.Select(user => new TripUser
            {
                TripId = tripId,
                UserId = user.UserId,
                PersonalCost = user.PersonalCost
            }).ToList()
        };
    }

    private static Trip CreateStoredTrip(
        DateOnly date,
        decimal total,
        Guid ownerId,
        params Guid[] userIds)
    {
        var tripId = Guid.NewGuid();
        return new Trip
        {
            Id = tripId,
            OwnerId = ownerId,
            Name = $"Trip {date:yyyy-MM-dd}",
            Date = date,
            Total = total,
            TripUsers = userIds.Prepend(ownerId).Distinct().Select(userId => new TripUser
            {
                TripId = tripId,
                UserId = userId
            }).ToList()
        };
    }

    private sealed record UploadResponse(string BlobName);
}

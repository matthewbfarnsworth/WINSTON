using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Winston.Core;

namespace Winston.API.Tests;

public class UsersEndpointsTests(WinstonApiFactory factory)
    : IClassFixture<WinstonApiFactory>, IAsyncLifetime
{
    public Task InitializeAsync() => factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task GetUsers_ReturnsUnauthorized_WithoutAuthentication()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetUsers_ReturnsForbidden_ForAuthenticatedUserOutsideAllowList()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.UnallowedId);

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetCurrentUser_ProvisionsUserFromTokenClaims()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId, "Alice Example");

        var response = await client.GetAsync("/api/users/me");
        var user = await response.Content.ReadFromJsonAsync<User>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(user);
        Assert.Equal(WinstonApiFactory.AliceId, user.Id);
        Assert.Equal("Alice Example", user.Name);
        Assert.Equal(1, await factory.QueryAsync(context => context.Users.CountAsync()));
    }

    [Fact]
    public async Task GetCurrentUser_DoesNotCreateDuplicateUser()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId, "Alice Example");

        await client.GetAsync("/api/users/me");
        await client.GetAsync("/api/users/me");

        Assert.Equal(1, await factory.QueryAsync(context => context.Users.CountAsync()));
    }

    [Fact]
    public async Task GetCurrentUser_PreservesExistingDisplayName()
    {
        await factory.SeedAsync(new User
        {
            Id = WinstonApiFactory.AliceId,
            Name = "Saved Name"
        });
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId, "Token Name");

        var user = await client.GetFromJsonAsync<User>("/api/users/me");

        Assert.NotNull(user);
        Assert.Equal("Saved Name", user.Name);
    }

    [Fact]
    public async Task GetUsers_ReturnsEveryProvisionedUser()
    {
        await factory.SeedAsync(
            CreateUser(WinstonApiFactory.AliceId, "Alice"),
            CreateUser(WinstonApiFactory.BobId, "Bob"));
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);

        var users = await client.GetFromJsonAsync<List<User>>("/api/users");

        Assert.NotNull(users);
        Assert.Equal(2, users.Count);
        Assert.Contains(users, user => user.Id == WinstonApiFactory.AliceId);
        Assert.Contains(users, user => user.Id == WinstonApiFactory.BobId);
    }

    [Fact]
    public async Task GetBalances_ReturnsCalculatedTripAndPaymentBalance()
    {
        var alice = CreateUser(WinstonApiFactory.AliceId, "Alice");
        var bob = CreateUser(WinstonApiFactory.BobId, "Bob");
        var tripId = Guid.NewGuid();
        var trip = new Trip
        {
            Id = tripId,
            OwnerId = alice.Id,
            Owner = alice,
            Name = "Dinner",
            Total = 100M,
            TripUsers =
            [
                new TripUser { TripId = tripId, UserId = alice.Id, User = alice },
                new TripUser { TripId = tripId, UserId = bob.Id, User = bob }
            ]
        };
        var payment = new Transaction
        {
            Id = Guid.NewGuid(),
            SenderId = bob.Id,
            RecipientId = alice.Id,
            Cost = 20M,
            Date = new DateOnly(2026, 1, 1)
        };
        await factory.SeedAsync(alice, bob, trip, payment);
        using var client = factory.CreateAuthenticatedClient(alice.Id);

        var balances = await client.GetFromJsonAsync<Dictionary<Guid, decimal>>("/api/users/balances");

        Assert.NotNull(balances);
        Assert.Equal(30M, balances[bob.Id]);
    }

    [Fact]
    public async Task GetAccessRequestInfo_AllowsAuthenticatedUserOutsideAllowList()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.UnallowedId);

        var response = await client.GetAsync("/api/access-request");
        var info = await response.Content.ReadFromJsonAsync<AccessRequestResponse>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(info);
        Assert.Equal("owner@example.com", info.RequestEmail);
        Assert.Equal(WinstonApiFactory.UnallowedId, info.ObjectId);
    }

    private static User CreateUser(Guid id, string name) => new() { Id = id, Name = name };

    private sealed record AccessRequestResponse(string RequestEmail, Guid ObjectId);
}

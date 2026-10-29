using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Winston.Core;

namespace Winston.API.Tests;

public class TransactionsEndpointsTests(WinstonApiFactory factory)
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
    public async Task CreateTransaction_OverridesSenderWithCurrentUser()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        var request = CreateTransaction(
            WinstonApiFactory.CarolId,
            WinstonApiFactory.BobId,
            25M);

        var response = await client.PostAsJsonAsync("/api/transactions", request);
        var created = await response.Content.ReadFromJsonAsync<Transaction>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(created);
        Assert.Equal(WinstonApiFactory.AliceId, created.SenderId);
        Assert.Equal(WinstonApiFactory.BobId, created.RecipientId);
    }

    [Fact]
    public async Task GetTransaction_ReturnsSenderAndRecipient()
    {
        var transaction = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            25M);
        await factory.SeedAsync(transaction);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);

        var result = await client.GetFromJsonAsync<Transaction>($"/api/transactions/{transaction.Id}");

        Assert.NotNull(result);
        Assert.Equal("Alice", result.Sender?.Name);
        Assert.Equal("Bob", result.Recipient?.Name);
    }

    [Fact]
    public async Task GetTransactions_OrdersNotReceivedFirstThenNewestDate()
    {
        var oldest = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            10M,
            new DateOnly(2026, 1, 1));
        var newest = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            20M,
            new DateOnly(2026, 3, 1));
        var disputed = CreateTransaction(
            WinstonApiFactory.BobId,
            WinstonApiFactory.AliceId,
            30M,
            new DateOnly(2026, 2, 1),
            notReceived: true);
        await factory.SeedAsync(oldest, newest, disputed);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);

        var result = await client.GetFromJsonAsync<List<Transaction>>("/api/transactions");

        Assert.NotNull(result);
        Assert.Equal([disputed.Id, newest.Id, oldest.Id], result.Select(item => item.Id));
    }

    [Fact]
    public async Task UpdateTransaction_ChangesEditableValuesForSender()
    {
        var transaction = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            25M);
        await factory.SeedAsync(transaction);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);
        transaction.RecipientId = WinstonApiFactory.CarolId;
        transaction.Cost = 30M;
        transaction.Notes = "Updated";

        var response = await client.PutAsJsonAsync(
            $"/api/transactions/{transaction.Id}",
            transaction);
        var updated = await response.Content.ReadFromJsonAsync<Transaction>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(updated);
        Assert.Equal(WinstonApiFactory.CarolId, updated.RecipientId);
        Assert.Equal(30M, updated.Cost);
        Assert.Equal("Updated", updated.Notes);
    }

    [Fact]
    public async Task UpdateTransaction_ReturnsForbidden_ForUserWhoIsNotSender()
    {
        var transaction = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            25M);
        await factory.SeedAsync(transaction);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.BobId);

        var response = await client.PutAsJsonAsync(
            $"/api/transactions/{transaction.Id}",
            transaction);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ToggleReceived_ChangesStatusForRecipient()
    {
        var transaction = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            25M);
        await factory.SeedAsync(transaction);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.BobId);

        var response = await client.PutAsJsonAsync(
            $"/api/transactions/{transaction.Id}/toggle-received",
            new { });
        var updated = await response.Content.ReadFromJsonAsync<Transaction>();

        response.EnsureSuccessStatusCode();
        Assert.NotNull(updated);
        Assert.True(updated.RecipientDidNotReceive);
    }

    [Fact]
    public async Task ToggleReceived_ReturnsForbidden_ForUserWhoIsNotRecipient()
    {
        var transaction = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            25M);
        await factory.SeedAsync(transaction);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.CarolId);

        var response = await client.PutAsJsonAsync(
            $"/api/transactions/{transaction.Id}/toggle-received",
            new { });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTransaction_RemovesRecordForSender()
    {
        var transaction = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            25M);
        await factory.SeedAsync(transaction);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);

        var response = await client.DeleteAsync($"/api/transactions/{transaction.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(0, await factory.QueryAsync(context => context.Transactions.CountAsync()));
    }

    [Fact]
    public async Task DeleteTransaction_ReturnsForbidden_ForUserWhoIsNotSender()
    {
        var transaction = CreateTransaction(
            WinstonApiFactory.AliceId,
            WinstonApiFactory.BobId,
            25M);
        await factory.SeedAsync(transaction);
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.BobId);

        var response = await client.DeleteAsync($"/api/transactions/{transaction.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(1, await factory.QueryAsync(context => context.Transactions.CountAsync()));
    }

    [Fact]
    public async Task GetTransaction_ReturnsNotFound_ForUnknownId()
    {
        using var client = factory.CreateAuthenticatedClient(WinstonApiFactory.AliceId);

        var response = await client.GetAsync($"/api/transactions/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static User CreateUser(Guid id, string name) => new() { Id = id, Name = name };

    private static Transaction CreateTransaction(
        Guid senderId,
        Guid recipientId,
        decimal cost,
        DateOnly? date = null,
        bool notReceived = false)
    {
        return new Transaction
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            RecipientId = recipientId,
            Date = date ?? new DateOnly(2026, 1, 1),
            Cost = cost,
            RecipientDidNotReceive = notReceived
        };
    }
}

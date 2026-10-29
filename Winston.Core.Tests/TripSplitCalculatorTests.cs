using Winston.Core;

namespace Winston.Core.Tests;

public class TripSplitCalculatorTests
{
    private static readonly Guid Alice = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Bob = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid Carol = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void CalculateSplits_ReturnsEmptyDictionary_WhenTripHasNoUsers()
    {
        var trip = CreateTrip(50M, Alice);

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Empty(result);
    }

    [Fact]
    public void CalculateSplits_AssignsEntireTotal_ToOnlyUser()
    {
        var trip = CreateTrip(42.75M, Alice, (Alice, 0M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(42.75M, result[Alice]);
    }

    [Fact]
    public void CalculateSplits_DividesSharedCostEqually()
    {
        var trip = CreateTrip(80M, Alice, (Alice, 0M), (Bob, 0M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(40M, result[Alice]);
        Assert.Equal(40M, result[Bob]);
    }

    [Fact]
    public void CalculateSplits_AddsEachUsersPersonalCost()
    {
        var trip = CreateTrip(100M, Alice, (Alice, 10M), (Bob, 20M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(45M, result[Alice]);
        Assert.Equal(55M, result[Bob]);
    }

    [Fact]
    public void CalculateSplits_AssignsRoundingRemainder_ToOwner()
    {
        var trip = CreateTrip(10M, Alice, (Alice, 0M), (Bob, 0M), (Carol, 0M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(3.34M, result[Alice]);
        Assert.Equal(3.33M, result[Bob]);
        Assert.Equal(3.33M, result[Carol]);
    }

    [Fact]
    public void CalculateSplits_AssignsRoundingRemainder_ToOwnerRegardlessOfListOrder()
    {
        var trip = CreateTrip(10M, Carol, (Alice, 0M), (Carol, 0M), (Bob, 0M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(3.33M, result[Alice]);
        Assert.Equal(3.33M, result[Bob]);
        Assert.Equal(3.34M, result[Carol]);
    }

    [Fact]
    public void CalculateSplits_ReturnsOnlyPersonalCosts_WhenTheyEqualTotal()
    {
        var trip = CreateTrip(100M, Alice, (Alice, 60M), (Bob, 40M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(60M, result[Alice]);
        Assert.Equal(40M, result[Bob]);
    }

    [Fact]
    public void CalculateSplits_ReturnsZeroShares_ForZeroTotal()
    {
        var trip = CreateTrip(0M, Alice, (Alice, 0M), (Bob, 0M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.All(result.Values, value => Assert.Equal(0M, value));
    }

    [Fact]
    public void CalculateSplits_PreservesExactCentTotals_WithPersonalCosts()
    {
        var trip = CreateTrip(100.01M, Alice, (Alice, 0.01M), (Bob, 0M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(50.01M, result[Alice]);
        Assert.Equal(50M, result[Bob]);
        Assert.Equal(trip.Total, result.Values.Sum());
    }

    [Fact]
    public void CalculateSplits_AlwaysSumsToTripTotal_WhenRoundingIsRequired()
    {
        var trip = CreateTrip(
            123.45M,
            Bob,
            (Alice, 1.11M),
            (Bob, 2.22M),
            (Carol, 3.33M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(123.45M, result.Values.Sum());
    }

    [Fact]
    public void CalculateSplits_DoesNotModifyTripUserPersonalCosts()
    {
        var trip = CreateTrip(75M, Alice, (Alice, 5M), (Bob, 10M));
        var originalCosts = trip.TripUsers.Select(user => user.PersonalCost).ToArray();

        _ = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(originalCosts, trip.TripUsers.Select(user => user.PersonalCost));
    }

    [Fact]
    public void CalculateSplits_ReturnsOneEntryPerTripUser()
    {
        var trip = CreateTrip(30M, Alice, (Alice, 0M), (Bob, 0M), (Carol, 0M));

        var result = TripSplitCalculator.CalculateSplits(trip);

        Assert.Equal(3, result.Count);
        Assert.Equal([Alice, Bob, Carol], result.Keys.Order());
    }

    private static Trip CreateTrip(
        decimal total,
        Guid ownerId,
        params (Guid UserId, decimal PersonalCost)[] users)
    {
        return new Trip
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Total = total,
            TripUsers = users.Select(user => new TripUser
            {
                UserId = user.UserId,
                PersonalCost = user.PersonalCost
            }).ToList()
        };
    }
}

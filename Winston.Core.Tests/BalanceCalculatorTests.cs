using Winston.Core;

namespace Winston.Core.Tests;

public class BalanceCalculatorTests
{
    private static readonly Guid Alice = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Bob = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid Carol = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void CalculateBalances_ReturnsEmptyDictionary_WhenThereIsNoActivity()
    {
        var result = BalanceCalculator.CalculateBalances(Alice, [], []);

        Assert.Empty(result);
    }

    [Fact]
    public void CalculateBalances_ShowsPositiveAmounts_WhenOthersOweOwner()
    {
        var trip = CreateTrip(90M, Alice, Alice, Bob, Carol);

        var result = BalanceCalculator.CalculateBalances(Alice, [trip], []);

        Assert.Equal(30M, result[Bob]);
        Assert.Equal(30M, result[Carol]);
        Assert.DoesNotContain(Alice, result.Keys);
    }

    [Fact]
    public void CalculateBalances_ShowsNegativeAmount_WhenCurrentUserOwesOwner()
    {
        var trip = CreateTrip(60M, Alice, Alice, Bob);

        var result = BalanceCalculator.CalculateBalances(Bob, [trip], []);

        Assert.Equal(-30M, result[Alice]);
    }

    [Fact]
    public void CalculateBalances_IgnoresTrip_WhenCurrentUserDidNotParticipate()
    {
        var trip = CreateTrip(60M, Alice, Alice, Bob);

        var result = BalanceCalculator.CalculateBalances(Carol, [trip], []);

        Assert.Empty(result);
    }

    [Fact]
    public void CalculateBalances_IncludesPersonalCostInParticipantDebt()
    {
        var trip = CreateTrip(100M, Alice, (Alice, 0M), (Bob, 20M));

        var result = BalanceCalculator.CalculateBalances(Bob, [trip], []);

        Assert.Equal(-60M, result[Alice]);
    }

    [Fact]
    public void CalculateBalances_AddsCompletedOutgoingPayment()
    {
        var payment = CreateTransaction(Alice, Bob, 25M);

        var result = BalanceCalculator.CalculateBalances(Alice, [], [payment]);

        Assert.Equal(25M, result[Bob]);
    }

    [Fact]
    public void CalculateBalances_SubtractsCompletedIncomingPayment()
    {
        var payment = CreateTransaction(Bob, Alice, 25M);

        var result = BalanceCalculator.CalculateBalances(Alice, [], [payment]);

        Assert.Equal(-25M, result[Bob]);
    }

    [Fact]
    public void CalculateBalances_IgnoresPaymentMarkedNotReceived()
    {
        var payment = CreateTransaction(Alice, Bob, 25M, notReceived: true);

        var result = BalanceCalculator.CalculateBalances(Alice, [], [payment]);

        Assert.Empty(result);
    }

    [Fact]
    public void CalculateBalances_IgnoresUnrelatedPayment()
    {
        var payment = CreateTransaction(Bob, Carol, 25M);

        var result = BalanceCalculator.CalculateBalances(Alice, [], [payment]);

        Assert.Empty(result);
    }

    [Fact]
    public void CalculateBalances_NetsTripDebtAgainstRepayment()
    {
        var trip = CreateTrip(100M, Alice, Alice, Bob);
        var payment = CreateTransaction(Bob, Alice, 20M);

        var result = BalanceCalculator.CalculateBalances(Alice, [trip], [payment]);

        Assert.Equal(30M, result[Bob]);
    }

    [Fact]
    public void CalculateBalances_AccumulatesMultipleTripsForSameFriend()
    {
        var firstTrip = CreateTrip(100M, Alice, Alice, Bob);
        var secondTrip = CreateTrip(40M, Alice, Alice, Bob);

        var result = BalanceCalculator.CalculateBalances(Alice, [firstTrip, secondTrip], []);

        Assert.Equal(70M, result[Bob]);
    }

    [Fact]
    public void CalculateBalances_TracksDifferentFriendsIndependently()
    {
        var trip = CreateTrip(90M, Alice, Alice, Bob, Carol);
        var bobPayment = CreateTransaction(Bob, Alice, 5M);

        var result = BalanceCalculator.CalculateBalances(Alice, [trip], [bobPayment]);

        Assert.Equal(25M, result[Bob]);
        Assert.Equal(30M, result[Carol]);
    }

    [Fact]
    public void CalculateBalances_PreservesCentPrecisionAcrossActivity()
    {
        var trip = CreateTrip(10M, Alice, Alice, Bob, Carol);
        var payment = CreateTransaction(Bob, Alice, 1.11M);

        var result = BalanceCalculator.CalculateBalances(Alice, [trip], [payment]);

        Assert.Equal(2.22M, result[Bob]);
        Assert.Equal(3.33M, result[Carol]);
    }

    [Fact]
    public void CalculateBalances_DoesNotModifyInputCollections()
    {
        var trips = new List<Trip> { CreateTrip(50M, Alice, Alice, Bob) };
        var transactions = new List<Transaction> { CreateTransaction(Bob, Alice, 10M) };

        _ = BalanceCalculator.CalculateBalances(Alice, trips, transactions);

        Assert.Single(trips);
        Assert.Single(transactions);
        Assert.Equal(50M, trips[0].Total);
        Assert.Equal(10M, transactions[0].Cost);
    }

    private static Trip CreateTrip(decimal total, Guid ownerId, params Guid[] users)
    {
        return CreateTrip(total, ownerId, users.Select(userId => (userId, 0M)).ToArray());
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

    private static Transaction CreateTransaction(
        Guid senderId,
        Guid recipientId,
        decimal cost,
        bool notReceived = false)
    {
        return new Transaction
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            RecipientId = recipientId,
            Cost = cost,
            RecipientDidNotReceive = notReceived
        };
    }
}

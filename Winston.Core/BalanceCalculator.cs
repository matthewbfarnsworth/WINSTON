namespace Winston.Core;

public static class BalanceCalculator
{
    public static Dictionary<Guid, decimal> CalculateBalances(
        Guid userId,
        List<Trip> trips,
        List<Transaction> transactions)
    {
        var balances = new Dictionary<Guid, decimal>();

        foreach (var trip in trips)
        {
            var splits = TripSplitCalculator.CalculateSplits(trip);
            if (trip.OwnerId == userId)
            {
                foreach (var split in splits)
                {
                    var otherUserId = split.Key;
                    if (otherUserId == userId) continue;
                    var splitAmount = split.Value;
                    if (!balances.ContainsKey(otherUserId)) balances[otherUserId] = 0;
                    balances[otherUserId] += splitAmount;
                }
            }
            else
            {
                if (splits.ContainsKey(userId))
                {
                    if (!balances.ContainsKey(trip.OwnerId)) balances[trip.OwnerId] = 0;
                    balances[trip.OwnerId] -= splits[userId];
                }
            }
        }

        foreach (var transaction in transactions)
        {
            if (transaction.RecipientDidNotReceive) continue;
            if (transaction.SenderId == userId)
            {
                var recipientId = transaction.RecipientId;
                if (!balances.ContainsKey(recipientId)) balances[recipientId] = 0;
                balances[recipientId] += transaction.Cost;
            }
            else if (transaction.RecipientId == userId)
            {
                var senderId = transaction.SenderId;
                if (!balances.ContainsKey(senderId)) balances[senderId] = 0;
                balances[senderId] -= transaction.Cost;
            }
        }

        return balances;
    }
}
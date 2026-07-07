namespace Winston.Core;

public static class TripSplitCalculator
{
    public static Dictionary<Guid, decimal> CalculateSplits(Trip trip)
    {
        var splits = new Dictionary<Guid, decimal>();
        decimal totalCost = trip.Total;
        decimal sumPersonalCost = 0;
        foreach (var tripUser in trip.TripUsers)
        {
            sumPersonalCost += tripUser.PersonalCost;
        }
        int totalUsers = trip.TripUsers.Count;
        if (totalUsers == 0)
        {
            return splits;
        }
        decimal roundedBaseSplit = Math.Round((totalCost - sumPersonalCost) / totalUsers, 2, MidpointRounding.ToZero);
        foreach (var tripUser in trip.TripUsers)
        {
            splits[tripUser.UserId] = roundedBaseSplit + tripUser.PersonalCost;
        }
        decimal sumSplits = 0;
        foreach (var split in splits.Values)
        {
            sumSplits += split;
        }
        decimal roundingError = trip.Total - sumSplits;
        if (roundingError != 0)
        {
            splits[trip.OwnerId] += roundingError;
        }
        return splits;
    }
}
using System.Security.Claims;
using Winston.API.Services;

namespace Winston.API.Tests;

public class ClaimsPrincipalExtensionsTests
{
    private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public void TryGetObjectId_ReadsMicrosoftObjectIdentifierClaim()
    {
        var principal = CreatePrincipal(
            "http://schemas.microsoft.com/identity/claims/objectidentifier",
            UserId.ToString());

        var success = principal.TryGetObjectId(out var objectId);

        Assert.True(success);
        Assert.Equal(UserId, objectId);
    }

    [Fact]
    public void TryGetObjectId_ReadsShortOidClaim()
    {
        var principal = CreatePrincipal("oid", UserId.ToString());

        var success = principal.TryGetObjectId(out var objectId);

        Assert.True(success);
        Assert.Equal(UserId, objectId);
    }

    [Fact]
    public void TryGetObjectId_PrefersMicrosoftClaim_WhenBothArePresent()
    {
        var identity = new ClaimsIdentity(
        [
            new Claim(
                "http://schemas.microsoft.com/identity/claims/objectidentifier",
                UserId.ToString()),
            new Claim("oid", Guid.NewGuid().ToString())
        ]);
        var principal = new ClaimsPrincipal(identity);

        var success = principal.TryGetObjectId(out var objectId);

        Assert.True(success);
        Assert.Equal(UserId, objectId);
    }

    [Fact]
    public void TryGetObjectId_ReturnsFalse_WhenClaimIsMissing()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        var success = principal.TryGetObjectId(out var objectId);

        Assert.False(success);
        Assert.Equal(Guid.Empty, objectId);
    }

    [Fact]
    public void TryGetObjectId_ReturnsFalse_WhenClaimIsNotGuid()
    {
        var principal = CreatePrincipal("oid", "not-a-guid");

        var success = principal.TryGetObjectId(out var objectId);

        Assert.False(success);
        Assert.Equal(Guid.Empty, objectId);
    }

    private static ClaimsPrincipal CreatePrincipal(string claimType, string claimValue)
    {
        return new ClaimsPrincipal(new ClaimsIdentity([new Claim(claimType, claimValue)]));
    }
}

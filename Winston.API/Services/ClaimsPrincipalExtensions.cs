using System.Security.Claims;

namespace Winston.API.Services;

public static class ClaimsPrincipalExtensions
{
    private const string ObjectIdClaim = "http://schemas.microsoft.com/identity/claims/objectidentifier";

    public static bool TryGetObjectId(this ClaimsPrincipal user, out Guid objectId)
    {
        var claimValue = user.FindFirst(ObjectIdClaim)?.Value
            ?? user.FindFirst("oid")?.Value;

        return Guid.TryParse(claimValue, out objectId);
    }
}

using System.Security.Claims;
using Winston.Core;

namespace Winston.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var oidClaim = user?.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (Guid.TryParse(oidClaim, out var userId))
        {
            return userId;
        }

        throw new UnauthorizedAccessException("User is not authenticated with Entra ID");
    }
}
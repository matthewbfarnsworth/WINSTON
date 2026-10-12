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
        if (user != null && user.TryGetObjectId(out var userId))
        {
            return userId;
        }

        throw new UnauthorizedAccessException("User is not authenticated with Entra ID");
    }
}

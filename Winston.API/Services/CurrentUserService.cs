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
        var headerValue = _httpContextAccessor.HttpContext?.Request.Headers["X-User-Id"].ToString();
        if (Guid.TryParse(headerValue, out var userId))
        {
            return userId;
        }
        //TODO remove dummy data
        //User1
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Winston.API.Services;

namespace Winston.API.Authorization;

public sealed class AllowedUserAuthorizationHandler(
    IOptionsMonitor<AccessControlOptions> options)
    : AuthorizationHandler<AllowedUserRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AllowedUserRequirement requirement)
    {
        if (context.User.TryGetObjectId(out var objectId)
            && options.CurrentValue.AllowedUserObjectIds.Contains(objectId))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Winston.API.Services;

namespace Winston.API.Authorization;

public sealed class AllowedUserAuthorizationHandler(
    IOptionsMonitor<AccessControlOptions> options,
    ILogger<AllowedUserAuthorizationHandler> logger)
    : AuthorizationHandler<AllowedUserRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AllowedUserRequirement requirement)
    {
        if (!context.User.TryGetObjectId(out var objectId))
        {
            logger.LogWarning("An authenticated WINSTON request did not contain an oid claim");
            return Task.CompletedTask;
        }

        if (options.CurrentValue.AllowedUserObjectIds.Contains(objectId))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        logger.LogWarning(
            "Microsoft account {ObjectId} is not in the WINSTON allow-list",
            objectId);

        return Task.CompletedTask;
    }
}

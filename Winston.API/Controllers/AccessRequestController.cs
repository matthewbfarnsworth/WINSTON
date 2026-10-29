using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web.Resource;
using Winston.API.Authorization;
using Winston.API.Services;

namespace Winston.API.Controllers;

[ApiController]
[Route("api/access-request")]
[Authorize]
[RequiredScope("access_as_user")]
public sealed class AccessRequestController(
    IOptions<AccessControlOptions> options) : ControllerBase
{
    [HttpGet]
    public ActionResult<AccessRequestInfo> GetAccessRequestInfo()
    {
        if (!User.TryGetObjectId(out var objectId))
        {
            return Unauthorized();
        }

        return Ok(new AccessRequestInfo(
            options.Value.AccessRequestEmail,
            objectId));
    }
}

public sealed record AccessRequestInfo(string RequestEmail, Guid ObjectId);

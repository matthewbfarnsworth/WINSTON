using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web.Resource;
using Winston.API.Authorization;
using Winston.API.Data;
using Winston.Core;

namespace Winston.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthorizationPolicies.AllowedUser)]
[RequiredScope("access_as_user")]
public class UsersController : ControllerBase
{
    private readonly WinstonDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(WinstonDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        var currentUserId = _currentUserService.GetCurrentUserId();
        var user = await _context.Users.FindAsync(currentUserId);
        if (user == null)
        {
            var name = User.FindFirst("name")?.Value;
            if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name not found");

            user = new User { Id = currentUserId, Name = name };
            _context.Users.Add(user);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                _context.Entry(user).State = EntityState.Detached;
                user = await _context.Users.FindAsync(currentUserId);
                if (user == null) throw;
            }
        }

        return user;
    }

    [HttpGet("balances")]
    public async Task<ActionResult<Dictionary<Guid, decimal>>> GetBalances()
    {
        var currentUserId = _currentUserService.GetCurrentUserId();
        var trips = await _context.Trips
            .Include(trip => trip.TripUsers)
            .ToListAsync();
        var transactions = await _context.Transactions.ToListAsync();
        var balances = BalanceCalculator.CalculateBalances(currentUserId, trips, transactions);
        return Ok(balances);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        return await _context.Users.ToListAsync();
    }
}

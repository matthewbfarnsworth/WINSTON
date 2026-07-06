using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Winston.API.Data;
using Winston.Core;

namespace Winston.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly WinstonDbContext _context;

    public UsersController(WinstonDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        return await _context.Users.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(User user)
    {
        if (user.Id == Guid.Empty)
        {
            user.Id = Guid.NewGuid();
        }
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Winston.API.Data;
using Winston.Core;

namespace Winston.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TripsController : ControllerBase
{
    private readonly WinstonDbContext _context;
    private readonly IStorageService _storageService;

    public TripsController(WinstonDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trip>>> GetTrips()
    {
        return await _context.Trips
            .Include(trip => trip.Owner)
            .Include(trip => trip.TripUsers)
                .ThenInclude(tripUser => tripUser.User)
            .OrderByDescending(trip => trip.Date)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Trip>> GetTrip(Guid id)
    {
        var trip = await _context.Trips
            .Include(trip => trip.Owner)
            .Include(trip => trip.TripUsers)
                .ThenInclude(tripUser => tripUser.User)
            .FirstOrDefaultAsync(trip => trip.Id == id);

        if (trip == null) return NotFound();
        return trip;
    }

    [HttpPost]
    public async Task<ActionResult<Trip>> CreateTrip(Trip trip)
    {
        if (trip.Id == Guid.Empty) trip.Id = Guid.NewGuid();
        _context.Trips.Add(trip);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, trip);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTrip(Guid id, Trip updatedTrip)
    {
        if (id != updatedTrip.Id) return BadRequest("ID mismatch");
        var existingTrip = await _context.Trips
            .Include(trip => trip.TripUsers)
            .FirstOrDefaultAsync(trip => trip.Id == id);
        
        if (existingTrip == null) return NotFound();
        _context.Entry(existingTrip).CurrentValues.SetValues(updatedTrip);
        _context.TripUsers.RemoveRange(existingTrip.TripUsers);
        foreach (var newUser in updatedTrip.TripUsers)
        {
            newUser.TripId = id;
            _context.TripUsers.Add(newUser);
        }
        await _context.SaveChangesAsync();
        var reloadedTrip = await _context.Trips
            .Include(trip => trip.Owner)
            .Include(trip => trip.TripUsers)
                .ThenInclude(tripUser => tripUser.User)
            .FirstOrDefaultAsync(trip => trip.Id == id);
        return Ok(reloadedTrip);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrip(Guid id)
    {
        var trip = await _context.Trips.FindAsync(id);
        if (trip == null) return NotFound();
        _context.Trips.Remove(trip);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadReceipt(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }
        using (var stream = file.OpenReadStream())
        {
            var fileUrl = await _storageService.UploadFileAsync(stream, file.FileName);
            return Ok(new { url = fileUrl });
        }
    }
}
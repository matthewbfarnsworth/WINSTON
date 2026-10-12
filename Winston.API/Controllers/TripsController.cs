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
public class TripsController : ControllerBase
{
    private readonly WinstonDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public TripsController(WinstonDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trip>>> GetTrips()
    {
        var trips = await _context.Trips
            .Include(trip => trip.Owner)
            .Include(trip => trip.TripUsers)
                .ThenInclude(tripUser => tripUser.User)
            .OrderByDescending(trip => trip.Date)
            .ToListAsync();
        
        foreach (var trip in trips)
        {
            var splits = TripSplitCalculator.CalculateSplits(trip);
            foreach (var tripUser in trip.TripUsers)
            {
                tripUser.Split = splits.GetValueOrDefault(tripUser.UserId);
            }
        }

        return trips;
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

        var splits = TripSplitCalculator.CalculateSplits(trip);
        foreach (var tripUser in trip.TripUsers)
        {
            tripUser.Split = splits.GetValueOrDefault(tripUser.UserId);
        }
        return trip;
    }

    [HttpPost]
    public async Task<ActionResult<Trip>> CreateTrip(Trip trip)
    {
        if (string.IsNullOrWhiteSpace(trip.Name) || trip.Total <= 0)
        {
            return BadRequest("Invalid trip data");
        }
        if (trip.Id == Guid.Empty) trip.Id = Guid.NewGuid();
        trip.OwnerId = _currentUserService.GetCurrentUserId();
        if (trip.TripUsers.Any(tripUser => tripUser.UserId == Guid.Empty))
        {
            return BadRequest("Trip users must have a valid user ID");
        }
        if (trip.TripUsers.Select(tripUser => tripUser.UserId).Distinct().Count() != trip.TripUsers.Count)
        {
            return BadRequest("Trip users must be unique");
        }
        if (!trip.TripUsers.Any(tripUser => tripUser.UserId == trip.OwnerId))
        {
            trip.TripUsers.Add(new TripUser { UserId = trip.OwnerId });
        }
        foreach (var tripUser in trip.TripUsers)
        {
            tripUser.TripId = trip.Id;
        }
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
        if (existingTrip.OwnerId != _currentUserService.GetCurrentUserId())
        {
            return Forbid();
        }
        if (string.IsNullOrWhiteSpace(updatedTrip.Name) || updatedTrip.Total <= 0)
        {
            return BadRequest("Invalid trip data");
        }
        if (updatedTrip.TripUsers.Any(tripUser => tripUser.UserId == Guid.Empty))
        {
            return BadRequest("Trip users must have a valid user ID");
        }
        if (updatedTrip.TripUsers.Select(tripUser => tripUser.UserId).Distinct().Count() != updatedTrip.TripUsers.Count)
        {
            return BadRequest("Trip users must be unique");
        }
        if (!updatedTrip.TripUsers.Any(tripUser => tripUser.UserId == existingTrip.OwnerId))
        {
            return BadRequest("The trip owner must be included in the trip users");
        }

        existingTrip.Name = updatedTrip.Name;
        existingTrip.Date = updatedTrip.Date;
        existingTrip.Total = updatedTrip.Total;
        existingTrip.Notes = updatedTrip.Notes;
        existingTrip.ReceiptImageUrl = updatedTrip.ReceiptImageUrl;
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
        if (reloadedTrip != null)
        {
            var splits = TripSplitCalculator.CalculateSplits(reloadedTrip);
            foreach (var tripUser in reloadedTrip.TripUsers)
            {
                tripUser.Split = splits.GetValueOrDefault(tripUser.UserId);
            }
        }
        return Ok(reloadedTrip);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrip(Guid id)
    {
        var trip = await _context.Trips.FindAsync(id);
        if (trip == null) return NotFound();
        if (trip.OwnerId != _currentUserService.GetCurrentUserId())
        {
            return Forbid();
        }
        _context.Trips.Remove(trip);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadReceipt(
        IFormFile file,
        [FromServices] IStorageService storageService)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }
        using (var stream = file.OpenReadStream())
        {
            var fileUrl = await storageService.UploadFileAsync(stream, file.FileName);
            return Ok(new { url = fileUrl });
        }
    }
}

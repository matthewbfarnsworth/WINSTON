using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Winston.API.Data;
using Winston.Core;

namespace Winston.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly WinstonDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public TransactionsController(WinstonDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions()
    {
        return await _context.Transactions
            .Include(transaction => transaction.Sender)
            .Include(transaction => transaction.Recipient)
            .OrderByDescending(trip => trip.RecipientDidNotReceive)
            .ThenByDescending(trip => trip.Date)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Transaction>> GetTransaction(Guid id)
    {
        var transaction = await _context.Transactions
            .Include(transaction => transaction.Sender)
            .Include(transaction => transaction.Recipient)
            .FirstOrDefaultAsync(transaction => transaction.Id == id);
        if (transaction == null) return NotFound();
        return transaction;
    }

    [HttpPost]
    public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
    {
        if (transaction.Id == Guid.Empty) transaction.Id = Guid.NewGuid();
        if (transaction.SenderId == Guid.Empty) transaction.SenderId = _currentUserService.GetCurrentUserId();
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTransaction(Guid id, Transaction updatedTransaction)
    {
        if (id != updatedTransaction.Id) return BadRequest("ID mismatch");
        var existingTransaction = await _context.Transactions.FindAsync(id);
        if (existingTransaction == null) return NotFound();
        _context.Entry(existingTransaction).CurrentValues.SetValues(updatedTransaction);
        await _context.SaveChangesAsync();
        var reloadedTransaction = await _context.Transactions
            .Include(trip => trip.Sender)
            .Include(trip => trip.Recipient)
            .FirstOrDefaultAsync(trip => trip.Id == id);
        return Ok(reloadedTransaction);
    }

    [HttpPut("{id}/toggle-received")]
    public async Task<IActionResult> ToggleReceived(Guid id)
    {
        var transaction = await _context.Transactions.FindAsync(id);
        if (transaction == null) return NotFound();
        transaction.RecipientDidNotReceive = !transaction.RecipientDidNotReceive;
        await _context.SaveChangesAsync();
        return Ok(transaction);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(Guid id)
    {
        var transaction = await _context.Transactions.FindAsync(id);
        if (transaction == null) return NotFound();
        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
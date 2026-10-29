using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Winston.API.Authorization;
using Winston.API.Data;
using Winston.API.Services;
using Winston.Core;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<WinstonDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure()));
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.Configure<AccessControlOptions>(
    builder.Configuration.GetSection(AccessControlOptions.SectionName));
builder.Services.AddSingleton<IAuthorizationHandler, AllowedUserAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.AllowedUser, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new AllowedUserRequirement());
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
}
);

builder.Services.AddScoped<IStorageService, AzureBlobStorageService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Integration tests supply a short-lived SQLite database that is created by the test host.
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<WinstonDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();

app.UseStaticFiles();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;

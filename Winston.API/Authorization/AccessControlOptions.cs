namespace Winston.API.Authorization;

public sealed class AccessControlOptions
{
    public const string SectionName = "AccessControl";

    public string AccessRequestEmail { get; set; } = string.Empty;
    public Guid[] AllowedUserObjectIds { get; set; } = [];
}

namespace Winston.API.Authorization;

public sealed class AccessControlOptions
{
    public const string SectionName = "AccessControl";

    public Guid[] AllowedUserObjectIds { get; set; } = [];
}

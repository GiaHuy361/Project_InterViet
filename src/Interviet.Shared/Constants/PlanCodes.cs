namespace Interviet.Shared.Constants;

public static class PlanCodes
{
    public const string Free = "free";
    public const string Monthly = "monthly";
    public const string Quarterly = "quarterly";
    public const string Yearly = "yearly";

    /// <summary>Plans eligible for trial (only Yearly per business rules).</summary>
    public static readonly IReadOnlySet<string> TrialEligible = new HashSet<string> { Yearly };
}

public static class PlanCycles
{
    public const string Free = "free";
    public const string Monthly = "monthly";
    public const string Quarterly = "quarterly";
    public const string Yearly = "yearly";
}

public static class AiModelTiers
{
    public const string Basic = "basic";
    public const string Stable = "stable";
    public const string Premium = "premium";
}

public static class SupportTiers
{
    public const string Email = "email";
    public const string Priority = "priority";
    public const string Priority24x7 = "priority_24x7";
}

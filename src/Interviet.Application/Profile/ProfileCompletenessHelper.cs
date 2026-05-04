namespace Interviet.Application.Profile;

/// <summary>
/// Centralized profile completeness calculator — used by UpdateProfile, AddSkill, etc.
/// Scores are additive and capped at 100. Adjust weights as product evolves.
/// </summary>
internal static class ProfileCompletenessHelper
{
    public static decimal Calculate(
        Domain.Identity.User user,
        Domain.Profiles.CandidateProfile profile)
    {
        var score = 0m;

        // Identity / bio
        if (!string.IsNullOrWhiteSpace(user.PhoneNumber)) score += 5;
        if (!string.IsNullOrWhiteSpace(user.AvatarUrl)) score += 5;

        // Core profile fields
        if (!string.IsNullOrWhiteSpace(profile.Headline)) score += 15;
        if (!string.IsNullOrWhiteSpace(profile.Summary)) score += 10;
        if (profile.YearsOfExperience is not null) score += 5;

        // Sub-entities
        if ((profile.Skills?.Count ?? 0) > 0) score += 20;
        if ((profile.Educations?.Count ?? 0) > 0) score += 15;
        if ((profile.WorkExperiences?.Count ?? 0) > 0) score += 20;
        if ((profile.Links?.Count ?? 0) > 0) score += 5;

        return Math.Min(100, score);
    }
}

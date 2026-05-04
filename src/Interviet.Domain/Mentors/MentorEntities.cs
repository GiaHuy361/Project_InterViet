using Interviet.Domain.Common;

namespace Interviet.Domain.Mentors;

public class Mentor : AuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public string? ExpertiseJson { get; set; }
    public decimal? YearsOfExperience { get; set; }
    public decimal? RatingAverage { get; set; }
    public int RatingCount { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<MentorAvailabilitySlot> AvailabilitySlots { get; set; } = [];
    public ICollection<MentorBooking> Bookings { get; set; } = [];
}

public class MentorAvailabilitySlot : BaseEntity
{
    public Guid MentorId { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }

    /// <summary>open | held | booked | cancelled</summary>
    public string Status { get; set; } = "open";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Mentor Mentor { get; set; } = null!;
}

public class MentorBooking : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid MentorId { get; set; }
    public Guid? AvailabilitySlotId { get; set; }

    /// <summary>pending | confirmed | cancelled | completed | no_show</summary>
    public string Status { get; set; } = "pending";
    public string? MeetingMode { get; set; }
    public string? MeetingLink { get; set; }
    public DateTime ScheduledStartsAt { get; set; }
    public DateTime ScheduledEndsAt { get; set; }
    public string? CandidateNotes { get; set; }
    public Guid? SharedResumeVersionId { get; set; }
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Mentor Mentor { get; set; } = null!;
    public MentorReview? Review { get; set; }
}

public class MentorReview : BaseEntity
{
    public Guid MentorBookingId { get; set; }
    public Guid MentorId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

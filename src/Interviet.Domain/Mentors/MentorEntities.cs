using System;
using System.Collections.Generic;
using Interviet.Domain.Common;

namespace Interviet.Domain.Mentors;

public class MentorProfile : AuditableEntity
{
    public Guid? UserId { get; set; }
    public bool IsVerified { get; set; } = false;
    public string FullName { get; set; } = string.Empty;
    public string? Headline { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string? ExpertiseJson { get; set; }
    public string? IndustriesJson { get; set; }
    public string? LanguagesJson { get; set; }
    public decimal YearsOfExperience { get; set; }
    public decimal RatingAverage { get; set; }
    public int RatingCount { get; set; }
    public string Status { get; set; } = "active"; // active | inactive
    public string? MeetingUrl { get; set; }

    public ICollection<MentorSpecialty> Specialties { get; set; } = [];
    public ICollection<MentorAvailabilitySlot> AvailabilitySlots { get; set; } = [];
    public ICollection<MentorBooking> Bookings { get; set; } = [];
}

public class MentorSpecialty : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<MentorProfile> Mentors { get; set; } = [];
}

public class MentorAvailabilitySlot : BaseEntity
{
    public Guid MentorId { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public string Status { get; set; } = "available"; // available | reserved | booked | blocked | expired
    public DateTime? ReservedUntil { get; set; }
    public decimal PriceAmount { get; set; }
    public string CurrencyCode { get; set; } = "VND";

    public MentorProfile Mentor { get; set; } = null!;
}

public class MentorBooking : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid MentorId { get; set; }
    public Guid? AvailabilitySlotId { get; set; }
    public string Status { get; set; } = "pending_payment"; // pending_payment | confirmed | cancelled | completed | payment_failed | payment_cancelled | payment_expired | no_show
    public DateTime ScheduledStartsAt { get; set; }
    public DateTime ScheduledEndsAt { get; set; }
    public string ServiceType { get; set; } = string.Empty; // cv_review | mock_interview | career_coaching | technical_mentoring
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "VND";
    public string? MeetingUrl { get; set; }
    public string? CandidateNotes { get; set; }
    public string? CancelReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public MentorProfile Mentor { get; set; } = null!;
    public MentorAvailabilitySlot? AvailabilitySlot { get; set; }
    public MentorReview? Review { get; set; }
}

public class MentorReview : BaseEntity
{
    public Guid MentorBookingId { get; set; }
    public Guid MentorId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; } // 1 to 5
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public MentorBooking Booking { get; set; } = null!;
}

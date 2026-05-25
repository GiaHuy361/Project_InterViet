using System;
using System.Collections.Generic;

namespace Interviet.Contracts.Mentors;

public sealed class MentorSpecialtyDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
}

public sealed class MentorListResponse
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string? Headline { get; init; }
    public string? AvatarUrl { get; init; }
    public decimal YearsOfExperience { get; init; }
    public decimal RatingAverage { get; init; }
    public int RatingCount { get; init; }
    public List<MentorSpecialtyDto> Specialties { get; init; } = [];
}

public sealed class MentorAvailabilitySlotDto
{
    public Guid Id { get; init; }
    public DateTime StartsAt { get; init; }
    public DateTime EndsAt { get; init; }
    public string Status { get; init; } = string.Empty;
    public decimal PriceAmount { get; init; }
    public string CurrencyCode { get; init; } = "VND";
}

public sealed class MentorDetailResponse
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string? Headline { get; init; }
    public string? AvatarUrl { get; init; }
    public string? Bio { get; init; }
    public decimal YearsOfExperience { get; init; }
    public decimal RatingAverage { get; init; }
    public int RatingCount { get; init; }
    public List<MentorSpecialtyDto> Specialties { get; init; } = [];
    public List<MentorAvailabilitySlotDto> AvailabilitySlots { get; init; } = [];
}

public sealed class BookMentorRequest
{
    public Guid SlotId { get; init; }
    public string ServiceType { get; init; } = string.Empty; // cv_review | mock_interview | career_coaching | technical_mentoring
    public string? CandidateNotes { get; init; }
}

public sealed class BookMentorResponse
{
    public Guid BookingId { get; init; }
    public string Status { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = "VND";
    public Guid CheckoutSessionId { get; init; }
    public string CheckoutUrl { get; init; } = string.Empty;
    public string PaymentInstructionsUrl { get; init; } = string.Empty;
}

public sealed class ReviewResponse
{
    public Guid Id { get; init; }
    public Guid MentorBookingId { get; init; }
    public Guid MentorId { get; init; }
    public Guid UserId { get; init; }
    public int Rating { get; init; }
    public string? Comment { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class MentorBookingResponse
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public Guid MentorId { get; init; }
    public string MentorName { get; init; } = string.Empty;
    public string? MentorHeadline { get; init; }
    public string? MentorAvatarUrl { get; init; }
    public Guid? AvailabilitySlotId { get; init; }
    public string Status { get; init; } = string.Empty; // pending_payment | confirmed | cancelled | completed | payment_failed | payment_cancelled | payment_expired | no_show
    public DateTime ScheduledStartsAt { get; init; }
    public DateTime ScheduledEndsAt { get; init; }
    public string ServiceType { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = "VND";
    public string? MeetingUrl { get; init; }
    public string? CandidateNotes { get; init; }
    public string? CancelReason { get; init; }
    public DateTime? CancelledAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public ReviewResponse? Review { get; init; }
    public Guid? CheckoutSessionId { get; init; }
    public string? CheckoutStatus { get; init; }
}

public sealed class CancelBookingRequest
{
    public string Reason { get; init; } = string.Empty;
}

public sealed class SubmitReviewRequest
{
    public int Rating { get; init; }
    public string? Comment { get; init; }
}

public sealed class UpdateMentorProfileRequest
{
    public string FullName { get; init; } = string.Empty;
    public string? Headline { get; init; }
    public string? AvatarUrl { get; init; }
    public string? Bio { get; init; }
    public decimal YearsOfExperience { get; init; }
    public List<string> Expertise { get; init; } = [];
    public List<string> Industries { get; init; } = [];
    public List<string> Languages { get; init; } = [];
}

public sealed class MentorProfileResponse
{
    public Guid Id { get; init; }
    public Guid? UserId { get; init; }
    public bool IsVerified { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string? Headline { get; init; }
    public string? AvatarUrl { get; init; }
    public string? Bio { get; init; }
    public decimal YearsOfExperience { get; init; }
    public decimal RatingAverage { get; init; }
    public int RatingCount { get; init; }
    public string Status { get; init; } = string.Empty;
    public List<string> Expertise { get; init; } = [];
    public List<string> Industries { get; init; } = [];
    public List<string> Languages { get; init; } = [];
}

public sealed class MentorDashboardSummaryResponse
{
    public int PendingBookingsCount { get; init; }
    public int ConfirmedBookingsCount { get; init; }
    public int CompletedBookingsCount { get; init; }
    public int CancelledBookingsCount { get; init; }
    public decimal TotalEarningsAmount { get; init; }
    public string CurrencyCode { get; init; } = "VND";
    public decimal AverageRating { get; init; }
    public List<MentorBookingResponse> RecentBookings { get; init; } = [];
}

public sealed class UpdateBookingStatusRequest
{
    public string Status { get; init; } = string.Empty; // confirmed | cancelled | completed
    public string? CancelReason { get; init; }
}

public sealed class ConfigureAvailabilitySlotsRequest
{
    public List<AvailabilitySlotRequestItem> Slots { get; init; } = [];
}

public sealed class AvailabilitySlotRequestItem
{
    public DateTime StartsAt { get; init; }
    public DateTime EndsAt { get; init; }
    public decimal PriceAmount { get; init; }
    public string CurrencyCode { get; init; } = "VND";
}

public sealed class MentorBookingDetailForMentorResponse
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string CandidateName { get; init; } = string.Empty;
    public string? CandidateEmail { get; init; }
    public string? CandidateAvatarUrl { get; init; }
    public Guid MentorId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime ScheduledStartsAt { get; init; }
    public DateTime ScheduledEndsAt { get; init; }
    public string ServiceType { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string CurrencyCode { get; init; } = "VND";
    public string? MeetingUrl { get; init; }
    public string? CandidateNotes { get; init; }
    public string? CancelReason { get; init; }
    public DateTime? CancelledAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public ReviewResponse? Review { get; init; }
}

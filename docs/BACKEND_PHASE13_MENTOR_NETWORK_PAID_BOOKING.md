# Phase 13: Paid Mentor / Network / Online Booking MVP Documentation

This document describes the design, implementation, and API specification for the Paid Mentor Network and Online Booking MVP.

---

## 1. Overview
The Paid Mentor Network allows candidate users to:
1. Browse and filter available mentors/experts.
2. View detailed mentor profiles, specialty codes, and future availability slots.
3. Reserve a slot, generate a mock checkout session (`Purpose = "mentor_booking"`), and book the slot.
4. Update the booking to `confirmed` automatically once the checkout session is successfully simulated (`SimulatePaymentSuccess`).
5. Cancel a booking (releases the slot back to `available` if in the future, cancels any pending checkout session).
6. Complete a booking (simulate meeting conclusion).
7. Submit a rating (1-5 stars) and review comment once the booking is `completed`.

---

## 2. Database Schema
The schema consists of five main entities configured under the `app` schema:

1. **`MentorProfile`**
   - Represents the mentor's identity, headline, bio, experience, and running rating average/count.
   - Relation: Many-to-Many with `MentorSpecialty`, One-to-Many with `MentorAvailabilitySlot` and `MentorBooking`.

2. **`MentorSpecialty`**
   - Pre-defined categories of mentorship expertise (e.g. ATS CV Optimization, Mock Interview).

3. **`MentorAvailabilitySlot`**
   - Individual 45-minute blocks of time offered by a mentor.
   - Statuses: `available`, `reserved` (during checkout), `booked`, `blocked`, `expired`.
   - `ReservedUntil`: Lock expiration timestamp.

4. **`MentorBooking`**
   - Represents a candidate's booking.
   - Statuses: `pending_payment`, `confirmed`, `cancelled`, `completed`, `payment_failed`, `payment_cancelled`, `payment_expired`, `no_show`.
   - Includes details such as scheduled times, service type, amount, currency code, mock meeting URL, notes, and cancel reason.

5. **`MentorReview`**
   - Rating and comments left by candidates on completed bookings.
   - Automatically recalculates the mentor's `RatingAverage` and `RatingCount` upon submission.

---

## 3. Configuration (`MentorNetworkOptions`)
Registered under the key `"MentorNetwork"` in `appsettings.json`:
- `Enabled`: Flag to toggle the feature.
- `MockMeetingBaseUrl`: Base URL for generated mock meeting links (format: `{MockMeetingBaseUrl}/{bookingId}/join`).
- `DefaultSlotDurationMinutes`: Default slot size (typically 45 minutes).
- `EnableSeedData`: Set `true` to seed the database with the default 6 mentors and 5 specialties on startup.

```json
"MentorNetwork": {
  "Enabled": true,
  "MockMeetingBaseUrl": "http://localhost:3000/mentor-bookings",
  "DefaultSlotDurationMinutes": 45,
  "EnableSeedData": true
}
```

---

## 4. API Endpoints

### Mentor Directory
- **`GET /api/v1/mentors`**
  - Query parameters: `specialty` (code), `serviceType`, `rating` (minimum), `search` (name/headline/bio), `page`, `pageSize`.
  - Returns paginated list of active mentors.
- **`GET /api/v1/mentors/{id}`**
  - Returns detailed profile for a single mentor including future available slots.
- **`GET /api/v1/mentors/{id}/availability`**
  - Returns future available slots for the mentor.

### Bookings & Billing Integration
- **`POST /api/v1/mentor-bookings`**
  - Body: `{ "slotId": "guid", "serviceType": "cv_review|mock_interview|career_coaching|technical_mentoring", "candidateNotes": "string" }`
  - Reserves the availability slot and returns a `BookMentorResponse` containing:
    - `bookingId`
    - `checkoutSessionId`
    - `checkoutUrl` (points to standard frontend mock checkout page)
    - `paymentInstructionsUrl` (GET API instruction endpoint)
- **`GET /api/v1/mentor-bookings`**
  - Lists the current user's bookings with payment session summaries and review details.
- **`GET /api/v1/mentor-bookings/{id}`**
  - Retrieves detailed booking information.
- **`POST /api/v1/mentor-bookings/{id}/cancel`**
  - Body: `{ "reason": "Reason details" }`
  - Cancels a `pending_payment` or `confirmed` (in the future) booking.
  - Reverts the slot back to `available` and cancels any associated pending checkout session.
- **`POST /api/v1/mentor-bookings/{id}/simulate-complete`**
  - Moves a `confirmed` booking status to `completed`.
- **`POST /api/v1/mentor-bookings/{id}/review`**
  - Body: `{ "rating": 5, "comment": "Excellent session!" }`
  - Submits a review for a `completed` booking and updates the mentor's aggregate ratings.

---

## 5. In-App Notifications
The system emits the following in-app notifications respecting user preferences:
- `mentor.booking_confirmed` (on successful payment confirmation)
- `mentor.booking_cancelled` (on booking cancellation by user or due to checkout expiry/cancellation)
- `mentor.booking_completed` (on booking completion)
- `mentor.review_submitted` (on review submission)

---

## 6. Verification Plan

### Database verification
1. The migrations have been successfully applied to the database.
2. When the application starts up, `DbSeeder` seeds the 6 mentors, 5 specialties, and availability slots if `EnableSeedData` is true.

### Manual API Testing Flows
1. **Search Mentors**:
   - `GET /api/v1/mentors?search=Nguyen` should return mentor "Nguyen Van A".
2. **Retrieve Details & Slots**:
   - `GET /api/v1/mentors/{id}` should display specialties and future slots.
3. **Initiate Booking**:
   - `POST /api/v1/mentor-bookings` with a valid `slotId` will return the `checkoutUrl` and `bookingId`.
4. **Complete Checkout (Simulation)**:
   - Call `POST /api/v1/billing/checkout-sessions/{sessionId}/simulate-success`.
   - Verify the booking status transitions to `confirmed`, the meeting URL is generated, and a receipt email is sent to the user.
5. **Simulate Cancel Checkout (Simulation)**:
   - Call `POST /api/v1/billing/checkout-sessions/{sessionId}/simulate-cancelled` or `simulate-failed`.
   - Verify the booking status transitions to `payment_cancelled` / `payment_failed` and the availability slot is released back to `available`.
6. **Submit Reviews**:
   - Call `POST /api/v1/mentor-bookings/{id}/simulate-complete` to move the status to `completed`.
   - Call `POST /api/v1/mentor-bookings/{id}/review` with rating/comment. Verify that the mentor's aggregate rating changes accordingly.

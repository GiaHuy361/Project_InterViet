-- =====================================================
-- INTER-VIET - Candidate Database Schema (SQL Server)
-- Nền tảng Cố vấn Sự nghiệp AI cho Người Việt
-- =====================================================

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE Users (
    UserId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    FullName NVARCHAR(200) NOT NULL,
    PhoneNumber NVARCHAR(20),

    -- User Status
    UserStatus NVARCHAR(20) NOT NULL DEFAULT 'visitor', -- visitor, free, trial, premium, expired, cancelled, suspended

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME2,
    EmailVerifiedAt DATETIME2,

    -- Security
    IsEmailVerified BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,

    INDEX IX_Users_Email (Email),
    INDEX IX_Users_UserStatus (UserStatus),
    INDEX IX_Users_CreatedAt (CreatedAt)
);

CREATE TABLE UserSessions (
    SessionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    RefreshToken NVARCHAR(500) NOT NULL,
    DeviceInfo NVARCHAR(500),
    IpAddress NVARCHAR(50),
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_UserSessions_UserId (UserId),
    INDEX IX_UserSessions_RefreshToken (RefreshToken)
);

-- =====================================================
-- 2. USER PROFILES
-- =====================================================

CREATE TABLE CandidateProfiles (
    ProfileId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL UNIQUE,

    -- Basic Info
    DateOfBirth DATE,
    Gender NVARCHAR(20), -- Nam, Nữ, Khác
    ProfilePictureUrl NVARCHAR(1000),

    -- Location
    City NVARCHAR(100),
    District NVARCHAR(100),
    Address NVARCHAR(500),

    -- Professional Info
    CurrentTitle NVARCHAR(200),
    YearsOfExperience INT,
    EducationLevel NVARCHAR(100), -- Trung học, Trung cấp, Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ

    -- Career Preferences
    DesiredJobTitle NVARCHAR(200),
    DesiredIndustries NVARCHAR(MAX), -- JSON array
    DesiredSalaryMin DECIMAL(18,0),
    DesiredSalaryMax DECIMAL(18,0),
    DesiredWorkType NVARCHAR(50), -- Full-time, Part-time, Remote, Hybrid
    IsOpenToRelocation BIT DEFAULT 0,

    -- Social Links
    LinkedInUrl NVARCHAR(500),
    GithubUrl NVARCHAR(500),
    WebsiteUrl NVARCHAR(500),

    -- Bio
    Bio NVARCHAR(2000),

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_CandidateProfiles_UserId (UserId)
);

CREATE TABLE Skills (
    SkillId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    SkillName NVARCHAR(200) NOT NULL,
    SkillCategory NVARCHAR(100), -- Technical, Soft Skills, Languages, Tools
    ProficiencyLevel NVARCHAR(50), -- Beginner, Intermediate, Advanced, Expert
    YearsOfExperience INT,

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_Skills_UserId (UserId),
    INDEX IX_Skills_SkillName (SkillName)
);

CREATE TABLE WorkExperiences (
    ExperienceId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    CompanyName NVARCHAR(300) NOT NULL,
    JobTitle NVARCHAR(200) NOT NULL,
    Industry NVARCHAR(100),

    StartDate DATE NOT NULL,
    EndDate DATE, -- NULL if current job
    IsCurrent BIT NOT NULL DEFAULT 0,

    Description NVARCHAR(MAX),
    Achievements NVARCHAR(MAX), -- JSON array
    Technologies NVARCHAR(MAX), -- JSON array

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_WorkExperiences_UserId (UserId)
);

CREATE TABLE Educations (
    EducationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    Institution NVARCHAR(300) NOT NULL,
    Degree NVARCHAR(200) NOT NULL,
    FieldOfStudy NVARCHAR(200),

    StartDate DATE NOT NULL,
    EndDate DATE,
    IsCurrent BIT NOT NULL DEFAULT 0,

    GPA DECIMAL(3,2),
    Achievements NVARCHAR(MAX),

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_Educations_UserId (UserId)
);

CREATE TABLE Certifications (
    CertificationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    CertificationName NVARCHAR(300) NOT NULL,
    IssuingOrganization NVARCHAR(300) NOT NULL,
    IssueDate DATE NOT NULL,
    ExpiryDate DATE,
    CredentialId NVARCHAR(200),
    CredentialUrl NVARCHAR(1000),

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_Certifications_UserId (UserId)
);

-- =====================================================
-- 3. CVs & DOCUMENTS
-- =====================================================

CREATE TABLE CVs (
    CVId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    CVName NVARCHAR(300) NOT NULL,
    OriginalFileName NVARCHAR(500),
    FileUrl NVARCHAR(1000) NOT NULL,
    FileSize BIGINT, -- bytes
    FileType NVARCHAR(50), -- PDF, DOCX

    -- CV Content (extracted text)
    ExtractedText NVARCHAR(MAX),

    -- CV Metadata
    IsDefaultCV BIT NOT NULL DEFAULT 0,
    TemplateId UNIQUEIDENTIFIER, -- if using INTER-VIET template

    -- AI Analysis
    LastAnalyzedAt DATETIME2,
    AnalysisScore DECIMAL(5,2), -- 0-100
    AnalysisData NVARCHAR(MAX), -- JSON: strengths, weaknesses, suggestions

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_CVs_UserId (UserId),
    INDEX IX_CVs_IsDefaultCV (IsDefaultCV)
);

CREATE TABLE CVTemplates (
    TemplateId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    TemplateName NVARCHAR(200) NOT NULL,
    TemplateCategory NVARCHAR(100), -- Professional, Creative, Minimal, Modern
    PreviewImageUrl NVARCHAR(1000),
    TemplateJson NVARCHAR(MAX) NOT NULL, -- JSON structure

    IsActive BIT NOT NULL DEFAULT 1,
    IsPremium BIT NOT NULL DEFAULT 0, -- Only for premium users

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- 4. JOB DESCRIPTIONS & MATCHING
-- =====================================================

CREATE TABLE JobDescriptions (
    JDId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    JobTitle NVARCHAR(300) NOT NULL,
    CompanyName NVARCHAR(300),

    -- JD Content
    Description NVARCHAR(MAX) NOT NULL,
    Requirements NVARCHAR(MAX),
    Benefits NVARCHAR(MAX),

    -- Job Details
    Industry NVARCHAR(100),
    JobLevel NVARCHAR(100), -- Intern, Junior, Middle, Senior, Lead, Manager
    JobType NVARCHAR(50), -- Full-time, Part-time, Contract, Freelance
    WorkMode NVARCHAR(50), -- Onsite, Remote, Hybrid

    -- Salary
    SalaryMin DECIMAL(18,0),
    SalaryMax DECIMAL(18,0),
    SalaryCurrency NVARCHAR(10) DEFAULT 'VND',

    -- Location
    City NVARCHAR(100),
    District NVARCHAR(100),
    Address NVARCHAR(500),

    -- Source
    SourceUrl NVARCHAR(1000), -- if imported from job board
    SourcePlatform NVARCHAR(100), -- LinkedIn, VietnamWorks, etc.

    -- Status
    Status NVARCHAR(50) NOT NULL DEFAULT 'active', -- active, archived, applied

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_JobDescriptions_UserId (UserId),
    INDEX IX_JobDescriptions_Status (Status)
);

CREATE TABLE CVJDMatchings (
    MatchingId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    CVId UNIQUEIDENTIFIER NOT NULL,
    JDId UNIQUEIDENTIFIER NOT NULL,

    -- Matching Results
    MatchScore DECIMAL(5,2) NOT NULL, -- 0-100
    MatchLevel NVARCHAR(50), -- Excellent (80-100), Good (60-79), Fair (40-59), Poor (0-39)

    -- Detailed Analysis
    MatchedSkills NVARCHAR(MAX), -- JSON array
    MissingSkills NVARCHAR(MAX), -- JSON array
    MatchedExperiences NVARCHAR(MAX), -- JSON array
    MatchedEducation NVARCHAR(MAX), -- JSON array

    -- AI Recommendations
    Recommendations NVARCHAR(MAX), -- JSON: suggestions to improve match
    StrengthAreas NVARCHAR(MAX), -- JSON array
    WeaknessAreas NVARCHAR(MAX), -- JSON array

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (CVId) REFERENCES CVs(CVId) ON DELETE NO ACTION,
    FOREIGN KEY (JDId) REFERENCES JobDescriptions(JDId) ON DELETE NO ACTION,
    INDEX IX_CVJDMatchings_UserId (UserId),
    INDEX IX_CVJDMatchings_CVId (CVId),
    INDEX IX_CVJDMatchings_JDId (JDId),
    INDEX IX_CVJDMatchings_MatchScore (MatchScore)
);

CREATE TABLE MultiJDMatchings (
    MultiMatchingId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    CVId UNIQUEIDENTIFIER NOT NULL,

    MatchingName NVARCHAR(300) NOT NULL,
    TotalJDs INT NOT NULL,

    -- Overall Results
    BestMatchJDId UNIQUEIDENTIFIER,
    BestMatchScore DECIMAL(5,2),
    AverageScore DECIMAL(5,2),

    -- Detailed Results (JSON array of all JD matches)
    MatchingResults NVARCHAR(MAX),

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (CVId) REFERENCES CVs(CVId) ON DELETE NO ACTION,
    INDEX IX_MultiJDMatchings_UserId (UserId)
);

-- =====================================================
-- 5. AI INTERVIEW PRACTICE
-- =====================================================

CREATE TABLE InterviewSessions (
    SessionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    JDId UNIQUEIDENTIFIER, -- Optional: practice for specific JD

    SessionType NVARCHAR(50) NOT NULL, -- behavioral, technical, case-study, general
    InterviewLevel NVARCHAR(50), -- junior, mid, senior
    Industry NVARCHAR(100),
    JobTitle NVARCHAR(200),

    -- Session Status
    Status NVARCHAR(50) NOT NULL DEFAULT 'in-progress', -- in-progress, completed, abandoned

    -- Duration
    StartedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CompletedAt DATETIME2,
    DurationSeconds INT,

    -- Overall Evaluation
    OverallScore DECIMAL(5,2), -- 0-100
    OverallFeedback NVARCHAR(MAX),

    -- AI Evaluations
    CommunicationScore DECIMAL(5,2),
    TechnicalScore DECIMAL(5,2),
    ProblemSolvingScore DECIMAL(5,2),
    ConfidenceScore DECIMAL(5,2),

    -- Recommendations
    StrengthAreas NVARCHAR(MAX), -- JSON array
    ImprovementAreas NVARCHAR(MAX), -- JSON array
    ActionableAdvice NVARCHAR(MAX), -- JSON array

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (JDId) REFERENCES JobDescriptions(JDId) ON DELETE SET NULL,
    INDEX IX_InterviewSessions_UserId (UserId),
    INDEX IX_InterviewSessions_Status (Status)
);

CREATE TABLE InterviewQuestions (
    QuestionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SessionId UNIQUEIDENTIFIER NOT NULL,

    QuestionNumber INT NOT NULL,
    QuestionType NVARCHAR(50), -- behavioral, technical, situational
    QuestionText NVARCHAR(MAX) NOT NULL,

    -- AI-generated question context
    ExpectedAnswerPoints NVARCHAR(MAX), -- JSON array
    Difficulty NVARCHAR(50), -- easy, medium, hard

    AskedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (SessionId) REFERENCES InterviewSessions(SessionId) ON DELETE CASCADE,
    INDEX IX_InterviewQuestions_SessionId (SessionId)
);

CREATE TABLE InterviewAnswers (
    AnswerId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    QuestionId UNIQUEIDENTIFIER NOT NULL,

    -- Answer Content
    AnswerText NVARCHAR(MAX), -- transcribed text
    AudioFileUrl NVARCHAR(1000), -- recorded voice answer
    AudioDurationSeconds INT,

    -- AI Evaluation
    AnswerScore DECIMAL(5,2), -- 0-100
    Feedback NVARCHAR(MAX),

    -- Detailed Scores
    ClarityScore DECIMAL(5,2),
    RelevanceScore DECIMAL(5,2),
    CompletenessScore DECIMAL(5,2),

    -- Analysis
    PositivePoints NVARCHAR(MAX), -- JSON array
    NegativePoints NVARCHAR(MAX), -- JSON array
    Suggestions NVARCHAR(MAX), -- JSON array

    AnsweredAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (QuestionId) REFERENCES InterviewQuestions(QuestionId) ON DELETE CASCADE,
    INDEX IX_InterviewAnswers_QuestionId (QuestionId)
);

-- =====================================================
-- 6. SUBSCRIPTIONS & BILLING
-- =====================================================

CREATE TABLE SubscriptionPlans (
    PlanId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    PlanCode NVARCHAR(50) NOT NULL UNIQUE, -- FREE, MONTHLY, QUARTERLY, YEARLY
    PlanName NVARCHAR(200) NOT NULL, -- Gói Miễn phí, Gói Tháng, Gói Quý, Gói Năm
    PlanNameEn NVARCHAR(200),

    -- Pricing
    Price DECIMAL(18,0) NOT NULL, -- VND
    BillingCycle NVARCHAR(50), -- monthly, quarterly, yearly, lifetime
    PricePerMonth DECIMAL(18,0), -- for display (e.g., 129k/tháng for Quarterly)

    -- Trial
    HasTrial BIT NOT NULL DEFAULT 0,
    TrialDays INT DEFAULT 0, -- 7 days only for YEARLY

    -- Feature Limits (JSON)
    CVAnalysisLimit INT, -- -1 = unlimited
    JDMatchingLimit INT,
    MultiJDLimit INT, -- số JD per matching
    InterviewSessionsLimit INT,
    InterviewMinutesLimit INT,
    CVStorageLimit INT,
    CVTemplatesAccess BIT DEFAULT 0,
    PrioritySupport BIT DEFAULT 0,

    -- Status
    IsActive BIT NOT NULL DEFAULT 1,
    DisplayOrder INT NOT NULL DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Insert default plans
INSERT INTO SubscriptionPlans (PlanCode, PlanName, Price, BillingCycle, PricePerMonth, HasTrial, TrialDays,
    CVAnalysisLimit, JDMatchingLimit, MultiJDLimit, InterviewSessionsLimit, InterviewMinutesLimit,
    CVStorageLimit, CVTemplatesAccess, PrioritySupport, DisplayOrder)
VALUES
    ('FREE', N'Gói Miễn phí', 0, 'lifetime', 0, 0, 0,
    3, 5, 3, 1, 30,
    1, 0, 0, 1),

    ('MONTHLY', N'Gói Tháng', 149000, 'monthly', 149000, 0, 0,
    20, 50, 10, 10, 300,
    5, 1, 0, 2),

    ('QUARTERLY', N'Gói Quý', 387000, 'quarterly', 129000, 0, 0,
    60, 150, 15, 30, 900,
    10, 1, 1, 3),

    ('YEARLY', N'Gói Năm', 1308000, 'yearly', 109000, 1, 7,
    -1, -1, 20, -1, -1,
    -1, 1, 1, 4);

CREATE TABLE Subscriptions (
    SubscriptionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    PlanId UNIQUEIDENTIFIER NOT NULL,

    -- Subscription Status
    Status NVARCHAR(50) NOT NULL DEFAULT 'active', -- trial, active, expired, cancelled, suspended

    -- Trial Info
    IsTrialPeriod BIT NOT NULL DEFAULT 0,
    TrialStartDate DATETIME2,
    TrialEndDate DATETIME2,

    -- Subscription Period
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2, -- NULL for lifetime/free plans
    NextBillingDate DATETIME2,

    -- Payment
    AutoRenew BIT NOT NULL DEFAULT 1,
    LastPaymentId UNIQUEIDENTIFIER,

    -- Cancellation
    CancelledAt DATETIME2,
    CancellationReason NVARCHAR(1000),

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (PlanId) REFERENCES SubscriptionPlans(PlanId),
    INDEX IX_Subscriptions_UserId (UserId),
    INDEX IX_Subscriptions_Status (Status),
    INDEX IX_Subscriptions_EndDate (EndDate)
);

CREATE TABLE UsageTracking (
    UsageId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    SubscriptionId UNIQUEIDENTIFIER,

    -- Tracking Period
    PeriodStartDate DATETIME2 NOT NULL,
    PeriodEndDate DATETIME2 NOT NULL,

    -- Feature Usage Counters
    CVAnalysisUsed INT NOT NULL DEFAULT 0,
    JDMatchingUsed INT NOT NULL DEFAULT 0,
    MultiJDUsed INT NOT NULL DEFAULT 0,
    InterviewSessionsUsed INT NOT NULL DEFAULT 0,
    InterviewMinutesUsed INT NOT NULL DEFAULT 0,
    CVStorageUsed INT NOT NULL DEFAULT 0,

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (SubscriptionId) REFERENCES Subscriptions(SubscriptionId) ON DELETE SET NULL,
    INDEX IX_UsageTracking_UserId (UserId),
    INDEX IX_UsageTracking_Period (PeriodStartDate, PeriodEndDate)
);

-- =====================================================
-- 7. PAYMENTS
-- =====================================================

CREATE TABLE Payments (
    PaymentId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    SubscriptionId UNIQUEIDENTIFIER,

    -- Payment Details
    Amount DECIMAL(18,0) NOT NULL,
    Currency NVARCHAR(10) NOT NULL DEFAULT 'VND',

    -- Payment Method
    PaymentMethod NVARCHAR(50) NOT NULL, -- vnpay, momo, credit-card, bank-transfer
    PaymentGateway NVARCHAR(50), -- vnpay, momo, stripe

    -- Transaction Info
    TransactionId NVARCHAR(200) UNIQUE, -- from payment gateway
    OrderId NVARCHAR(200) NOT NULL UNIQUE, -- internal order ID

    -- Status
    Status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, refunded

    -- Payment Gateway Response
    GatewayResponse NVARCHAR(MAX), -- JSON response from gateway

    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ProcessedAt DATETIME2,
    CompletedAt DATETIME2,
    FailedAt DATETIME2,

    -- Failure Info
    FailureReason NVARCHAR(1000),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (SubscriptionId) REFERENCES Subscriptions(SubscriptionId) ON DELETE SET NULL,
    INDEX IX_Payments_UserId (UserId),
    INDEX IX_Payments_Status (Status),
    INDEX IX_Payments_TransactionId (TransactionId),
    INDEX IX_Payments_OrderId (OrderId)
);

CREATE TABLE PaymentMethods (
    PaymentMethodId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    MethodType NVARCHAR(50) NOT NULL, -- credit-card, bank-account

    -- Card Info (tokenized)
    CardToken NVARCHAR(500), -- from payment gateway
    CardLast4 NVARCHAR(4),
    CardBrand NVARCHAR(50), -- Visa, Mastercard
    CardExpiryMonth INT,
    CardExpiryYear INT,

    -- Bank Info
    BankName NVARCHAR(200),
    BankAccountNumber NVARCHAR(100), -- encrypted

    IsDefault BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_PaymentMethods_UserId (UserId)
);

CREATE TABLE Invoices (
    InvoiceId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PaymentId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,

    InvoiceNumber NVARCHAR(100) NOT NULL UNIQUE,

    -- Invoice Details
    SubtotalAmount DECIMAL(18,0) NOT NULL,
    TaxAmount DECIMAL(18,0) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18,0) NOT NULL,

    -- Billing Info
    BillingName NVARCHAR(300),
    BillingEmail NVARCHAR(255),
    BillingPhone NVARCHAR(20),
    BillingAddress NVARCHAR(500),
    TaxCode NVARCHAR(50), -- Mã số thuế

    -- Invoice File
    InvoicePdfUrl NVARCHAR(1000),

    -- Timestamps
    IssuedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    DueDate DATETIME2,

    FOREIGN KEY (PaymentId) REFERENCES Payments(PaymentId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    INDEX IX_Invoices_UserId (UserId),
    INDEX IX_Invoices_InvoiceNumber (InvoiceNumber)
);

-- =====================================================
-- 8. NOTIFICATIONS & ACTIVITIES
-- =====================================================

CREATE TABLE Notifications (
    NotificationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    NotificationType NVARCHAR(50) NOT NULL, -- subscription, payment, feature, system
    Title NVARCHAR(300) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,

    ActionUrl NVARCHAR(1000),

    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME2,

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_Notifications_UserId (UserId),
    INDEX IX_Notifications_IsRead (IsRead)
);

CREATE TABLE ActivityLogs (
    ActivityId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    ActivityType NVARCHAR(100) NOT NULL, -- cv-upload, jd-match, interview-session, payment, etc.
    ActivityDescription NVARCHAR(500),

    RelatedEntityType NVARCHAR(100), -- CV, JD, Interview, Payment
    RelatedEntityId UNIQUEIDENTIFIER,

    Metadata NVARCHAR(MAX), -- JSON

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_ActivityLogs_UserId (UserId),
    INDEX IX_ActivityLogs_ActivityType (ActivityType),
    INDEX IX_ActivityLogs_CreatedAt (CreatedAt)
);

-- =====================================================
-- 9. SUPPORT & FEEDBACK
-- =====================================================

CREATE TABLE SupportTickets (
    TicketId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,

    TicketNumber NVARCHAR(50) NOT NULL UNIQUE,
    Subject NVARCHAR(500) NOT NULL,
    Category NVARCHAR(100), -- technical, billing, feature-request, bug-report
    Priority NVARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent

    Status NVARCHAR(50) NOT NULL DEFAULT 'open', -- open, in-progress, waiting-response, resolved, closed

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ResolvedAt DATETIME2,
    ClosedAt DATETIME2,

    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    INDEX IX_SupportTickets_UserId (UserId),
    INDEX IX_SupportTickets_Status (Status)
);

CREATE TABLE SupportMessages (
    MessageId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TicketId UNIQUEIDENTIFIER NOT NULL,

    SenderId UNIQUEIDENTIFIER, -- UserId or NULL if from support staff
    SenderType NVARCHAR(50) NOT NULL, -- user, support-staff, system

    MessageContent NVARCHAR(MAX) NOT NULL,
    Attachments NVARCHAR(MAX), -- JSON array of file URLs

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    FOREIGN KEY (TicketId) REFERENCES SupportTickets(TicketId) ON DELETE CASCADE,
    INDEX IX_SupportMessages_TicketId (TicketId)
);

-- =====================================================
-- 10. SYSTEM TABLES
-- =====================================================

CREATE TABLE SystemSettings (
    SettingId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SettingKey NVARCHAR(200) NOT NULL UNIQUE,
    SettingValue NVARCHAR(MAX),
    SettingType NVARCHAR(50), -- string, number, boolean, json
    Description NVARCHAR(1000),

    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    INDEX IX_SystemSettings_SettingKey (SettingKey)
);

CREATE TABLE AuditLogs (
    AuditId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    TableName NVARCHAR(200) NOT NULL,
    RecordId UNIQUEIDENTIFIER NOT NULL,

    Action NVARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE

    UserId UNIQUEIDENTIFIER,
    UserEmail NVARCHAR(255),

    OldValues NVARCHAR(MAX), -- JSON
    NewValues NVARCHAR(MAX), -- JSON

    IpAddress NVARCHAR(50),
    UserAgent NVARCHAR(1000),

    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    INDEX IX_AuditLogs_TableName (TableName),
    INDEX IX_AuditLogs_RecordId (RecordId),
    INDEX IX_AuditLogs_UserId (UserId),
    INDEX IX_AuditLogs_CreatedAt (CreatedAt)
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Example trigger for Users table (repeat for other tables with UpdatedAt)
GO
CREATE TRIGGER TR_Users_UpdatedAt
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET UpdatedAt = GETUTCDATE()
    FROM Users u
    INNER JOIN inserted i ON u.UserId = i.UserId;
END;
GO

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Check if user can use feature based on subscription limits
GO
CREATE PROCEDURE sp_CheckFeatureLimit
    @UserId UNIQUEIDENTIFIER,
    @FeatureName NVARCHAR(50), -- cv-analysis, jd-matching, interview-session
    @CanUse BIT OUTPUT,
    @RemainingCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @PlanId UNIQUEIDENTIFIER;
    DECLARE @FeatureLimit INT;
    DECLARE @FeatureUsed INT;

    -- Get active subscription
    SELECT TOP 1 @PlanId = s.PlanId
    FROM Subscriptions s
    WHERE s.UserId = @UserId
        AND s.Status IN ('active', 'trial')
        AND (s.EndDate IS NULL OR s.EndDate > GETUTCDATE())
    ORDER BY s.CreatedAt DESC;

    IF @PlanId IS NULL
    BEGIN
        SET @CanUse = 0;
        SET @RemainingCount = 0;
        RETURN;
    END

    -- Get feature limit from plan
    SELECT @FeatureLimit = CASE @FeatureName
        WHEN 'cv-analysis' THEN CVAnalysisLimit
        WHEN 'jd-matching' THEN JDMatchingLimit
        WHEN 'interview-session' THEN InterviewSessionsLimit
        ELSE 0
    END
    FROM SubscriptionPlans
    WHERE PlanId = @PlanId;

    -- -1 means unlimited
    IF @FeatureLimit = -1
    BEGIN
        SET @CanUse = 1;
        SET @RemainingCount = -1;
        RETURN;
    END

    -- Get current usage
    SELECT TOP 1 @FeatureUsed = CASE @FeatureName
        WHEN 'cv-analysis' THEN CVAnalysisUsed
        WHEN 'jd-matching' THEN JDMatchingUsed
        WHEN 'interview-session' THEN InterviewSessionsUsed
        ELSE 0
    END
    FROM UsageTracking
    WHERE UserId = @UserId
        AND GETUTCDATE() BETWEEN PeriodStartDate AND PeriodEndDate
    ORDER BY CreatedAt DESC;

    SET @FeatureUsed = ISNULL(@FeatureUsed, 0);

    -- Check if can use
    IF @FeatureUsed < @FeatureLimit
    BEGIN
        SET @CanUse = 1;
        SET @RemainingCount = @FeatureLimit - @FeatureUsed;
    END
    ELSE
    BEGIN
        SET @CanUse = 0;
        SET @RemainingCount = 0;
    END
END;
GO

-- =====================================================
-- VIEWS
-- =====================================================

-- Active users with subscription info
GO
CREATE VIEW vw_ActiveUsers AS
SELECT
    u.UserId,
    u.Email,
    u.FullName,
    u.UserStatus,
    s.SubscriptionId,
    sp.PlanCode,
    sp.PlanName,
    s.Status AS SubscriptionStatus,
    s.StartDate AS SubscriptionStartDate,
    s.EndDate AS SubscriptionEndDate,
    s.IsTrialPeriod,
    u.CreatedAt AS UserCreatedAt,
    u.LastLoginAt
FROM Users u
LEFT JOIN Subscriptions s ON u.UserId = s.UserId
    AND s.Status IN ('active', 'trial')
    AND (s.EndDate IS NULL OR s.EndDate > GETUTCDATE())
LEFT JOIN SubscriptionPlans sp ON s.PlanId = sp.PlanId
WHERE u.IsActive = 1;
GO

-- User dashboard summary
GO
CREATE VIEW vw_UserDashboard AS
SELECT
    u.UserId,
    u.FullName,
    u.Email,
    COUNT(DISTINCT cv.CVId) AS TotalCVs,
    COUNT(DISTINCT jd.JDId) AS TotalJDs,
    COUNT(DISTINCT m.MatchingId) AS TotalMatches,
    COUNT(DISTINCT i.SessionId) AS TotalInterviews,
    MAX(m.MatchScore) AS BestMatchScore,
    AVG(i.OverallScore) AS AvgInterviewScore
FROM Users u
LEFT JOIN CVs cv ON u.UserId = cv.UserId
LEFT JOIN JobDescriptions jd ON u.UserId = jd.UserId
LEFT JOIN CVJDMatchings m ON u.UserId = m.UserId
LEFT JOIN InterviewSessions i ON u.UserId = i.UserId AND i.Status = 'completed'
WHERE u.IsActive = 1
GROUP BY u.UserId, u.FullName, u.Email;
GO

-- =====================================================
-- END OF SCHEMA
-- =====================================================

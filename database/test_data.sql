-- =====================================================
-- INTER-VIET - Test Data
-- Sample data for development and testing
-- =====================================================

USE INTERVIET_DB;
GO

-- =====================================================
-- 1. TEST USERS
-- =====================================================

-- Password for all test users: "Password123!"
-- Hash using bcrypt: $2a$11$XYZ... (you need to generate real hashes in C#)

DECLARE @FreeUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @TrialUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @MonthlyUserId UNIQUEIDENTIFIER = NEWID();
DECLARE @YearlyUserId UNIQUEIDENTIFIER = NEWID();

INSERT INTO Users (UserId, Email, PasswordHash, FullName, PhoneNumber, UserStatus, IsEmailVerified, IsActive, EmailVerifiedAt, LastLoginAt)
VALUES
    (@FreeUserId, 'nguyen.vana@gmail.com', '$2a$11$PLACEHOLDER_HASH_1', N'Nguyễn Văn A', '0901234567', 'free', 1, 1, GETUTCDATE(), GETUTCDATE()),
    (@TrialUserId, 'tran.thib@gmail.com', '$2a$11$PLACEHOLDER_HASH_2', N'Trần Thị B', '0912345678', 'trial', 1, 1, GETUTCDATE(), GETUTCDATE()),
    (@MonthlyUserId, 'le.vanc@gmail.com', '$2a$11$PLACEHOLDER_HASH_3', N'Lê Văn C', '0923456789', 'premium', 1, 1, GETUTCDATE(), GETUTCDATE()),
    (@YearlyUserId, 'pham.thid@gmail.com', '$2a$11$PLACEHOLDER_HASH_4', N'Phạm Thị D', '0934567890', 'premium', 1, 1, GETUTCDATE(), GETUTCDATE());

-- =====================================================
-- 2. CANDIDATE PROFILES
-- =====================================================

INSERT INTO CandidateProfiles (ProfileId, UserId, DateOfBirth, Gender, City, District, CurrentTitle, YearsOfExperience, EducationLevel,
    DesiredJobTitle, DesiredSalaryMin, DesiredSalaryMax, DesiredWorkType, Bio)
VALUES
    (NEWID(), @FreeUserId, '1995-05-15', N'Nam', N'Hà Nội', N'Cầu Giấy', N'Junior Backend Developer', 2, N'Đại học',
     N'Backend Developer', 15000000, 20000000, 'Full-time', N'Lập trình viên backend với 2 năm kinh nghiệm C# và .NET'),

    (NEWID(), @TrialUserId, '1993-08-20', N'Nữ', N'Hồ Chí Minh', N'Quận 1', N'Senior Frontend Developer', 5, N'Đại học',
     N'Tech Lead Frontend', 30000000, 40000000, 'Hybrid', N'Frontend developer chuyên React với 5+ năm kinh nghiệm'),

    (NEWID(), @MonthlyUserId, '1990-03-10', N'Nam', N'Đà Nẵng', N'Hải Châu', N'Data Scientist', 6, N'Thạc sĩ',
     N'Senior Data Scientist', 35000000, 50000000, 'Remote', N'Data scientist chuyên ML/AI và Python'),

    (NEWID(), @YearlyUserId, '1992-11-25', N'Nữ', N'Hà Nội', N'Hoàn Kiếm', N'Product Manager', 7, N'Đại học',
     N'Senior Product Manager', 40000000, 60000000, 'Hybrid', N'Product Manager với kinh nghiệm fintech và e-commerce');

-- =====================================================
-- 3. SKILLS
-- =====================================================

INSERT INTO Skills (SkillId, UserId, SkillName, SkillCategory, ProficiencyLevel, YearsOfExperience)
VALUES
    -- User A (Free)
    (NEWID(), @FreeUserId, 'C#', 'Technical', 'Intermediate', 2),
    (NEWID(), @FreeUserId, 'ASP.NET Core', 'Technical', 'Intermediate', 2),
    (NEWID(), @FreeUserId, 'SQL Server', 'Technical', 'Intermediate', 2),
    (NEWID(), @FreeUserId, 'Git', 'Tools', 'Intermediate', 2),

    -- User B (Trial)
    (NEWID(), @TrialUserId, 'React', 'Technical', 'Expert', 5),
    (NEWID(), @TrialUserId, 'TypeScript', 'Technical', 'Advanced', 4),
    (NEWID(), @TrialUserId, 'JavaScript', 'Technical', 'Expert', 5),
    (NEWID(), @TrialUserId, 'CSS/SCSS', 'Technical', 'Advanced', 5),
    (NEWID(), @TrialUserId, 'Tailwind CSS', 'Technical', 'Advanced', 3),

    -- User C (Monthly)
    (NEWID(), @MonthlyUserId, 'Python', 'Technical', 'Expert', 6),
    (NEWID(), @MonthlyUserId, 'Machine Learning', 'Technical', 'Advanced', 5),
    (NEWID(), @MonthlyUserId, 'TensorFlow', 'Technical', 'Advanced', 4),
    (NEWID(), @MonthlyUserId, 'Pandas', 'Technical', 'Expert', 6),
    (NEWID(), @MonthlyUserId, 'SQL', 'Technical', 'Advanced', 6),

    -- User D (Yearly)
    (NEWID(), @YearlyUserId, 'Product Management', 'Soft Skills', 'Expert', 7),
    (NEWID(), @YearlyUserId, 'Agile/Scrum', 'Soft Skills', 'Expert', 7),
    (NEWID(), @YearlyUserId, 'SQL', 'Technical', 'Intermediate', 5),
    (NEWID(), @YearlyUserId, 'Data Analysis', 'Technical', 'Advanced', 6);

-- =====================================================
-- 4. WORK EXPERIENCES
-- =====================================================

INSERT INTO WorkExperiences (ExperienceId, UserId, CompanyName, JobTitle, Industry, StartDate, EndDate, IsCurrent, Description)
VALUES
    (@FreeUserId, @FreeUserId, 'ABC Tech Vietnam', N'Junior Backend Developer', 'Technology', '2022-06-01', NULL, 1,
     N'Phát triển RESTful APIs với C# và ASP.NET Core. Làm việc với SQL Server và Entity Framework.'),

    (@TrialUserId, @TrialUserId, 'XYZ Digital Agency', N'Senior Frontend Developer', 'Digital Agency', '2019-03-01', NULL, 1,
     N'Lead frontend team của 5 người. Phát triển web apps với React và TypeScript cho các khách hàng enterprise.'),

    (@MonthlyUserId, @MonthlyUserId, 'DataCorp Vietnam', N'Data Scientist', 'Data Analytics', '2020-01-01', NULL, 1,
     N'Phát triển ML models cho recommendation system và predictive analytics. Sử dụng Python, TensorFlow, và scikit-learn.'),

    (@YearlyUserId, @YearlyUserId, 'FinTech Startup', N'Product Manager', 'Fintech', '2018-09-01', NULL, 1,
     N'Quản lý product roadmap cho mobile banking app. Điều phối giữa engineering, design, và business teams.');

-- =====================================================
-- 5. EDUCATIONS
-- =====================================================

INSERT INTO Educations (EducationId, UserId, Institution, Degree, FieldOfStudy, StartDate, EndDate, IsCurrent, GPA)
VALUES
    (NEWID(), @FreeUserId, N'Đại học Bách Khoa Hà Nội', N'Kỹ sư', N'Công nghệ Thông tin', '2017-09-01', '2022-06-01', 0, 3.45),
    (NEWID(), @TrialUserId, N'Đại học Khoa học Tự nhiên TP.HCM', N'Cử nhân', N'Khoa học Máy tính', '2011-09-01', '2015-06-01', 0, 3.67),
    (NEWID(), @MonthlyUserId, N'Đại học Quốc gia Hà Nội', N'Thạc sĩ', N'Khoa học Dữ liệu', '2016-09-01', '2018-06-01', 0, 3.85),
    (NEWID(), @YearlyUserId, N'Đại học Kinh tế TP.HCM', N'Cử nhân', N'Quản trị Kinh doanh', '2010-09-01', '2014-06-01', 0, 3.52);

-- =====================================================
-- 6. CVs
-- =====================================================

DECLARE @CV1 UNIQUEIDENTIFIER = NEWID();
DECLARE @CV2 UNIQUEIDENTIFIER = NEWID();
DECLARE @CV3 UNIQUEIDENTIFIER = NEWID();
DECLARE @CV4 UNIQUEIDENTIFIER = NEWID();

INSERT INTO CVs (CVId, UserId, CVName, OriginalFileName, FileUrl, FileSize, FileType, IsDefaultCV, AnalysisScore, LastAnalyzedAt)
VALUES
    (@CV1, @FreeUserId, N'CV Backend Developer 2024', 'NguyenVanA_CV.pdf',
     'https://storage.interviet.com/cvs/user1/cv1.pdf', 524288, 'PDF', 1, 72.5, GETUTCDATE()),

    (@CV2, @TrialUserId, N'CV Senior Frontend Developer', 'TranThiB_CV.pdf',
     'https://storage.interviet.com/cvs/user2/cv1.pdf', 612352, 'PDF', 1, 88.3, GETUTCDATE()),

    (@CV3, @MonthlyUserId, N'CV Data Scientist', 'LeVanC_CV.pdf',
     'https://storage.interviet.com/cvs/user3/cv1.pdf', 589824, 'PDF', 1, 91.2, GETUTCDATE()),

    (@CV4, @YearlyUserId, N'CV Product Manager', 'PhamThiD_CV.pdf',
     'https://storage.interviet.com/cvs/user4/cv1.pdf', 556032, 'PDF', 1, 85.7, GETUTCDATE());

-- =====================================================
-- 7. JOB DESCRIPTIONS
-- =====================================================

DECLARE @JD1 UNIQUEIDENTIFIER = NEWID();
DECLARE @JD2 UNIQUEIDENTIFIER = NEWID();
DECLARE @JD3 UNIQUEIDENTIFIER = NEWID();

INSERT INTO JobDescriptions (JDId, UserId, JobTitle, CompanyName, Description, Requirements, Industry, JobLevel, JobType, WorkMode,
    SalaryMin, SalaryMax, City, Status)
VALUES
    (@JD1, @FreeUserId, N'Backend Developer (.NET)', 'VNG Corporation',
     N'Phát triển backend services cho các sản phẩm game và fintech.',
     N'- 2+ năm kinh nghiệm C# và .NET Core\n- Thành thạo SQL Server\n- Hiểu biết về microservices',
     'Technology', 'Junior', 'Full-time', 'Hybrid', 18000000, 25000000, N'Hồ Chí Minh', 'active'),

    (@JD2, @TrialUserId, N'Senior Frontend Developer (React)', 'FPT Software',
     N'Lead frontend development cho dự án international banking.',
     N'- 5+ năm kinh nghiệm React và TypeScript\n- Kinh nghiệm lead team\n- Tiếng Anh giao tiếp tốt',
     'Technology', 'Senior', 'Full-time', 'Hybrid', 35000000, 45000000, N'Hà Nội', 'active'),

    (@JD3, @MonthlyUserId, N'Senior Data Scientist', 'Tiki Corporation',
     N'Phát triển ML models cho recommendation và pricing optimization.',
     N'- 5+ năm kinh nghiệm ML/AI\n- Thành thạo Python, TensorFlow, scikit-learn\n- Kinh nghiệm e-commerce là lợi thế',
     'E-commerce', 'Senior', 'Full-time', 'Remote', 40000000, 55000000, N'Hồ Chí Minh', 'active');

-- =====================================================
-- 8. CV-JD MATCHINGS
-- =====================================================

INSERT INTO CVJDMatchings (MatchingId, UserId, CVId, JDId, MatchScore, MatchLevel)
VALUES
    (NEWID(), @FreeUserId, @CV1, @JD1, 78.5, 'Good'),
    (NEWID(), @TrialUserId, @CV2, @JD2, 92.3, 'Excellent'),
    (NEWID(), @MonthlyUserId, @CV3, @JD3, 89.7, 'Excellent');

-- =====================================================
-- 9. SUBSCRIPTIONS
-- =====================================================

DECLARE @FreePlanId UNIQUEIDENTIFIER;
DECLARE @MonthlyPlanId UNIQUEIDENTIFIER;
DECLARE @YearlyPlanId UNIQUEIDENTIFIER;

SELECT @FreePlanId = PlanId FROM SubscriptionPlans WHERE PlanCode = 'FREE';
SELECT @MonthlyPlanId = PlanId FROM SubscriptionPlans WHERE PlanCode = 'MONTHLY';
SELECT @YearlyPlanId = PlanId FROM SubscriptionPlans WHERE PlanCode = 'YEARLY';

INSERT INTO Subscriptions (SubscriptionId, UserId, PlanId, Status, IsTrialPeriod, StartDate, EndDate, NextBillingDate, AutoRenew)
VALUES
    -- Free user
    (NEWID(), @FreeUserId, @FreePlanId, 'active', 0, GETUTCDATE(), NULL, NULL, 0),

    -- Trial user (Yearly plan trial)
    (NEWID(), @TrialUserId, @YearlyPlanId, 'trial', 1,
     DATEADD(DAY, -3, GETUTCDATE()), -- started 3 days ago
     DATEADD(DAY, 4, GETUTCDATE()),  -- 4 days remaining in trial
     DATEADD(DAY, 4, GETUTCDATE()), 1),

    -- Monthly user
    (NEWID(), @MonthlyUserId, @MonthlyPlanId, 'active', 0,
     DATEADD(DAY, -15, GETUTCDATE()),
     DATEADD(DAY, 15, GETUTCDATE()),
     DATEADD(DAY, 15, GETUTCDATE()), 1),

    -- Yearly user
    (NEWID(), @YearlyUserId, @YearlyPlanId, 'active', 0,
     DATEADD(MONTH, -3, GETUTCDATE()),
     DATEADD(MONTH, 9, GETUTCDATE()),
     DATEADD(YEAR, 1, DATEADD(MONTH, -3, GETUTCDATE())), 1);

-- =====================================================
-- 10. USAGE TRACKING
-- =====================================================

INSERT INTO UsageTracking (UsageId, UserId, PeriodStartDate, PeriodEndDate,
    CVAnalysisUsed, JDMatchingUsed, InterviewSessionsUsed, InterviewMinutesUsed)
VALUES
    -- Free user: 1/3 CV analysis used, 2/5 JD matching used
    (NEWID(), @FreeUserId,
     DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE)), -- First day of month
     DATEADD(MONTH, 1, DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE))),
     1, 2, 0, 0),

    -- Trial user: moderate usage
    (NEWID(), @TrialUserId,
     DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE)),
     DATEADD(MONTH, 1, DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE))),
     5, 12, 2, 45),

    -- Monthly user: heavy usage
    (NEWID(), @MonthlyUserId,
     DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE)),
     DATEADD(MONTH, 1, DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE))),
     18, 42, 8, 256),

    -- Yearly user: unlimited, tracking for analytics only
    (NEWID(), @YearlyUserId,
     DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE)),
     DATEADD(MONTH, 1, DATEADD(DAY, -DATEPART(DAY, GETUTCDATE())+1, CAST(GETUTCDATE() AS DATE))),
     35, 87, 15, 523);

-- =====================================================
-- 11. PAYMENTS
-- =====================================================

DECLARE @Payment1 UNIQUEIDENTIFIER = NEWID();
DECLARE @Payment2 UNIQUEIDENTIFIER = NEWID();

INSERT INTO Payments (PaymentId, UserId, Amount, Currency, PaymentMethod, PaymentGateway, TransactionId, OrderId, Status, CompletedAt)
VALUES
    (@Payment1, @MonthlyUserId, 149000, 'VND', 'vnpay', 'vnpay',
     'VNPAY_TXN_20260423001', 'ORDER_20260423_001', 'completed', DATEADD(DAY, -15, GETUTCDATE())),

    (@Payment2, @YearlyUserId, 1308000, 'VND', 'momo', 'momo',
     'MOMO_TXN_20260120001', 'ORDER_20260120_001', 'completed', DATEADD(MONTH, -3, GETUTCDATE()));

-- =====================================================
-- 12. INVOICES
-- =====================================================

INSERT INTO Invoices (InvoiceId, PaymentId, UserId, InvoiceNumber, SubtotalAmount, TaxAmount, TotalAmount,
    BillingName, BillingEmail, IssuedAt)
VALUES
    (NEWID(), @Payment1, @MonthlyUserId, 'INV-2026-04-001', 149000, 0, 149000,
     N'Lê Văn C', 'le.vanc@gmail.com', DATEADD(DAY, -15, GETUTCDATE())),

    (NEWID(), @Payment2, @YearlyUserId, 'INV-2026-01-001', 1308000, 0, 1308000,
     N'Phạm Thị D', 'pham.thid@gmail.com', DATEADD(MONTH, -3, GETUTCDATE()));

-- =====================================================
-- 13. INTERVIEW SESSION (Sample)
-- =====================================================

DECLARE @InterviewSession1 UNIQUEIDENTIFIER = NEWID();

INSERT INTO InterviewSessions (SessionId, UserId, JDId, SessionType, InterviewLevel, JobTitle, Status,
    StartedAt, CompletedAt, DurationSeconds, OverallScore, CommunicationScore, TechnicalScore)
VALUES
    (@InterviewSession1, @MonthlyUserId, @JD3, 'technical', 'senior', N'Senior Data Scientist', 'completed',
     DATEADD(DAY, -2, GETUTCDATE()), DATEADD(DAY, -2, DATEADD(MINUTE, 35, GETUTCDATE())), 2100, 85.5, 82.0, 88.0);

INSERT INTO InterviewQuestions (QuestionId, SessionId, QuestionNumber, QuestionType, QuestionText)
VALUES
    (NEWID(), @InterviewSession1, 1, 'technical',
     N'Bạn có thể giải thích sự khác biệt giữa supervised learning và unsupervised learning không?');

-- =====================================================
-- 14. NOTIFICATIONS
-- =====================================================

INSERT INTO Notifications (NotificationId, UserId, NotificationType, Title, Message, IsRead)
VALUES
    (NEWID(), @FreeUserId, 'feature', N'Chào mừng đến với INTER-VIET!',
     N'Bạn đã sử dụng 1/3 lượt phân tích CV trong gói Miễn phí. Nâng cấp lên gói Premium để có thêm nhiều tính năng!', 0),

    (NEWID(), @TrialUserId, 'subscription', N'Còn 4 ngày dùng thử',
     N'Gói dùng thử 7 ngày của bạn sẽ kết thúc vào 27/04/2026. Thanh toán ngay để tiếp tục sử dụng!', 0),

    (NEWID(), @MonthlyUserId, 'payment', N'Thanh toán thành công',
     N'Chúng tôi đã nhận được thanh toán 149.000đ cho Gói Tháng. Cảm ơn bạn!', 1),

    (NEWID(), @YearlyUserId, 'feature', N'Tính năng mới: Multi-JD Matching',
     N'Bây giờ bạn có thể so sánh CV với tối đa 20 JD cùng lúc!', 0);

-- =====================================================
-- 15. ACTIVITY LOGS
-- =====================================================

INSERT INTO ActivityLogs (ActivityId, UserId, ActivityType, ActivityDescription, RelatedEntityType, RelatedEntityId)
VALUES
    (NEWID(), @FreeUserId, 'cv-upload', N'Tải lên CV: CV Backend Developer 2024', 'CV', @CV1),
    (NEWID(), @FreeUserId, 'jd-match', N'So sánh CV với JD: Backend Developer (.NET)', 'JD', @JD1),

    (NEWID(), @TrialUserId, 'cv-upload', N'Tải lên CV: CV Senior Frontend Developer', 'CV', @CV2),
    (NEWID(), @TrialUserId, 'jd-match', N'So sánh CV với JD: Senior Frontend Developer (React)', 'JD', @JD2),

    (NEWID(), @MonthlyUserId, 'payment', N'Thanh toán thành công Gói Tháng - 149.000đ', 'Payment', @Payment1),
    (NEWID(), @MonthlyUserId, 'interview-session', N'Hoàn thành phỏng vấn: Senior Data Scientist', 'Interview', @InterviewSession1),

    (NEWID(), @YearlyUserId, 'payment', N'Thanh toán thành công Gói Năm - 1.308.000đ', 'Payment', @Payment2);

-- =====================================================
-- 16. SYSTEM SETTINGS
-- =====================================================

INSERT INTO SystemSettings (SettingId, SettingKey, SettingValue, SettingType, Description)
VALUES
    (NEWID(), 'app.maintenance_mode', 'false', 'boolean', N'Chế độ bảo trì hệ thống'),
    (NEWID(), 'payment.vnpay_enabled', 'true', 'boolean', N'Bật/tắt thanh toán VNPay'),
    (NEWID(), 'payment.momo_enabled', 'true', 'boolean', N'Bật/tắt thanh toán MoMo'),
    (NEWID(), 'ai.cv_analysis_timeout_seconds', '30', 'number', N'Timeout cho AI phân tích CV'),
    (NEWID(), 'ai.interview_max_duration_minutes', '60', 'number', N'Thời lượng tối đa 1 phiên phỏng vấn');

GO

-- =====================================================
-- VERIFY TEST DATA
-- =====================================================

PRINT 'Test data inserted successfully!';
PRINT '';
PRINT 'Summary:';
PRINT '- Users: ' + CAST((SELECT COUNT(*) FROM Users) AS VARCHAR);
PRINT '- Profiles: ' + CAST((SELECT COUNT(*) FROM CandidateProfiles) AS VARCHAR);
PRINT '- Skills: ' + CAST((SELECT COUNT(*) FROM Skills) AS VARCHAR);
PRINT '- CVs: ' + CAST((SELECT COUNT(*) FROM CVs) AS VARCHAR);
PRINT '- JDs: ' + CAST((SELECT COUNT(*) FROM JobDescriptions) AS VARCHAR);
PRINT '- Matchings: ' + CAST((SELECT COUNT(*) FROM CVJDMatchings) AS VARCHAR);
PRINT '- Subscriptions: ' + CAST((SELECT COUNT(*) FROM Subscriptions) AS VARCHAR);
PRINT '- Payments: ' + CAST((SELECT COUNT(*) FROM Payments) AS VARCHAR);
PRINT '';

-- Show active users with subscriptions
SELECT
    u.FullName,
    u.Email,
    u.UserStatus,
    sp.PlanName,
    s.Status AS SubscriptionStatus,
    s.IsTrialPeriod,
    ut.CVAnalysisUsed,
    ut.JDMatchingUsed
FROM Users u
LEFT JOIN Subscriptions s ON u.UserId = s.UserId AND s.Status IN ('active', 'trial')
LEFT JOIN SubscriptionPlans sp ON s.PlanId = sp.PlanId
LEFT JOIN UsageTracking ut ON u.UserId = ut.UserId
ORDER BY u.CreatedAt;

GO

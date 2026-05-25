using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Interviet.Domain.Mentors;
using Interviet.Domain.Identity;
using Interviet.Domain.Profiles;
using Interviet.Domain.Support;
using Interviet.Application.Common.Interfaces;

namespace Interviet.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedMentorsAsync(AppDbContext db)
    {
        // 1. Seed Specialties
        var specialtySpecs = new List<(string Code, string Name, string Desc)>
        {
            ("cv_review", "CV Review & Optimization", "Đánh giá, sửa đổi và nâng cấp CV chuẩn ATS."),
            ("mock_interview", "Mock Interview Practice", "Phỏng vấn thử giả lập với các câu hỏi thực tế từ doanh nghiệp."),
            ("career_coaching", "Career Path Coaching", "Tư vấn lộ trình sự nghiệp và chuyển ngành."),
            ("technical_mentoring", "Technical Skills Mentoring", "Hướng dẫn kỹ năng kỹ thuật, giải đáp thắc mắc chuyên sâu."),
            ("industry_insights", "Industry Insights & Networking", "Chia sẻ kiến thức ngành, mở rộng quan hệ với chuyên gia.")
        };

        var specialties = new List<MentorSpecialty>();
        foreach (var spec in specialtySpecs)
        {
            var existing = await db.MentorSpecialties.FirstOrDefaultAsync(s => s.Code == spec.Code);
            if (existing is null)
            {
                existing = new MentorSpecialty
                {
                    Id = Guid.NewGuid(),
                    Code = spec.Code,
                    Name = spec.Name,
                    Description = spec.Desc
                };
                db.MentorSpecialties.Add(existing);
            }
            specialties.Add(existing);
        }
        await db.SaveChangesAsync();

        // Map specialties by code
        var specialtyMap = specialties.ToDictionary(s => s.Code, s => s);

        // 2. Seed Mentors
        var mentorSpecs = new List<(string Name, string Headline, string Bio, decimal Yoe, decimal Rating, int RatingCount, string[] SpecCodes)>
        {
            ("Nguyen Van A", "Senior Full-Stack Engineer @ TechCorp", "Hơn 10 năm kinh nghiệm làm việc với .NET, React và AWS. Đam mê hướng dẫn thế hệ lập trình viên mới.", 10.5m, 4.8m, 12, new[] { "technical_mentoring", "mock_interview" }),
            ("Tran Thi B", "Frontend Lead @ WebStudio", "Chuyên gia về React, Vue, CSS và UX/UI. Thích giúp các bạn ứng viên tối ưu hóa CV và vượt qua phỏng vấn frontend.", 7.0m, 4.9m, 9, new[] { "technical_mentoring", "cv_review" }),
            ("Le Van C", "Principal Engineer @ CloudSolutions", "Chuyên sâu về kiến trúc hệ thống, Backend Go/C# và Cloud. Có nhiều kinh nghiệm phỏng vấn tuyển dụng.", 12.0m, 4.7m, 15, new[] { "technical_mentoring", "mock_interview" }),
            ("Pham Minh D", "DevOps Architect @ DevOpsify", "Chuyên về CI/CD, Kubernetes, Docker và Infrastructure as Code. Tư vấn định hướng nghề nghiệp DevOps.", 8.5m, 4.6m, 6, new[] { "technical_mentoring", "industry_insights" }),
            ("Hoang Thi E", "Tech Lead @ InnovationLab", "Kinh nghiệm quản lý dự án agile, dẫn dắt các nhóm kỹ thuật. Tư vấn phát triển nghề nghiệp và kỹ năng mềm.", 9.0m, 4.8m, 10, new[] { "career_coaching", "industry_insights" }),
            ("Vu Van F", "Solutions Architect @ EnterpriseCorp", "Thiết kế hệ thống chịu tải cao lớn. Mentor hỗ trợ định hướng kiến trúc và tư vấn công nghệ cho senior dev.", 15.0m, 5.0m, 8, new[] { "career_coaching", "technical_mentoring" })
        };

        var now = DateTime.UtcNow;

        foreach (var mSpec in mentorSpecs)
        {
            var mentor = await db.MentorProfiles
                .Include(m => m.Specialties)
                .Include(m => m.AvailabilitySlots)
                .FirstOrDefaultAsync(m => m.FullName == mSpec.Name);

            if (mentor is null)
            {
                mentor = new MentorProfile
                {
                    Id = Guid.NewGuid(),
                    FullName = mSpec.Name,
                    Headline = mSpec.Headline,
                    AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(mSpec.Name)}&background=random&size=200",
                    Bio = mSpec.Bio,
                    YearsOfExperience = mSpec.Yoe,
                    RatingAverage = mSpec.Rating,
                    RatingCount = mSpec.RatingCount,
                    Status = "active",
                    CreatedAt = now,
                    UpdatedAt = now
                };

                // Specialties
                foreach (var code in mSpec.SpecCodes)
                {
                    if (specialtyMap.TryGetValue(code, out var spec))
                    {
                        mentor.Specialties.Add(spec);
                    }
                }

                db.MentorProfiles.Add(mentor);
                await db.SaveChangesAsync(); // save mentor to get ID for slots
            }

            // Check if mentor has any future slots
            var hasFutureSlots = mentor.AvailabilitySlots.Any(s => s.StartsAt > now);
            if (!hasFutureSlots)
            {
                // Create 4 future slots for each mentor
                var baseDate = now.Date.AddDays(1); // tomorrow
                var slotTimes = new List<(DateTime Start, DateTime End)>
                {
                    (baseDate.AddHours(9), baseDate.AddHours(9).AddMinutes(45)),
                    (baseDate.AddHours(14), baseDate.AddHours(14).AddMinutes(45)),
                    (baseDate.AddDays(1).AddHours(10), baseDate.AddDays(1).AddHours(10).AddMinutes(45)),
                    (baseDate.AddDays(2).AddHours(16), baseDate.AddDays(2).AddHours(16).AddMinutes(45))
                };

                var price = 200000m + (mentor.YearsOfExperience * 20000m); // simple mock price calculation
                price = Math.Round(price / 50000m) * 50000m; // round to nearest 50,000

                foreach (var time in slotTimes)
                {
                    var slot = new MentorAvailabilitySlot
                    {
                        Id = Guid.NewGuid(),
                        MentorId = mentor.Id,
                        StartsAt = time.Start,
                        EndsAt = time.End,
                        Status = "available",
                        PriceAmount = price,
                        CurrencyCode = "VND"
                    };
                    db.MentorAvailabilitySlots.Add(slot);
                }
            }
        }

        await db.SaveChangesAsync();
    }

    public static async Task SeedAdminUserAsync(AppDbContext db, IPasswordHasher passwordHasher)
    {
        var email = "hienngochuy3@gmail.com";
        var normalizedEmail = email.ToUpperInvariant();
        var exists = await db.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail);
        if (!exists)
        {
            var now = DateTime.UtcNow;
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Hien Ngoc Huy",
                Email = email,
                NormalizedEmail = normalizedEmail,
                PasswordHash = passwordHasher.Hash("Ae5saovjp@"),
                RoleCode = RoleCodes.Admin,
                Status = "free",
                IsEmailVerified = true,
                EmailVerifiedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.Users.Add(user);

            var profile = new CandidateProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CompletenessScore = 100,
                Summary = "Default Administrator Profile",
                YearsOfExperience = 5m,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.CandidateProfiles.Add(profile);

            await db.SaveChangesAsync();
        }
        else
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
            if (user != null)
            {
                user.RoleCode = RoleCodes.Admin;
                user.PasswordHash = passwordHasher.Hash("Ae5saovjp@");
                user.IsEmailVerified = true;
                await db.SaveChangesAsync();
            }
        }
    }

    public static async Task SeedPublicContentAsync(AppDbContext db)
    {
        // 1. Seed PublicStats
        if (!await db.PublicStats.AnyAsync())
        {
            db.PublicStats.AddRange(new List<PublicStat>
            {
                new() { Key = "users_count", Value = "10,000+", Label = "Người dùng", Icon = "users", SortOrder = 1 },
                new() { Key = "resumes_count", Value = "50,000+", Label = "CV tối ưu", Icon = "file-text", SortOrder = 2 },
                new() { Key = "interviews_count", Value = "30,000+", Label = "Phỏng vấn", Icon = "mic", SortOrder = 3 },
                new() { Key = "rating", Value = "4.9", Label = "Đánh giá", Icon = "star", SortOrder = 4 }
            });
        }

        // 2. Seed Testimonials
        if (!await db.Testimonials.AnyAsync())
        {
            db.Testimonials.AddRange(new List<Testimonial>
            {
                new()
                {
                    AuthorName = "Nguyễn Thu Hà",
                    AuthorRole = "Senior Developer @ FPT Software",
                    Content = "Tính năng phỏng vấn AI thật sự tuyệt vời! Tôi đã luyện tập 5 lần trước buổi phỏng vấn thật và cảm thấy tự tin hơn rất nhiều. Kết quả là đã nhận được offer từ công ty mơ ước.",
                    AvatarUrl = "https://ui-avatars.com/api/?name=Nguyen+Thu+Ha&background=random&size=200",
                    Rating = 5.0m,
                    SortOrder = 1,
                    IsActive = true,
                    IsFeatured = true
                },
                new()
                {
                    AuthorName = "Trần Minh Quân",
                    AuthorRole = "Product Manager @ VinGroup",
                    Content = "CV matching score giúp tôi hiểu rõ điểm yếu của CV so với JD. Sau khi tối ưu theo gợi ý, tỷ lệ phản hồi từ nhà tuyển dụng tăng từ 10% lên 60%. Đáng đồng tiền bát gạo!",
                    AvatarUrl = "https://ui-avatars.com/api/?name=Tran+Minh+Quan&background=random&size=200",
                    Rating = 5.0m,
                    SortOrder = 2,
                    IsActive = true,
                    IsFeatured = true
                }
            });
        }

        // 3. Seed FAQ Items
        if (!await db.FaqItems.AnyAsync())
        {
            db.FaqItems.AddRange(new List<FaqItem>
            {
                // Tối ưu CV
                new() { Category = "Tối ưu CV", Question = "Cách tải CV lên hệ thống", Answer = "Bạn chỉ cần kéo thả file CV dạng PDF hoặc DOCX vào khu vực tải lên ở trang CV Matching. Hệ thống sẽ tự động quét và phân tích thông tin của bạn.", SortOrder = 1, IsActive = true },
                new() { Category = "Tối ưu CV", Question = "Làm thế nào để so khớp CV với JD?", Answer = "Sau khi tải CV lên, bạn dán nội dung tin tuyển dụng (JD) của vị trí ứng tuyển vào ô mô tả công việc. Nhấn 'Phân tích', AI sẽ trả về điểm số so khớp và gợi ý từ khoá cần bổ sung.", SortOrder = 2, IsActive = true },
                new() { Category = "Tối ưu CV", Question = "Hiểu điểm matching và cách cải thiện", Answer = "Điểm matching từ 70% trở lên được xem là đạt yêu cầu tuyển dụng. Để cải thiện, hãy tối ưu hoá từ khoá kỹ năng, kinh nghiệm dựa trên gợi ý từ AI.", SortOrder = 3, IsActive = true },
                new() { Category = "Tối ưu CV", Question = "Xuất CV sang file", Answer = "Hệ thống hỗ trợ tải xuống phiên bản CV đã được tối ưu dưới dạng PDF hoặc Microsoft Word chuẩn ATS để bạn nộp trực tiếp cho nhà tuyển dụng.", SortOrder = 4, IsActive = true },

                // Phỏng vấn AI
                new() { Category = "Phỏng vấn AI", Question = "Bắt đầu buổi phỏng vấn đầu tiên", Answer = "Chọn vị trí tuyển dụng, thiết lập độ khó và nhấn 'Bắt đầu'. AI sẽ giả lập vai trò người phỏng vấn và đưa ra câu hỏi lần lượt.", SortOrder = 1, IsActive = true },
                new() { Category = "Phỏng vấn AI", Question = "Chọn mô hình AI phù hợp", Answer = "Chúng tôi cung cấp các mô hình phỏng vấn theo ngành nghề: Lập trình viên, Quản trị dự án, Sales, Marketing... Hãy chọn mô hình đúng với mục tiêu sự nghiệp của bạn.", SortOrder = 2, IsActive = true },
                new() { Category = "Phỏng vấn AI", Question = "Sử dụng microphone hiệu quả", Answer = "Đảm bảo bạn ở nơi yên tĩnh, cấp quyền truy cập mic cho trình duyệt và nói rõ ràng. Hệ thống sẽ tự động chuyển giọng nói thành văn bản thời gian thực.", SortOrder = 3, IsActive = true },
                new() { Category = "Phỏng vấn AI", Question = "Đọc và hiểu báo cáo phỏng vấn", Answer = "Báo cáo chi tiết bao gồm điểm tổng thể, nhận xét điểm mạnh, lỗi cần tránh và hướng dẫn câu trả lời tối ưu cho từng câu hỏi.", SortOrder = 4, IsActive = true },

                // Báo cáo & Thống kê
                new() { Category = "Báo cáo & Thống kê", Question = "Xem lịch sử báo cáo", Answer = "Mọi lượt phỏng vấn và so khớp CV đều được lưu trữ trong mục Lịch sử. Bạn có thể xem lại chi tiết nhận xét của AI bất kỳ lúc nào.", SortOrder = 1, IsActive = true },
                new() { Category = "Báo cáo & Thống kê", Question = "So sánh với trung bình ngành", Answer = "Hệ thống so sánh kết quả của bạn với dữ liệu hàng nghìn ứng viên khác trong cùng lĩnh vực để giúp bạn biết vị trí của mình ở đâu trên thị trường.", SortOrder = 2, IsActive = true },
                new() { Category = "Báo cáo & Thống kê", Question = "Xuất báo cáo PDF", Answer = "Người dùng gói Premium có thể tải xuống báo cáo phỏng vấn và đánh giá năng lực toàn diện dạng PDF để đưa vào hồ sơ năng lực cá nhân.", SortOrder = 3, IsActive = true },
                new() { Category = "Báo cáo & Thống kê", Question = "Theo dõi tiến độ cải thiện", Answer = "Biểu đồ xu hướng trong dashboard sẽ hiển thị sự tiến bộ của bạn qua các lần phỏng vấn thử về cả phong thái, từ vựng và tư duy kỹ thuật.", SortOrder = 4, IsActive = true },

                // Gói dịch vụ
                new() { Category = "Gói dịch vụ", Question = "So sánh các gói dịch vụ", Answer = "Gói Miễn phí cung cấp tính năng cơ bản với số lượt giới hạn. Gói Premium mở khoá phỏng vấn không giới hạn, xuất PDF và hỗ trợ ưu tiên.", SortOrder = 1, IsActive = true },
                new() { Category = "Gói dịch vụ", Question = "Dùng thử 7 ngày miễn phí", Answer = "Khi đăng ký gói Premium Năm, bạn được dùng thử 7 ngày đầy đủ tính năng mà không bị tính phí trước.", SortOrder = 2, IsActive = true },
                new() { Category = "Gói dịch vụ", Question = "Nâng cấp và thanh toán", Answer = "Nhấn 'Nâng cấp' trên thanh điều hướng, chọn gói dịch vụ và thực hiện thanh toán an toàn qua cổng VnPay, Momo hoặc thẻ quốc tế.", SortOrder = 3, IsActive = true },
                new() { Category = "Gói dịch vụ", Question = "Hủy gói dịch vụ", Answer = "Bạn có thể tự huỷ gia hạn gói bất kỳ lúc nào trong mục Cài đặt tài khoản. Gói dịch vụ vẫn có hiệu lực cho đến hết chu kỳ thanh toán hiện tại.", SortOrder = 4, IsActive = true }
            });
        }

        // 4. Seed Blog Articles
        if (!await db.BlogArticles.AnyAsync())
        {
            var now = DateTime.UtcNow;
            db.BlogArticles.AddRange(new List<BlogArticle>
            {
                new()
                {
                    Title = "Bí quyết tối ưu CV chuẩn ATS giúp đánh bại 90% bộ lọc tuyển dụng",
                    Slug = "bi-quyet-toi-uu-cv-chuan-ats",
                    Content = "<p>Hầu hết các công ty lớn hiện nay đều sử dụng hệ thống quản lý tuyển dụng ATS để lọc hồ sơ. Một CV được trình bày đẹp mắt đối với mắt người thường có thể bị lỗi font hoặc mất cấu trúc khi qua bộ quét ATS. Bài viết này sẽ hướng dẫn bạn cách chọn từ khóa, bố cục chuẩn và các lỗi cần tránh để tăng tỷ lệ được gọi phỏng vấn lên 3 lần.</p>",
                    Author = "Đội ngũ biên tập viên INTER-VIET",
                    CoverImageUrl = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
                    Category = "Kiến thức CV",
                    IsPublished = true,
                    PublishedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new()
                {
                    Title = "Cách trả lời câu hỏi phỏng vấn 'Giới thiệu bản thân' gây ấn tượng mạnh",
                    Slug = "cach-tra-loi-phong-van-gioi-thieu-ban-than",
                    Content = "<p>Giới thiệu bản thân thường là câu hỏi mở đầu trong hầu hết các buổi phỏng vấn. Tuy nhiên, hơn 80% ứng viên nói quá dài dòng hoặc lặp lại những gì đã viết trong CV. Hãy cùng tìm hiểu công thức Hiện tại - Quá khứ - Tương lai độc quyền tại INTER-VIET để ghi điểm tuyệt đối với nhà tuyển dụng ngay trong 2 phút đầu tiên.</p>",
                    Author = "Nguyễn Văn A - Senior Mentor",
                    CoverImageUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop",
                    Category = "Kinh nghiệm phỏng vấn",
                    IsPublished = true,
                    PublishedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now
                }
            });
        }

        await db.SaveChangesAsync();
    }
}

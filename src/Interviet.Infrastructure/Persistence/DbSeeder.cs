using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Interviet.Domain.Mentors;
using Interviet.Domain.Identity;
using Interviet.Domain.Profiles;
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
}

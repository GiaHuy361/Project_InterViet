using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Interviet.Domain.Support;

namespace Interviet.Infrastructure.Persistence.Configurations;

public class PublicStatConfiguration : IEntityTypeConfiguration<PublicStat>
{
    public void Configure(EntityTypeBuilder<PublicStat> b)
    {
        b.ToTable("PublicStats");
        b.HasKey(x => x.Id);
        b.Property(x => x.Key).HasMaxLength(100).IsRequired();
        b.Property(x => x.Value).HasMaxLength(100).IsRequired();
        b.Property(x => x.Label).HasMaxLength(150).IsRequired();
        b.Property(x => x.Icon).HasMaxLength(50);
        b.HasIndex(x => x.Key).IsUnique();
    }
}

public class TestimonialConfiguration : IEntityTypeConfiguration<Testimonial>
{
    public void Configure(EntityTypeBuilder<Testimonial> b)
    {
        b.ToTable("Testimonials");
        b.HasKey(x => x.Id);
        b.Property(x => x.AuthorName).HasMaxLength(150).IsRequired();
        b.Property(x => x.AuthorRole).HasMaxLength(150).IsRequired();
        b.Property(x => x.Content).HasMaxLength(2000).IsRequired();
        b.Property(x => x.AvatarUrl).HasMaxLength(500);
        b.Property(x => x.Rating).HasColumnType("decimal(3,2)");
    }
}

public class FaqItemConfiguration : IEntityTypeConfiguration<FaqItem>
{
    public void Configure(EntityTypeBuilder<FaqItem> b)
    {
        b.ToTable("FaqItems");
        b.HasKey(x => x.Id);
        b.Property(x => x.Category).HasMaxLength(100).IsRequired();
        b.Property(x => x.Question).HasMaxLength(500).IsRequired();
        b.Property(x => x.Answer).HasMaxLength(4000).IsRequired();
    }
}

public class PublicContactRequestConfiguration : IEntityTypeConfiguration<PublicContactRequest>
{
    public void Configure(EntityTypeBuilder<PublicContactRequest> b)
    {
        b.ToTable("PublicContactRequests");
        b.HasKey(x => x.Id);
        b.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Email).HasMaxLength(320).IsRequired();
        b.Property(x => x.Phone).HasMaxLength(20);
        b.Property(x => x.Subject).HasMaxLength(250).IsRequired();
        b.Property(x => x.Category).HasMaxLength(100).IsRequired();
        b.Property(x => x.Message).HasMaxLength(4000).IsRequired();
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
        b.HasIndex(x => new { x.Email, x.CreatedAt });
    }
}

public class BlogArticleConfiguration : IEntityTypeConfiguration<BlogArticle>
{
    public void Configure(EntityTypeBuilder<BlogArticle> b)
    {
        b.ToTable("BlogArticles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(250).IsRequired();
        b.Property(x => x.Slug).HasMaxLength(250).IsRequired();
        b.Property(x => x.Content).IsRequired();
        b.Property(x => x.Author).HasMaxLength(150).IsRequired();
        b.Property(x => x.CoverImageUrl).HasMaxLength(500);
        b.Property(x => x.Category).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.Slug).IsUnique();
    }
}

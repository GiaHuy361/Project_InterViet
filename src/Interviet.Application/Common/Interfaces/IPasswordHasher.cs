namespace Interviet.Application.Common.Interfaces;

/// <summary>
/// Password hashing and verification abstraction.
/// BCrypt implementation is in Infrastructure.
/// </summary>
public interface IPasswordHasher
{
    string Hash(string plainTextPassword);
    bool Verify(string plainTextPassword, string hash);
}

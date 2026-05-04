using Interviet.Application.Common.Interfaces;

namespace Interviet.Infrastructure.Services;

/// <summary>
/// BCrypt password hasher. Work factor 12 — production-grade security.
/// </summary>
public sealed class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string Hash(string plainTextPassword) =>
        BCrypt.Net.BCrypt.HashPassword(plainTextPassword, WorkFactor);

    public bool Verify(string plainTextPassword, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(plainTextPassword, hash);
        }
        catch
        {
            return false; // invalid hash format — treat as wrong password
        }
    }
}

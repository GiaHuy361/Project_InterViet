namespace Interviet.Application.Common.Interfaces;

public interface IQrCodeGenerator
{
    string GeneratePngBase64(string payload, int pixelsPerModule = 10);
}

using QRCoder;
using Interviet.Application.Common.Interfaces;

namespace Interviet.Infrastructure.Services;

public sealed class QrCodeGenerator : IQrCodeGenerator
{
    public string GeneratePngBase64(string payload, int pixelsPerModule = 10)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        byte[] qrBytes = qrCode.GetGraphic(pixelsPerModule);
        return $"data:image/png;base64,{Convert.ToBase64String(qrBytes)}";
    }
}

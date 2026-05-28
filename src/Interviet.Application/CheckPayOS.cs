using System;
using System.Reflection;
using System.Linq;

public class CheckPayOSTypes
{
    public static void Inspect()
    {
        var asm = Assembly.Load("payOS");
        var types = asm.GetTypes().Select(t => t.FullName).ToList();
        throw new Exception("PayOS Types: " + string.Join("\n", types));
    }
}

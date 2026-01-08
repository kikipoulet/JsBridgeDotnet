namespace JsBridgeDotnet.Core;

/// <summary>
/// Marque une classe C# comme étant exposable à JavaScript
/// Le ServiceBridge scannera automatiquement le DI container pour trouver ces services
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
public sealed class JsServiceAttribute : Attribute
{
    public string ServiceName { get; }

    public JsServiceAttribute(string serviceName)
    {
        ServiceName = serviceName ?? throw new ArgumentNullException(nameof(serviceName));
    }
}

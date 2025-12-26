
**Assistant**:

> L'utilisateur veut séparer complètement la partie C# et la partie JavaScript :> 1. La librairie C# sera publiée comme package NuGet> 2. La librairie JavaScript sera publiée comme package NPM> 3. Le C# ne doit PAS injecter de JavaScript - cela doit être fait du côté JS> 4. Il veut les fichiers des deux librairies séparées> C'est une excellente approche car :> - Elle permet une meilleure séparation des préoccupations> - Chaque librairie peut être maintenue indépendamment> - Les utilisateurs peuvent installer les packages via NuGet et NPM respectivement> - Pas de couplage fort entre les deux parties> Je vais donc créer deux librairies complètement séparées :> **Côté C# (NuGet Package) :**> - WpfReactBridge.Core ou WpfReactBridge.CSharp> - Contient le ServiceBridge, les définitions de messages> - S'abonne aux WebMessageReceived> - Convertit les appels JS en appels de méthodes C#> - Gère les événements C# -> JS> **Côté JavaScript (NPM Package) :**> - @wpf-react-bridge/client ou wpf-react-bridge-js> - Contient le BridgeClient> - S'initialise automatiquement> - Crée des proxies pour les services> - Gère les appels de méthodes JS -> C#> - Gère les événements C# -> JS> Le trick ici c'est que le JavaScript doit s'initialiser automatiquement quand il détecte qu'il tourne dans une WebView2. Le C# ne fait qu'écouter et répondre aux messages.> Je vais structurer ça proprement avec les fichiers pour chaque librairie.

🎯 **Architecture Séparée - Librairies C# et JavaScript Indépendantes**

Parfait ! Je vais te créer deux librairies complètement séparées qui ne dépendent pas l'une de l'autre.

---

📦 **Structure des Packages**

```
📦 WpfReactBridge.CSharp (NuGet)
├── Core/
│   ├── BridgeMessage.cs
│   ├── ServiceBridge.cs
│   └── ServiceMetadata.cs
└── Extensions/
    └── WebViewExtensions.cs

📦 @wpf-react-bridge/client (NPM)
├── src/
│   ├── BridgeClient.ts
│   ├── ServiceProxy.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
└── package.json
```

---

📋 **Librairie C# - WpfReactBridge.CSharp (NuGet Package)**

### Fichier 1 : `src/Core/BridgeMessage.cs`

```csharp
using System;
using System.Text.Json.Serialization;

namespace WpfReactBridge.Core
{
    /// <summary>
    /// Types de messages supportés par le bridge
    /// </summary>
    public enum MessageType
    {
        /// <summary>
        /// Enregistrement d'un service côté C#
        /// </summary>
        RegisterService = 0,
        
        /// <summary>
        /// Appel de méthode C# depuis JavaScript
        /// </summary>
        CallMethod = 1,
        
        /// <summary>
        /// Résultat d'un appel de méthode
        /// </summary>
        MethodResult = 2,
        
        /// <summary>
        /// Abonnement à un événement C#
        /// </summary>
        SubscribeEvent = 3,
        
        /// <summary>
        /// Désabonnement d'un événement
        /// </summary>
        UnsubscribeEvent = 4,
        
        /// <summary>
        /// Événement déclenché par C#
        /// </summary>
        EventFired = 5,
        
        /// <summary>
        /// Message d'erreur
        /// </summary>
        ErrorResponse = 6
    }

    /// <summary>
    /// Message de base pour la communication C# - JavaScript
    /// </summary>
    public class BridgeMessage
    {
        /// <summary>
        /// Identifiant unique du message pour la corrélation
        /// </summary>
        public string MessageId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Type du message
        /// </summary>
        [JsonPropertyName("type")]
        public MessageType Type { get; set; }

        /// <summary>
        /// Nom du service concerné
        /// </summary>
        public string ServiceName { get; set; }

        /// <summary>
        /// Nom de la méthode ou de l'événement
        /// </summary>
        [JsonPropertyName("methodName")]
        public string MethodName { get; set; }

        /// <summary>
        /// Identifiant d'écouteur d'événement (pour les abonnements)
        /// </summary>
        [JsonPropertyName("listenerId")]
        public string ListenerId { get; set; }

        /// <summary>
        /// Paramètres de la méthode
        /// </summary>
        public object[] Parameters { get; set; }

        /// <summary>
        /// Résultat de l'appel de méthode ou données de l'événement
        /// </summary>
        public object Result { get; set; }

        /// <summary>
        /// Message d'erreur si applicable
        /// </summary>
        public string Error { get; set; }

        /// <summary>
        /// Indique si l'opération a réussi
        /// </summary>
        public bool Success { get; set; }
    }

    /// <summary>
    /// Métadonnées d'une méthode de service
    /// </summary>
    public class MethodMetadata
    {
        public string Name { get; set; }
        public ParameterMetadata[] Parameters { get; set; }
        public string ReturnType { get; set; }
    }

    /// <summary>
    /// Métadonnées d'un paramètre
    /// </summary>
    public class ParameterMetadata
    {
        public string Name { get; set; }
        public string Type { get; set; }
    }

    /// <summary>
    /// Métadonnées d'un service
    /// </summary>
    public class ServiceRegistration
    {
        public string ServiceName { get; set; }
        public MethodMetadata[] Methods { get; set; }
        public string[] Events { get; set; }
    }
}
```

### Fichier 2 : `src/Core/ServiceBridge.cs`

```csharp
using Microsoft.Web.WebView2.Core;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;

namespace WpfReactBridge.Core
{
    /// <summary>
    /// Bridge principal pour la communication entre C# et JavaScript
    /// Expose les services C# à JavaScript sans modification du code des services
    /// </summary>
    public class ServiceBridge : IDisposable
    {
        private readonly WebView2 _webView;
        private readonly Dictionary<string, object> _services;
        private readonly ConcurrentDictionary<string, Action<object>> _pendingCalls;
        private readonly Dictionary<(string service, string eventName), EventSubscription> _eventSubscriptions;
        private readonly JsonSerializerOptions _jsonOptions;
        private bool _isDisposed;

        public ServiceBridge(WebView2 webView)
        {
            _webView = webView ?? throw new ArgumentNullException(nameof(webView));
            _services = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            _pendingCalls = new ConcurrentDictionary<string, Action<object>>();
            _eventSubscriptions = new Dictionary<(string, string), EventSubscription>();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };

            InitializeMessageHandler();
        }

        /// <summary>
        /// Initialise le gestionnaire de messages venant de JavaScript
        /// </summary>
        private void InitializeMessageHandler()
        {
            if (_webView.CoreWebView2 == null)
            {
                throw new InvalidOperationException("WebView2 must be initialized before creating ServiceBridge. Call EnsureCoreWebView2Async() first.");
            }

            _webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
        }

        /// <summary>
        /// Enregistre un service et le rend disponible pour JavaScript
        /// </summary>
        /// <typeparam name="T">Type du service (interface ou classe)</typeparam>
        /// <param name="serviceName">Nom unique du service pour l'identifier côté JavaScript</param>
        /// <param name="serviceInstance">Instance du service à exposer</param>
        public void RegisterService<T>(string serviceName, T serviceInstance)
        {
            if (string.IsNullOrWhiteSpace(serviceName))
                throw new ArgumentException("Service name cannot be empty", nameof(serviceName));

            if (serviceInstance == null)
                throw new ArgumentNullException(nameof(serviceInstance));

            _services[serviceName] = serviceInstance;

            // Générer les métadonnées du service
            var serviceType = serviceInstance.GetType();
            var registration = GenerateServiceMetadata(serviceName, serviceType);

            // S'abonner aux événements du service
            SubscribeToServiceEvents(serviceName, serviceType, serviceInstance);

            // Informer JavaScript que le service est disponible
            var message = new BridgeMessage
            {
                Type = MessageType.RegisterService,
                Result = registration,
                Success = true
            };

            SendMessageToJavaScript(message);
        }

        /// <summary>
        /// Génère les métadonnées du service pour JavaScript
        /// </summary>
        private ServiceRegistration GenerateServiceMetadata(string serviceName, Type serviceType)
        {
            // Récupérer les méthodes publiques (non héritées de Object)
            var methods = serviceType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                .Where(m => !m.IsSpecialName && 
                           m.DeclaringType != typeof(object) && 
                           !m.IsGenericMethod)
                .Select(m => new MethodMetadata
                {
                    Name = m.Name,
                    Parameters = m.GetParameters()
                        .Select(p => new ParameterMetadata
                        {
                            Name = p.Name,
                            Type = GetSimpleTypeName(p.ParameterType)
                        })
                        .ToArray(),
                    ReturnType = GetSimpleTypeName(m.ReturnType)
                })
                .ToArray();

            // Récupérer les événements publics
            var events = serviceType.GetEvents(BindingFlags.Public | BindingFlags.Instance)
                .Where(e => e.DeclaringType != typeof(object))
                .Select(e => e.Name)
                .ToArray();

            return new ServiceRegistration
            {
                ServiceName = serviceName,
                Methods = methods,
                Events = events
            };
        }

        /// <summary>
        /// Retourne un nom de type simple pour la sérialisation JSON
        /// </summary>
        private string GetSimpleTypeName(Type type)
        {
            if (type.IsGenericType)
            {
                var genericType = type.GetGenericTypeDefinition();
                var typeArgs = string.Join(", ", type.GetGenericArguments().Select(GetSimpleTypeName));
                return $"{genericType.Name.Split('`')[0]}<{typeArgs}>";
            }
            return type.Name;
        }

        /// <summary>
        /// S'abonne aux événements du service pour les relayer à JavaScript
        /// </summary>
        private void SubscribeToServiceEvents(string serviceName, Type serviceType, object serviceInstance)
        {
            var events = serviceType.GetEvents(BindingFlags.Public | BindingFlags.Instance)
                .Where(e => e.DeclaringType != typeof(object));

            foreach (var eventInfo in events)
            {
                var key = (serviceName, eventInfo.Name);
                
                if (!_eventSubscriptions.ContainsKey(key))
                {
                    var subscription = new EventSubscription
                    {
                        EventName = eventInfo.Name,
                        ServiceInstance = serviceInstance,
                        EventInfo = eventInfo,
                        Handlers = new List<Delegate>()
                    };

                    _eventSubscriptions[key] = subscription;

                    // Créer un handler qui relayera les événements à JavaScript
                    var eventHandler = CreateEventHandler(eventInfo, serviceName, eventInfo.Name);
                    eventInfo.AddEventHandler(serviceInstance, eventHandler);
                    subscription.Handlers.Add(eventHandler);
                }
            }
        }

        /// <summary>
        /// Crée un handler d'événement dynamique
        /// </summary>
        private Delegate CreateEventHandler(EventInfo eventInfo, string serviceName, string eventName)
        {
            var eventType = eventInfo.EventHandlerType;
            var invokeMethod = eventType.GetMethod("Invoke");
            
            if (invokeMethod == null)
                throw new InvalidOperationException($"Event {eventInfo.Name} has no Invoke method");

            var parameters = invokeMethod.GetParameters();
            var senderParam = Expression.Parameter(typeof(object), "sender");
            var argsParam = Expression.Parameter(typeof(object), "args");

            // Créer une méthode anonyme qui sera appelée quand l'événement se déclenche
            var handlerMethod = new Action<object, object>((sender, args) =>
            {
                OnServiceEventFired(serviceName, eventName, args);
            });

            // Créer le délégué approprié pour l'événement
            return Delegate.CreateDelegate(eventType, handlerMethod.Method);
        }

        /// <summary>
        /// Appelé quand un événement de service se déclenche
        /// </summary>
        private void OnServiceEventFired(string serviceName, string eventName, object eventArgs)
        {
            try
            {
                var message = new BridgeMessage
                {
                    Type = MessageType.EventFired,
                    ServiceName = serviceName,
                    MethodName = eventName,
                    Result = eventArgs,
                    Success = true
                };

                SendMessageToJavaScript(message);
            }
            catch (Exception ex)
            {
                // Logger l'erreur mais ne pas lancer d'exception pour ne pas casser le service
                Console.WriteLine($"Error sending event {eventName} from service {serviceName}: {ex.Message}");
            }
        }

        /// <summary>
        /// Gère les messages venant de JavaScript
        /// </summary>
        private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var messageJson = e.TryGetWebMessageAsString();
                var message = JsonSerializer.Deserialize<BridgeMessage>(messageJson, _jsonOptions);

                if (message == null)
                {
                    SendErrorResponse(null, "Invalid message format");
                    return;
                }

                switch (message.Type)
                {
                    case MessageType.CallMethod:
                        HandleMethodCall(message);
                        break;

                    case MessageType.SubscribeEvent:
                        HandleEventSubscription(message);
                        break;

                    case MessageType.UnsubscribeEvent:
                        HandleEventUnsubscription(message);
                        break;

                    default:
                        SendErrorResponse(message.MessageId, $"Unknown message type: {message.Type}");
                        break;
                }
            }
            catch (JsonException ex)
            {
                SendErrorResponse(null, $"JSON parsing error: {ex.Message}");
            }
            catch (Exception ex)
            {
                SendErrorResponse(null, $"Unexpected error: {ex.Message}");
            }
        }

        /// <summary>
        /// Gère les appels de méthodes depuis JavaScript
        /// </summary>
        private void HandleMethodCall(BridgeMessage message)
        {
            try
            {
                if (!_services.ContainsKey(message.ServiceName))
                {
                    SendErrorResponse(message.MessageId, $"Service '{message.ServiceName}' not found");
                    return;
                }

                var service = _services[message.ServiceName];
                var serviceType = service.GetType();
                var methodInfo = serviceType.GetMethod(message.MethodName);

                if (methodInfo == null)
                {
                    SendErrorResponse(message.MessageId, $"Method '{message.MethodName}' not found in service '{message.ServiceName}'");
                    return;
                }

                // Convertir les paramètres
                var parameters = ConvertParameters(message.Parameters, methodInfo.GetParameters());

                // Appeler la méthode
                var result = methodInfo.Invoke(service, parameters);

                // Envoyer le résultat
                var responseMessage = new BridgeMessage
                {
                    MessageId = message.MessageId,
                    Type = MessageType.MethodResult,
                    ServiceName = message.ServiceName,
                    MethodName = message.MethodName,
                    Result = result,
                    Success = true
                };

                SendMessageToJavaScript(responseMessage);
            }
            catch (TargetParameterCountException ex)
            {
                SendErrorResponse(message.MessageId, $"Parameter count mismatch: {ex.Message}");
            }
            catch (ArgumentException ex)
            {
                SendErrorResponse(message.MessageId, $"Invalid argument: {ex.Message}");
            }
            catch (Exception ex)
            {
                SendErrorResponse(message.MessageId, $"Method invocation error: {ex.Message}");
            }
        }

        /// <summary>
        /// Convertit les paramètres JSON vers les types C# appropriés
        /// </summary>
        private object[] ConvertParameters(object[] parameters, ParameterInfo[] parameterInfos)
        {
            var result = new object[parameterInfos.Length];

            for (int i = 0; i < parameterInfos.Length; i++)
            {
                if (parameters != null && i < parameters.Length)
                {
                    result[i] = ConvertParameter(parameters[i], parameterInfos[i].ParameterType);
                }
                else if (parameterInfos[i].HasDefaultValue)
                {
                    result[i] = parameterInfos[i].DefaultValue;
                }
                else if (parameterInfos[i].ParameterType.IsValueType)
                {
                    result[i] = Activator.CreateInstance(parameterInfos[i].ParameterType);
                }
            }

            return result;
        }

        /// <summary>
        /// Convertit un paramètre JSON vers un type C#
        /// </summary>
        private object ConvertParameter(object value, Type targetType)
        {
            if (value == null)
                return targetType.IsValueType ? Activator.CreateInstance(targetType) : null;

            // Si le type correspond déjà, retourner la valeur
            if (value.GetType() == targetType)
                return value;

            // Conversion des types primitifs
            if (targetType == typeof(string))
            {
                return value.ToString();
            }

            if (targetType == typeof(int) || targetType == typeof(int?))
            {
                if (value is JsonElement jsonElement)
                {
                    return jsonElement.TryGetInt32(out var intValue) ? intValue : 0;
                }
                return Convert.ToInt32(value);
            }

            if (targetType == typeof(double) || targetType == typeof(double?))
            {
                if (value is JsonElement jsonElement)
                {
                    return jsonElement.TryGetDouble(out var doubleValue) ? doubleValue : 0.0;
                }
                return Convert.ToDouble(value);
            }

            if (targetType == typeof(bool) || targetType == typeof(bool?))
            {
                if (value is JsonElement jsonElement)
                {
                    return jsonElement.TryGetBoolean(out var boolValue) ? boolValue : false;
                }
                return Convert.ToBoolean(value);
            }

            if (targetType == typeof(DateTime) || targetType == typeof(DateTime?))
            {
                if (value is JsonElement jsonElement && jsonElement.TryGetDateTime(out var dateTime))
                {
                    return dateTime;
                }
                if (DateTime.TryParse(value.ToString(), out var parsedDate))
                {
                    return parsedDate;
                }
                return DateTime.MinValue;
            }

            // Pour les types complexes, utiliser la sérialisation JSON
            try
            {
                var json = JsonSerializer.Serialize(value, _jsonOptions);
                return JsonSerializer.Deserialize(json, targetType, _jsonOptions);
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Gère les abonnements aux événements depuis JavaScript
        /// </summary>
        private void HandleEventSubscription(BridgeMessage message)
        {
            try
            {
                var key = (message.ServiceName, message.MethodName);

                if (!_eventSubscriptions.ContainsKey(key))
                {
                    SendErrorResponse(message.MessageId, $"Event '{message.MethodName}' not found in service '{message.ServiceName}'");
                    return;
                }

                // Stocker l'ID d'écouteur pour ce service/événement
                var subscription = _eventSubscriptions[key];
                subscription.ListenerIds.Add(message.ListenerId ?? message.MessageId);

                // Envoyer la confirmation
                var responseMessage = new BridgeMessage
                {
                    MessageId = message.MessageId,
                    Type = MessageType.MethodResult,
                    Result = new { listenerId = message.ListenerId ?? message.MessageId },
                    Success = true
                };

                SendMessageToJavaScript(responseMessage);
            }
            catch (Exception ex)
            {
                SendErrorResponse(message.MessageId, $"Event subscription error: {ex.Message}");
            }
        }

        /// <summary>
        /// Gère les désabonnements aux événements depuis JavaScript
        /// </summary>
        private void HandleEventUnsubscription(BridgeMessage message)
        {
            try
            {
                var listenerId = message.ListenerId ?? message.MessageId;

                // Trouver et supprimer l'écouteur
                foreach (var subscription in _eventSubscriptions.Values)
                {
                    if (subscription.ListenerIds.Remove(listenerId))
                    {
                        break;
                    }
                }

                // Envoyer la confirmation
                var responseMessage = new BridgeMessage
                {
                    MessageId = message.MessageId,
                    Type = MessageType.MethodResult,
                    Success = true
                };

                SendMessageToJavaScript(responseMessage);
            }
            catch (Exception ex)
            {
                SendErrorResponse(message.MessageId, $"Event unsubscription error: {ex.Message}");
            }
        }

        /// <summary>
        /// Envoie un message à JavaScript
        /// </summary>
        private void SendMessageToJavaScript(BridgeMessage message)
        {
            if (_isDisposed)
                return;

            try
            {
                var jsonMessage = JsonSerializer.Serialize(message, _jsonOptions);
                _webView.Dispatcher.Invoke(() =>
                {
                    if (_webView.CoreWebView2 != null)
                    {
                        _webView.CoreWebView2.PostWebMessageAsString(jsonMessage);
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending message to JavaScript: {ex.Message}");
            }
        }

        /// <summary>
        /// Envoie une réponse d'erreur à JavaScript
        /// </summary>
        private void SendErrorResponse(string messageId, string error)
        {
            var errorMessage = new BridgeMessage
            {
                MessageId = messageId,
                Type = MessageType.ErrorResponse,
                Error = error,
                Success = false
            };

            SendMessageToJavaScript(errorMessage);
        }

        /// <summary>
        /// Libère les ressources
        /// </summary>
        public void Dispose()
        {
            if (_isDisposed)
                return;

            _isDisposed = true;

            // Se désabonner des événements
            foreach (var kvp in _eventSubscriptions)
            {
                var subscription = kvp.Value;
                try
                {
                    foreach (var handler in subscription.Handlers)
                    {
                        subscription.EventInfo.RemoveEventHandler(subscription.ServiceInstance, handler);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error removing event handler: {ex.Message}");
                }
            }

            _eventSubscriptions.Clear();
            _services.Clear();
            _pendingCalls.Clear();

            if (_webView.CoreWebView2 != null)
            {
                _webView.CoreWebView2.WebMessageReceived -= OnWebMessageReceived;
            }
        }
    }

    /// <summary>
    /// Informations sur un abonnement à un événement
    /// </summary>
    internal class EventSubscription
    {
        public string EventName { get; set; }
        public object ServiceInstance { get; set; }
        public EventInfo EventInfo { get; set; }
        public List<Delegate> Handlers { get; set; } = new List<Delegate>();
        public List<string> ListenerIds { get; set; } = new List<string>();
    }
}
```

### Fichier 3 : `src/Extensions/WebViewExtensions.cs`

```csharp
using Microsoft.Web.WebView2.Wpf;
using System;
using System.Threading.Tasks;
using WpfReactBridge.Core;

namespace WpfReactBridge.Extensions
{
    /// <summary>
    /// Extensions pour faciliter l'utilisation du ServiceBridge avec WebView2
    /// </summary>
    public static class WebViewExtensions
    {
        /// <summary>
        /// Crée et retourne un ServiceBridge pour cette WebView2
        /// </summary>
        /// <param name="webView">Instance WebView2</param>
        /// <returns>Instance de ServiceBridge</returns>
        public static async Task<ServiceBridge> CreateServiceBridgeAsync(this WebView2 webView)
        {
            if (webView == null)
                throw new ArgumentNullException(nameof(webView));

            // S'assurer que WebView2 est initialisé
            await webView.EnsureCoreWebView2Async();

            return new ServiceBridge(webView);
        }

        /// <summary>
        /// Crée un ServiceBridge et enregistre automatiquement les services spécifiés
        /// </summary>
        /// <param name="webView">Instance WebView2</param>
        /// <param name="services">Dictionnaire de nom -> instance de service</param>
        /// <returns>Instance de ServiceBridge configurée</returns>
        public static async Task<ServiceBridge> CreateServiceBridgeAsync(
            this WebView2 webView, 
            params (string serviceName, object serviceInstance)[] services)
        {
            var bridge = await CreateServiceBridgeAsync(webView);

            foreach (var (serviceName, serviceInstance) in services)
            {
                bridge.RegisterService(serviceName, serviceInstance);
            }

            return bridge;
        }
    }
}
```

### Fichier 4 : `src/WpfReactBridge.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net6.0-windows</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <RootNamespace>WpfReactBridge</RootNamespace>
    <Version>1.0.0</Version>
    <Authors>Your Name</Authors>
    <Description>Bridge for communication between WPF (C#) and React (JavaScript) via WebView2</Description>
    <PackageTags>WPF;WebView2;React;JavaScript;Bridge;Interoperability</PackageTags>
    <PackageProjectUrl>https://github.com/yourusername/WpfReactBridge</PackageProjectUrl>
    <RepositoryUrl>https://github.com/yourusername/WpfReactBridge.git</RepositoryUrl>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2277.86" />
    <PackageReference Include="System.Text.Json" Version="8.0.0" />
  </ItemGroup>

</Project>
```

---

📋 **Librairie JavaScript - @wpf-react-bridge/client (NPM Package)**

### Fichier 1 : `src/types/index.ts`

```typescript
/**
 * Types de messages supportés par le bridge
 */
export enum MessageType {
  RegisterService = 0,
  CallMethod = 1,
  MethodResult = 2,
  SubscribeEvent = 3,
  UnsubscribeEvent = 4,
  EventFired = 5,
  ErrorResponse = 6
}

/**
 * Métadonnées d'un paramètre de méthode
 */
export interface ParameterMetadata {
  name: string;
  type: string;
}

/**
 * Métadonnées d'une méthode
 */
export interface MethodMetadata {
  name: string;
  parameters: ParameterMetadata[];
  returnType: string;
}

/**
 * Métadonnées d'enregistrement d'un service
 */
export interface ServiceRegistration {
  serviceName: string;
  methods: MethodMetadata[];
  events: string[];
}

/**
 * Message de base pour la communication
 */
export interface BridgeMessage {
  messageId?: string;
  type: MessageType;
  serviceName?: string;
  methodName?: string;
  listenerId?: string;
  parameters?: any[];
  result?: any;
  error?: string;
  success: boolean;
}

/**
 * Options de configuration du BridgeClient
 */
export interface BridgeClientOptions {
  /**
   * Timeout par défaut pour les appels de méthodes (en ms)
   * @default 30000
   */
  methodTimeout?: number;

  /**
   * Activer le mode debug pour logger les messages
   * @default false
   */
  debug?: boolean;

  /**
   * Callback appelé quand le client est initialisé
   */
  onInitialized?: () => void;

  /**
   * Callback appelé quand une erreur survient
   */
  onError?: (error: Error) => void;
}

/**
 * Proxy de service générique
 */
export interface ServiceProxy {
  _serviceName: string;
  _events: Map<string, Set<string>>;
  [key: string]: any;
}

/**
 * Options d'abonnement à un événement
 */
export interface EventSubscriptionOptions {
  /**
   * Callback appelé quand l'événement se déclenche
   */
  callback: (eventData: any) => void;

  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;
}
```

### Fichier 2 : `src/BridgeClient.ts`

```typescript
import {
  BridgeMessage,
  MessageType,
  ServiceRegistration,
  BridgeClientOptions,
  ServiceProxy,
  EventSubscriptionOptions
} from './types';

/**
 * Client principal pour la communication avec le bridge C#
 * S'initialise automatiquement quand il détecte qu'il tourne dans une WebView2
 */
export class BridgeClient {
  private static instance: BridgeClient | null = null;
  private services: Map<string, ServiceProxy> = new Map();
  private pendingCalls: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private messageIdCounter = 0;
  private isInitialized = false;
  private isInWebView2 = false;
  private options: Required<BridgeClientOptions>;
  private debug: boolean;

  private constructor(options: BridgeClientOptions = {}) {
    this.options = {
      methodTimeout: options.methodTimeout ?? 30000,
      debug: options.debug ?? false,
      onInitialized: options.onInitialized ?? (() => {}),
      onError: options.onError ?? ((error) => console.error('[BridgeClient]', error))
    };
    this.debug = this.options.debug;
  }

  /**
   * Retourne l'instance singleton du BridgeClient
   */
  public static getInstance(options?: BridgeClientOptions): BridgeClient {
    if (!BridgeClient.instance) {
      BridgeClient.instance = new BridgeClient(options);
      BridgeClient.instance.initialize();
    }
    return BridgeClient.instance;
  }

  /**
   * Initialise le client et détecte si on est dans une WebView2
   */
  private initialize(): void {
    this.detectWebView2();

    if (this.isInWebView2) {
      this.setupMessageListener();
      this.isInitialized = true;
      this.log('BridgeClient initialized in WebView2 mode');
      this.options.onInitialized();
    } else {
      this.log('BridgeClient initialized in standalone mode (no WebView2 detected)');
      this.isInitialized = true;
      this.options.onInitialized();
    }
  }

  /**
   * Détecte si l'application tourne dans une WebView2
   */
  private detectWebView2(): void {
    this.isInWebView2 = !!(window as any).chrome?.webview;
    this.log(`WebView2 detected: ${this.isInWebView2}`);
  }

  /**
   * Configure l'écouteur de messages venant de C#
   */
  private setupMessageListener(): void {
    if (!(window as any).chrome?.webview) {
      this.log('No chrome.webview available, skipping message listener');
 return    anyviewmessage: {
 {
Message.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.logError('Error parsing message:', error);
        this.options.onError(new Error(`Failed to parse message: ${error}`));
      }
    });
  }

  /**
   * Gère les messages venant de C#
   */
  private handleMessage(message: BridgeMessage): void {
    this.log('Received message:', message);

    switch (message.type) {
      case MessageType.RegisterService:
        this.handleServiceRegistration(message);
        break;

      case MessageType.MethodResult:
        this.handleMethodResult        caseF       Event(message        break;

      case MessageType.ErrorResponse:
        this.handleErrorResponse(message);
        break;

      default:
        this.logError('Unknown message type:', message.type);
        break;
    }
  }

  /**
   * Gère l'enregistrement d'un nouveau service
   */
  private handleServiceRegistration(message: BridgeMessage): void {
    const registration: ServiceRegistration = message.result;
    this.log(`Service registered: ${registration.serviceName}`);

    // Créer un proxy pour ce service
    const proxy = this.createServiceProxy(registration);
    this.services.set(registration.serviceName, proxy);

    this.log(`Service proxy created for: ${registration.serviceName}`, proxy);
  }

  /**
   * Crée un proxy pour un service
   */
  private createServiceProxy(registration: ServiceRegistration): ServiceProxy {
    const proxy: ServiceProxy = {
      _serviceName: registration.serviceName,
      _events: new Map()
    };

    // Créer les méthodes
    registration.methods.forEach((method) => {
      proxy[method.name] = async (...args: any[]) => {
        return await this.callMethod(
          registration.serviceName,
          method.name,
          args
        );
      };
    });

    // Créer les méthodes d'abonnement aux événements
    registration.events.forEach((eventName) => {
      const onEventName = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;
      const offEventName = `off${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;

      proxy[onEventName] = (callback: (eventData: any) => void) => {
        return this.subscribeToEvent(
          registration.serviceName,
          eventName,
          callback
        );
      };

      proxy[offEventName] = (listenerId: string) => {
        this.unsubscribeFromEvent(listenerId);
      };
    });

    return proxy;
  }

  /**
   * Appelle une méthode d'un service C#
   */
  private async callMethod(
    serviceName: string,
    methodName: string,
    parameters: any[]
  ): Promise<any> {
    if (!this.isInWebView2) {
      throw new Error('Not in WebView2 environment');
    }

    return new Promise((resolve, reject) => {
      const messageId = `msg_${this.messageIdCounter++}`;
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(messageId);
        reject(new Error(`Method call timeout after ${this.options.methodTimeout}ms`));
      }, this.options.methodTimeout);

      this.pendingCalls.set(messageId, { resolve, reject, timeout });

      const message: BridgeMessage = {
        messageId,
        type: MessageType.CallMethod,
        serviceName,
        methodName,
        parameters
      };

      this.sendMessage(message);
    });
  }

  /**
   * S'abonne à un événement d'un service
   */
  private subscribeToEvent(
    serviceName: string,
    eventName: string,
    callback: (eventData: any) => void
  ): string {
    if (!this.isInWebView2) {
      throw new Error('Not in WebView2 environment');
    }

    const listenerId = `evt_${this.messageIdCounter++}`;

    // Stocker le callback
    if (!this.eventListeners.has(listenerId)) {
      this.eventListeners.set(listenerId, new Set());
    }
    this.eventListeners.get(listenerId)!.add(callback);

    const message: BridgeMessage = {
      type: MessageType.SubscribeEvent,
      serviceName,
      methodName: eventName,
      listenerId
    };

    this.sendMessage(message);

    return listenerId;
  }

  /**
   * Se désabonne d'un événement
   */
  private unsubscribeFromEvent(listenerId: string): void {
    if (!this.isInWebView2) {
      return;
    }

    // Supprimer les callbacks
    this.eventListeners.delete(listenerId);

    const message: BridgeMessage = {
      type: MessageType.UnsubscribeEvent,
      listenerId
    };

    this.sendMessage(message);
  }

  /**
   * Gère le résultat d'un appel de méthode
   */
  private handleMethodResult(message: BridgeMessage): void {
    const { messageId, result, success, error } = message;
    const pending = this.pendingCalls.get(messageId);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingCalls.delete(messageId);

      if (success) {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error || 'Method call failed'));
      }
    }
  }

  /**
   * Gère un événement déclenché par C#
   */
  private handleEventFired(message: BridgeMessage): void {
    const { listenerId, result } = message;
    const listeners = this.eventListeners.get(listenerId);

    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(result);
        } catch (error) {
          this.logError('Error in event callback:', error);
          this.options.onError(new Error(`Event callback error: ${error}`));
        }
      });
    }
  }

  /**
   * Gère un message d'erreur
   */
  private handleErrorResponse(message: BridgeMessage): void {
    const { error } = message;
    this.logError('Bridge error:', error);
    this.options.onError(new Error(error || 'Unknown bridge error'));
  }

  /**
   * Envoie un message à C#
   */
  private sendMessage(message: BridgeMessage): void {
    if (!this.isInWebView2) {
      this.log('Not in WebView2, skipping message send');
      return;
    }

    try {
      const messageJson = JSON.stringify(message);
      (window as any).chrome.webview.postMessage(messageJson);
      this.log('Sent message:', message);
    } catch (error) {
      this.logError('Error sending message:', error);
      this.options.onError(new Error(`Failed to send message: ${error}`));
    }
  }

  /**
   * Retourne un proxy de service
   */
  public getService(serviceName: string): ServiceProxy | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Vérifie si un service est disponible
   */
  public hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * Attend qu'un service soit disponible
   */
  public async waitForService(
    serviceName: string,
    timeout: number = 10000
  ): Promise<ServiceProxy> {
    return new Promise((resolve, reject) => {
      if (this.services.has(serviceName)) {
        resolve(this.services.get(serviceName)!);
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`Service '${serviceName}' not available after ${timeout}ms`));
      }, timeout);

      const checkInterval = setInterval(() => {
        if (this.services.has(serviceName)) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          resolve(this.services.get(serviceName)!);
        }
      }, 100);
    });
  }

  /**
   * Logger en mode debug
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[BridgeClient]', ...args);
    }
  }

  /**
   * Logger d'erreurs en mode debug
   */
  private logError(...args: any[]): void {
    if (this.debug) {
      console.error('[BridgeClient]', ...args);
    }
  }

  /**
   * Réinitialise le client (pour les tests)
   */
  public static reset(): void {
    if (BridgeClient.instance) {
      BridgeClient.instance = null;
    }
  }
}
```

### Fichier 3 : `src/index.ts`

```typescript
export { BridgeClient } from './BridgeClient';
export * from './types';

/**
 * Instance singleton du BridgeClient
 */
export const bridgeClient = BridgeClient.getInstance();

/**
 * Hook pour utiliser un service dans React
 */
export function useService(serviceName: string) {
  const [service, setService] = React.useState<any>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout;

    async function loadService() {
      try {
        const serviceProxy = await bridgeClient.waitForService(serviceName);
        if (mounted) {
          setService(serviceProxy);
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsReady(false);
        }
      }
    }

    loadService();

    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [serviceName]);

  return { service, isReady, error };
}
```

### Fichier 4 : `package.json`

```json
{
  "name": "@wpf-react-bridge/client",
  "version": "1.0.0",
  "description": "JavaScript client for WPF-React bridge communication via WebView2",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "wpf",
    "react",
    "webview2",
    "bridge",
    "interoperability",
    "csharp"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/wpf-react-bridge-client.git"
  },
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "react": "^18.0.0",
    "@types/react": "^18.0.0"
  },
  "files": [
    "dist",
    "README.md",
    "package.json"
  ]
}
```

### Fichier 5 : `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

📋 **Exemple d'utilisation**

### Côté C# (dans ton application WPF)

```csharp
using Microsoft.Web.WebView2.Wpf;
using System.Windows;
using WpfReactBridge.Core;
using WpfReactBridge.Extensions;

public partial class MainWindow : Window
{
    private ServiceBridge _bridge;
    private DisplayService _displayService;

    public MainWindow()
    {
        InitializeComponent();
        InitializeAsync();
    }

    private async void InitializeAsync()
    {
        // Initialiser WebView2
        await webView.EnsureCoreWebView2Async();

        // Créer le bridge et enregistrer les services
        _bridge = await webView.CreateServiceBridgeAsync();
        
        _displayService = new DisplayService();
        _bridge.RegisterService<IDisplayService>("DisplayService", _displayService);

        // Charger l'application React
        webView.Source = new Uri("http://localhost:3000");
    }
}
```

### Côté JavaScript (dans ton application React)

```javascript
import { bridgeClient, useService } from '@wpf-react-bridge/client';

function DisplayManager() {
    const { service: displayService, isReady } = useService('DisplayService');

    useEffect(() => {
        if (isReady && displayService) {
            // S'abonner aux changements
            const listenerId = displayService.onDisplaysChanged((displays) => {
                console.log('Displays changed:', displays);
            });

            return () => {
                displayService.offDisplaysChanged(listenerId);
            };
        }
    }, [isReady, displayService]);

    const handleAddDisplay = async () => {
        await displayService.Add({
            name: 'Display 1',
            resolution: '1920x1080',
            isActive: true
        });
    };

    if (!isReady) return <div>Loading...</div>;

    return (
        <button onClick={handleAddDisplay}>Add Display</button>
    );
}
```

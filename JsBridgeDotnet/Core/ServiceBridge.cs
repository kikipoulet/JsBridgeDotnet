using Microsoft.Web.WebView2.Wpf;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Windows.Threading;

namespace JsBridgeDotnet.Core
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
                PropertyNameCaseInsensitive = true,
                Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
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
        /// Enregistre un service et le rend disponible pour JavaScript
        /// </summary>
        /// <param name="serviceName">Nom unique du service pour l'identifier côté JavaScript</param>
        /// <param name="serviceInstance">Instance du service à exposer</param>
        public void RegisterService(string serviceName, object serviceInstance)
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

            // Récupérer les événements publics (sauf PropertyChanged)
            var events = serviceType.GetEvents(BindingFlags.Public | BindingFlags.Instance)
                .Where(e => e.DeclaringType != typeof(object) && e.Name != "PropertyChanged")
                .Select(e => e.Name)
                .ToArray();

            // Récupérer les propriétés publiques
            var properties = serviceType.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => p.DeclaringType != typeof(object) &&
                           p.GetIndexParameters().Length == 0 &&
                           p.CanRead)
                .Select(p => new PropertyMetadata
                {
                    Name = p.Name,
                    Type = GetSimpleTypeName(p.PropertyType),
                    Value = TryGetPropertyValue(serviceInstance: null, p)
                })
                .ToArray();

            // Vérifier si le service implémente INotifyPropertyChanged
            var supportsPropertyChanged = typeof(System.ComponentModel.INotifyPropertyChanged).IsAssignableFrom(serviceType);

            return new ServiceRegistration
            {
                ServiceName = serviceName,
                Methods = methods,
                Events = events,
                Properties = properties,
                SupportsPropertyChanged = supportsPropertyChanged
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
                .Where(e => e.DeclaringType != typeof(object) && e.Name != "PropertyChanged");

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

            // S'abonner à PropertyChanged si le service implémente INotifyPropertyChanged
            if (typeof(System.ComponentModel.INotifyPropertyChanged).IsAssignableFrom(serviceType))
            {
                SubscribeToPropertyChanged(serviceName, serviceInstance);
            }
        }

        /// <summary>
        /// S'abonne à l'événement PropertyChanged
        /// </summary>
        private void SubscribeToPropertyChanged(string serviceName, object serviceInstance)
        {
            var propertyChangedEvent = typeof(System.ComponentModel.INotifyPropertyChanged).GetEvent("PropertyChanged");
            var key = (serviceName, "PropertyChanged");

            if (!_eventSubscriptions.ContainsKey(key))
            {
                var subscription = new EventSubscription
                {
                    EventName = "PropertyChanged",
                    ServiceInstance = serviceInstance,
                    EventInfo = propertyChangedEvent,
                    Handlers = new List<Delegate>()
                };

                _eventSubscriptions[key] = subscription;

                // Créer un handler spécial pour PropertyChanged
                var handler = new System.ComponentModel.PropertyChangedEventHandler((sender, args) =>
                {
                    OnPropertyChangedFired(serviceName, args.PropertyName, serviceInstance);
                });

                propertyChangedEvent.AddEventHandler(serviceInstance, handler);
                subscription.Handlers.Add(handler);
            }
        }

        /// <summary>
        /// Appelé quand une propriété change
        /// </summary>
        private void OnPropertyChangedFired(string serviceName, string propertyName, object serviceInstance)
        {
            try
            {
                var propertyInfo = serviceInstance.GetType().GetProperty(propertyName);
                if (propertyInfo == null)
                    return;

                var value = TryGetPropertyValue(serviceInstance, propertyInfo);

                var message = new BridgeMessage
                {
                    Type = MessageType.PropertyChangeFired,
                    ServiceName = serviceName,
                    MethodName = propertyName,
                    Result = new
                    {
                        PropertyName = propertyName,
                        Value = value
                    },
                    Success = true
                };

                SendMessageToJavaScript(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending property change {propertyName} from service {serviceName}: {ex.Message}");
            }
        }

        /// <summary>
        /// Tente de récupérer la valeur d'une propriété de manière sécurisée
        /// </summary>
        private object TryGetPropertyValue(object serviceInstance, PropertyInfo propertyInfo)
        {
            try
            {
                if (serviceInstance != null)
                {
                    return propertyInfo.GetValue(serviceInstance);
                }
                return GetDefaultValue(propertyInfo.PropertyType);
            }
            catch
            {
                return GetDefaultValue(propertyInfo.PropertyType);
            }
        }

        /// <summary>
        /// Retourne la valeur par défaut d'un type
        /// </summary>
        private object GetDefaultValue(Type type)
        {
            if (type.IsValueType)
                return Activator.CreateInstance(type);
            return null;
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
            
            // Créer les paramètres de l'expression lambda
            var lambdaParams = parameters.Select(p => Expression.Parameter(p.ParameterType, p.Name)).ToArray();
            
            // Créer une expression qui appelle OnServiceEventFired
            // Le premier paramètre est le sender (object), le second sont les args
            var argsValue = Expression.Convert(lambdaParams[1], typeof(object));
            
            // Créer une méthode qui sera appelée quand l'événement se déclenche
            var targetMethod = new Action<object, object>((sender, args) =>
            {
                OnServiceEventFired(serviceName, eventName, args);
            });

            var callExpression = Expression.Call(
                Expression.Constant(targetMethod.Target),
                targetMethod.Method,
                Expression.Convert(lambdaParams[0], typeof(object)),
                argsValue);

            var lambda = Expression.Lambda(eventType, callExpression, lambdaParams);
            return lambda.Compile();
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
        private void OnWebMessageReceived(object sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
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
                Console.WriteLine($"[C#] HandleMethodCall - Service: {message.ServiceName}, Method: {message.MethodName}, MessageId: {message.MessageId}");
                
                if (!_services.ContainsKey(message.ServiceName))
                {
                    Console.WriteLine($"[C#] Service '{message.ServiceName}' not found");
                    SendErrorResponse(message.MessageId, $"Service '{message.ServiceName}' not found");
                    return;
                }

                var service = _services[message.ServiceName];
                var serviceType = service.GetType();
                var methodInfo = serviceType.GetMethod(message.MethodName);

                if (methodInfo == null)
                {
                    Console.WriteLine($"[C#] Method '{message.MethodName}' not found in service '{message.ServiceName}'");
                    SendErrorResponse(message.MessageId, $"Method '{message.MethodName}' not found in service '{message.ServiceName}'");
                    return;
                }

                // Convertir les paramètres
                var parameters = ConvertParameters(message.Parameters, methodInfo.GetParameters());

                // Appeler la méthode
                Console.WriteLine($"[C#] Invoking method {message.MethodName} with {parameters.Length} parameters");
                var result = methodInfo.Invoke(service, parameters);
                Console.WriteLine($"[C#] Method result: {result}");

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

                Console.WriteLine($"[C#] Sending response with MessageId: {responseMessage.MessageId}");
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
                    return jsonElement.GetBoolean();
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

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
using Microsoft.Extensions.DependencyInjection;

namespace JsBridgeDotnet.Core
{
    /// <summary>
    /// Cycle de vie d'un service enregistré
    /// </summary>
    public enum ServiceLifetime
    {
        /// <summary>
        /// Une seule instance partagée entre tous les appels
        /// </summary>
        Singleton,
        
        /// <summary>
        /// Une nouvelle instance est créée à chaque demande
        /// </summary>
        Transient
    }

    /// <summary>
    /// Informations sur un service enregistré
    /// </summary>
    internal class ServiceRegistrationInfo
    {
        public Type ServiceType { get; set; }
        public ServiceLifetime Lifetime { get; set; }
        public object? SingletonInstance { get; set; }
        public ConcurrentDictionary<string, WeakReference<object>> TransientInstances { get; set; } = new();
    }

    /// <summary>
    /// Bridge principal pour la communication entre C# et JavaScript
    /// Expose les services C# à JavaScript sans modification du code des services
    /// </summary>
    public class ServiceBridge : IDisposable
    {
        private readonly IWebMessageHandler _messageHandler;
        private readonly IServiceProvider? _serviceProvider;
        private readonly IServiceCollection? _serviceCollection;
        private readonly Dictionary<string, ServiceRegistrationInfo> _serviceRegistrations;
        private readonly ConcurrentDictionary<string, Action<object>> _pendingCalls;
        private readonly Dictionary<(string service, string eventName, string instanceId), EventSubscription> _eventSubscriptions;
        public readonly JsonSerializerOptions _jsonOptions;
        private bool _isDisposed;

#if DEBUG
        /// <summary>
        /// Événement déclenché quand un message est envoyé à JavaScript
        /// </summary>
        public event Action<DebugLogEntry> MessageSent;

        /// <summary>
        /// Événement déclenché quand un message est reçu de JavaScript
        /// </summary>
        public event Action<DebugLogEntry> MessageReceived;

        /// <summary>
        /// Événement déclenché quand une méthode est appelée
        /// </summary>
        public event Action<DebugLogEntry> MethodCalled;

        /// <summary>
        /// Événement déclenché quand une méthode retourne un résultat
        /// </summary>
        public event Action<DebugLogEntry> MethodCompleted;

        /// <summary>
        /// Événement déclenché quand un événement C# est déclenché
        /// </summary>
        public event Action<DebugLogEntry> EventFired;

        /// <summary>
        /// Événement déclenché quand une erreur survient
        /// </summary>
        public event Action<DebugLogEntry> ErrorOccurred;
#endif

        public ServiceBridge(IWebMessageHandler messageHandler, IServiceProvider? serviceProvider = null, IServiceCollection? serviceCollection = null)
        {
            _messageHandler = messageHandler ?? throw new ArgumentNullException(nameof(messageHandler));
            _serviceProvider = serviceProvider;
            _serviceCollection = serviceCollection;
            _serviceRegistrations = new Dictionary<string, ServiceRegistrationInfo>(StringComparer.OrdinalIgnoreCase);
            _pendingCalls = new ConcurrentDictionary<string, Action<object>>();
            _eventSubscriptions = new Dictionary<(string service, string eventName, string instanceId), EventSubscription>();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true,
                Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
            };

            if (_serviceCollection != null)
            {
                ScanForJsServices();
            }

            if (!_messageHandler.IsInitialized)
            {
                throw new InvalidOperationException("MessageHandler must be initialized before creating ServiceBridge. Call InitializeAsync() first.");
            }

            _messageHandler.MessageReceived += OnWebMessageReceived;
        }

        /// <summary>
        /// Scanne le ServiceCollection pour trouver automatiquement tous les services marqués avec [JsService]
        /// </summary>
        private void ScanForJsServices()
        {
            if (_serviceCollection == null)
                return;

            var registeredServices = new List<Type>();

            foreach (var descriptor in _serviceCollection)
            {
                var serviceType = descriptor.ServiceType;
                var jsServiceAttribute = serviceType.GetCustomAttributes(typeof(JsServiceAttribute), false)
                    .FirstOrDefault() as JsServiceAttribute;

                if (jsServiceAttribute != null)
                {
                    var serviceName = jsServiceAttribute.ServiceName;

                    if (_serviceRegistrations.ContainsKey(serviceName))
                    {
                        Console.WriteLine($"[ServiceBridge] Service '{serviceName}' already registered, skipping");
                        continue;
                    }

                    var registration = new ServiceRegistrationInfo
                    {
                        ServiceType = serviceType,
                        Lifetime = descriptor.Lifetime == Microsoft.Extensions.DependencyInjection.ServiceLifetime.Singleton
                            ? Core.ServiceLifetime.Singleton
                            : Core.ServiceLifetime.Transient
                    };

                    _serviceRegistrations[serviceName] = registration;
                    registeredServices.Add(serviceType);
                    Console.WriteLine($"[ServiceBridge] Auto-registered service '{serviceName}' ({serviceType.Name})");
                }
            }

            Console.WriteLine($"[ServiceBridge] Auto-registered {registeredServices.Count} services from DI container");
        }

        /// <summary>
        /// Enregistre manuellement un service pour l'exposer à JavaScript
        /// Le service doit être marqué avec l'attribut [JsService]
        /// Note: Si ServiceCollection est passé au constructeur, tous les services [JsService] sont auto-scannés
        /// Cette méthode n'est nécessaire que pour les cas spéciaux
        /// </summary>
        /// <typeparam name="T">Type du service à enregistrer</typeparam>
        public void RegisterService<T>() where T : class
        {
            var serviceType = typeof(T);

            var jsServiceAttribute = serviceType.GetCustomAttributes(typeof(JsServiceAttribute), false)
                .FirstOrDefault() as JsServiceAttribute;

            if (jsServiceAttribute == null)
                throw new InvalidOperationException($"Service {serviceType.Name} is not marked with [JsService] attribute");

            var serviceName = jsServiceAttribute.ServiceName;

            var registration = new ServiceRegistrationInfo
            {
                ServiceType = serviceType
            };

            _serviceRegistrations[serviceName] = registration;

            Console.WriteLine($"[ServiceBridge] Manually registered service '{serviceName}' ({serviceType.Name})");
        }

        /// <summary>
        /// Renvoie les métadonnées d'un service demandé par JavaScript (lazy loading)
        /// </summary>
        private void GetServiceMetadata(string serviceName, string messageId, string instanceId = null)
        {
            try
            {
                if (!_serviceRegistrations.ContainsKey(serviceName))
                {
                    SendErrorResponse(messageId, $"Service '{serviceName}' not found");
                    return;
                }

                var registrationInfo = _serviceRegistrations[serviceName];
                object? serviceInstance;
                string? actualInstanceId = null;

                if (string.IsNullOrEmpty(instanceId))
                {
                    if (_serviceProvider == null)
                    {
                        SendErrorResponse(messageId, $"Service '{serviceName}' not initialized. IServiceProvider not provided.");
                        return;
                    }

                    if (registrationInfo.Lifetime == ServiceLifetime.Singleton)
                    {
                        serviceInstance = _serviceProvider.GetService(registrationInfo.ServiceType);
                        if (serviceInstance == null)
                        {
                            SendErrorResponse(messageId, $"Service '{registrationInfo.ServiceType.Name}' could not be resolved from DI container");
                            return;
                        }

                        actualInstanceId = null;

                        if (registrationInfo.SingletonInstance == null)
                        {
                            SubscribeToServiceEvents(serviceName, registrationInfo.ServiceType, serviceInstance, null);
                            registrationInfo.SingletonInstance = serviceInstance;
                        }
                    }
                    else // Transient
                    {
                        serviceInstance = _serviceProvider.GetService(registrationInfo.ServiceType);
                        if (serviceInstance == null)
                        {
                            SendErrorResponse(messageId, $"Service '{registrationInfo.ServiceType.Name}' could not be resolved from DI container");
                            return;
                        }

                        actualInstanceId = Guid.NewGuid().ToString();

                        registrationInfo.TransientInstances.TryAdd(actualInstanceId,
                            new WeakReference<object>(serviceInstance, trackResurrection: false));

                        SubscribeToServiceEvents(serviceName, registrationInfo.ServiceType, serviceInstance, actualInstanceId);
                    }
                }
                else
                {
                    actualInstanceId = instanceId;
                    serviceInstance = GetTransientInstance(serviceName, instanceId);

                    if (serviceInstance == null)
                    {
                        SendErrorResponse(messageId, $"Transient instance '{instanceId}' not found or was garbage collected");
                        return;
                    }
                }

                var lifetime = actualInstanceId == null ? ServiceLifetime.Singleton : ServiceLifetime.Transient;
                var registration = GenerateServiceMetadata(serviceName, serviceInstance.GetType(), serviceInstance, actualInstanceId, lifetime);

                var responseMessage = new BridgeMessage
                {
                    MessageId = messageId,
                    Type = MessageType.MethodResult,
                    ServiceName = serviceName,
                    InstanceId = actualInstanceId,
                    Result = registration,
                    Success = true
                };

                SendMessageToJavaScript(responseMessage);
            }
            catch (Exception ex)
            {
                SendErrorResponse(messageId, $"Error getting service metadata: {ex.Message}");
            }
        }

        /// <summary>
        /// Récupère une instance transient existante
        /// </summary>
        private object GetTransientInstance(string serviceName, string instanceId)
        {
            if (!_serviceRegistrations.ContainsKey(serviceName))
                return null;

            var registrationInfo = _serviceRegistrations[serviceName];
            if (registrationInfo.TransientInstances.TryGetValue(instanceId, out var weakRef))
            {
                if (weakRef.TryGetTarget(out var instance))
                {
                    return instance;
                }
                else
                {
                    // Instance a été GC, la nettoyer
                    registrationInfo.TransientInstances.TryRemove(instanceId, out _);
                }
            }
            return null;
        }

        /// <summary>
        /// Génère les métadonnées du service pour JavaScript
        /// </summary>
        private ServiceRegistration GenerateServiceMetadata(string serviceName, Type serviceType, object serviceInstance, string instanceId, ServiceLifetime lifetime)
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
                    Value = TryGetPropertyValue(serviceInstance, p),
                    IsObservableCollection = typeof(System.Collections.Specialized.INotifyCollectionChanged)
                        .IsAssignableFrom(p.PropertyType)
                })
                .ToArray();

            // Vérifier si le service implémente INotifyPropertyChanged
            var supportsPropertyChanged = typeof(System.ComponentModel.INotifyPropertyChanged).IsAssignableFrom(serviceType);

            // Générer automatiquement les événements pour les collections observables
            var collectionEvents = properties
                .Where(p => p.IsObservableCollection)
                .Select(p => $"{p.Name}Changed")
                .ToArray();

            // Fusionner les événements manuels et automatiques
            events = events.Concat(collectionEvents).ToArray();

            return new ServiceRegistration
            {
                ServiceName = serviceName,
                InstanceId = instanceId,
                Lifetime = lifetime.ToString(),
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
        private void SubscribeToServiceEvents(string serviceName, Type serviceType, object serviceInstance, string instanceId)
        {
            var events = serviceType.GetEvents(BindingFlags.Public | BindingFlags.Instance)
                .Where(e => e.DeclaringType != typeof(object) && e.Name != "PropertyChanged");

            foreach (var eventInfo in events)
            {
                var key = (serviceName, eventInfo.Name, instanceId);

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
                    var eventHandler = CreateEventHandler(eventInfo, serviceName, eventInfo.Name, instanceId);
                    eventInfo.AddEventHandler(serviceInstance, eventHandler);
                    subscription.Handlers.Add(eventHandler);
                }
            }

            // S'abonner à PropertyChanged si le service implémente INotifyPropertyChanged
            if (typeof(System.ComponentModel.INotifyPropertyChanged).IsAssignableFrom(serviceType))
            {
                SubscribeToPropertyChanged(serviceName, serviceInstance, instanceId);
            }
            
            // S'abonner aux changements de collection (ObservableCollection)
            SubscribeToCollectionChanges(serviceName, serviceType, serviceInstance, instanceId);
        }

        /// <summary>
        /// S'abonne à l'événement PropertyChanged
        /// </summary>
        private void SubscribeToPropertyChanged(string serviceName, object serviceInstance, string instanceId)
        {
            var propertyChangedEvent = typeof(System.ComponentModel.INotifyPropertyChanged).GetEvent("PropertyChanged");
            var key = (serviceName, "PropertyChanged", instanceId);

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
                    OnPropertyChangedFired(serviceName, args.PropertyName, serviceInstance, instanceId);
                });

                propertyChangedEvent.AddEventHandler(serviceInstance, handler);
                subscription.Handlers.Add(handler);
            }
        }

        /// <summary>
        /// S'abonne aux changements de collection (ObservableCollection)
        /// </summary>
        private void SubscribeToCollectionChanges(string serviceName, Type serviceType, object serviceInstance, string instanceId)
        {
            var properties = serviceType.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => typeof(System.Collections.Specialized.INotifyCollectionChanged)
                    .IsAssignableFrom(p.PropertyType));

            foreach (var propertyInfo in properties)
            {
                var collection = propertyInfo.GetValue(serviceInstance) as 
                    System.Collections.Specialized.INotifyCollectionChanged;
                
                if (collection != null)
                {
                    collection.CollectionChanged += (sender, args) =>
                    {
                        OnCollectionChanged(serviceName, propertyInfo.Name, args, instanceId);
                    };
                }
            }
        }

        /// <summary>
        /// Appelé quand une collection change
        /// </summary>
        private void OnCollectionChanged(string serviceName, string collectionName, 
            System.Collections.Specialized.NotifyCollectionChangedEventArgs args, string instanceId = null)
        {
#if DEBUG
            EventFired?.Invoke(new DebugLogEntry
            {
                Direction = MessageDirection.CSharpToJavaScript,
                Type = MessageType.EventFired,
                ServiceName = serviceName,
                MethodName = $"{collectionName}Changed",
                Result = new
                {
                    Action = args.Action.ToString(),
                    NewItems = args.NewItems?.Cast<object>().ToArray(),
                    OldItems = args.OldItems?.Cast<object>().ToArray(),
                    NewStartingIndex = args.NewStartingIndex,
                    OldStartingIndex = args.OldStartingIndex
                },
                MessageId = Guid.NewGuid().ToString(),
                InstanceId = instanceId,
                Timestamp = DateTime.Now
            });
#endif
            try
            {
                var message = new BridgeMessage
                {
                    Type = MessageType.EventFired,
                    ServiceName = serviceName,
                    InstanceId = instanceId,
                    MethodName = $"{collectionName}Changed",
                    Result = new
                    {
                        Action = args.Action.ToString(),
                        NewItems = args.NewItems?.Cast<object>().ToArray(),
                        OldItems = args.OldItems?.Cast<object>().ToArray(),
                        NewStartingIndex = args.NewStartingIndex,
                        OldStartingIndex = args.OldStartingIndex
                    },
                    Success = true
                };
                
                SendMessageToJavaScript(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending collection change {collectionName} from service {serviceName}: {ex.Message}");
            }
        }

        /// <summary>
        /// Appelé quand une propriété change
        /// </summary>
        private void OnPropertyChangedFired(string serviceName, string propertyName, object serviceInstance, string instanceId = null)
        {
#if DEBUG
            EventFired?.Invoke(new DebugLogEntry
            {
                Direction = MessageDirection.CSharpToJavaScript,
                Type = MessageType.PropertyChangeFired,
                ServiceName = serviceName,
                MethodName = propertyName,
                Result = TryGetPropertyValue(serviceInstance, serviceInstance.GetType().GetProperty(propertyName)),
                MessageId = Guid.NewGuid().ToString(),
                InstanceId = instanceId,
                Timestamp = DateTime.Now
            });
#endif
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
                    InstanceId = instanceId,
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
        private Delegate CreateEventHandler(EventInfo eventInfo, string serviceName, string eventName, string instanceId)
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
                OnServiceEventFired(serviceName, eventName, args, instanceId);
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
        private void OnServiceEventFired(string serviceName, string eventName, object eventArgs, string instanceId = null)
        {
#if DEBUG
            EventFired?.Invoke(new DebugLogEntry
            {
                Direction = MessageDirection.CSharpToJavaScript,
                Type = MessageType.EventFired,
                ServiceName = serviceName,
                MethodName = eventName,
                Result = eventArgs,
                MessageId = Guid.NewGuid().ToString(),
                InstanceId = instanceId,
                Timestamp = DateTime.Now
            });
#endif
            try
            {
                var message = new BridgeMessage
                {
                    Type = MessageType.EventFired,
                    ServiceName = serviceName,
                    InstanceId = instanceId,
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
        private void OnWebMessageReceived(object sender, string messageJson)
        {
#if DEBUG
            MessageReceived?.Invoke(new DebugLogEntry
            {
                Direction = MessageDirection.JavaScriptToCSharp,
                Type = MessageType.DebugLog,
                Message = "Message received from JavaScript",
                Timestamp = DateTime.Now
            });
#endif
            try
            {
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

                    case MessageType.GetService:
                        GetServiceMetadata(message.ServiceName, message.MessageId, message.InstanceId);
                        break;

                    case MessageType.GetProperty:
                        HandleGetProperty(message);
                        break;

                    case MessageType.SetProperty:
                        HandleSetProperty(message);
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
        /// Récupère l'instance de service appropriée (singleton ou transient)
        /// </summary>
        private object? GetServiceInstance(string serviceName, string? instanceId)
        {
            if (!_serviceRegistrations.ContainsKey(serviceName))
                return null;

            var registrationInfo = _serviceRegistrations[serviceName];

            // Singleton : DI gère le cache
            if (registrationInfo.Lifetime == ServiceLifetime.Singleton)
            {
                return _serviceProvider?.GetService(registrationInfo.ServiceType)
                    ?? registrationInfo.SingletonInstance;
            }

            // Transient : instanceId obligatoire
            if (string.IsNullOrEmpty(instanceId))
                return null;

            // Récupérer l'instance depuis le stockage
            return GetTransientInstance(serviceName, instanceId);
        }

        /// <summary>
        /// Gère la demande de valeur de propriété depuis JavaScript
        /// </summary>
        private void HandleGetProperty(BridgeMessage message)
        {
            try
            {
                Console.WriteLine($"[C#] HandleGetProperty - Service: {message.ServiceName}, Property: {message.PropertyName}, MessageId: {message.MessageId}");

                var service = GetServiceInstance(message.ServiceName, message.InstanceId);
                
                if (service == null)
                {
                    Console.WriteLine($"[C#] Service '{message.ServiceName}' not found");
                    SendErrorResponse(message.MessageId, $"Service '{message.ServiceName}' not found");
                    return;
                }

                var serviceType = service.GetType();
                var propertyInfo = serviceType.GetProperty(message.PropertyName);

                if (propertyInfo == null || !propertyInfo.CanRead)
                {
                    Console.WriteLine($"[C#] Property '{message.PropertyName}' not found or not readable in service '{message.ServiceName}'");
                    SendErrorResponse(message.MessageId, $"Property '{message.PropertyName}' not found or not readable in service '{message.ServiceName}'");
                    return;
                }

                // Récupérer la valeur de la propriété
                var value = TryGetPropertyValue(service, propertyInfo);
                Console.WriteLine($"[C#] Property value: {value}");

                // Envoyer le résultat
                var responseMessage = new BridgeMessage
                {
                    MessageId = message.MessageId,
                    Type = MessageType.MethodResult,
                    ServiceName = message.ServiceName,
                    PropertyName = message.PropertyName,
                    Result = value,
                    Success = true
                };

                Console.WriteLine($"[C#] Sending property response with MessageId: {responseMessage.MessageId}");
                SendMessageToJavaScript(responseMessage);
            }
            catch (Exception ex)
            {
                SendErrorResponse(message.MessageId, $"Property get error: {ex.Message}");
            }
        }

        /// <summary>
        /// Gère la définition de valeur de propriété depuis JavaScript
        /// </summary>
        private void HandleSetProperty(BridgeMessage message)
        {
            try
            {
                Console.WriteLine($"[C#] HandleSetProperty - Service: {message.ServiceName}, Property: {message.PropertyName}, MessageId: {message.MessageId}");

                var service = GetServiceInstance(message.ServiceName, message.InstanceId);
                
                if (service == null)
                {
                    Console.WriteLine($"[C#] Service '{message.ServiceName}' not found");
                    SendErrorResponse(message.MessageId, $"Service '{message.ServiceName}' not found");
                    return;
                }

                var serviceType = service.GetType();
                var propertyInfo = serviceType.GetProperty(message.PropertyName);

                if (propertyInfo == null || !propertyInfo.CanWrite)
                {
                    Console.WriteLine($"[C#] Property '{message.PropertyName}' not found or not writable in service '{message.ServiceName}'");
                    SendErrorResponse(message.MessageId, $"Property '{message.PropertyName}' not found or not writable in service '{message.ServiceName}'");
                    return;
                }

                // Convertir et définir la valeur de la propriété
                var value = message.Parameters?.Length > 0 ? ConvertParameter(message.Parameters[0], propertyInfo.PropertyType) : null;
                Console.WriteLine($"[C#] Setting property value: {value}");

                propertyInfo.SetValue(service, value);

                // Envoyer la confirmation
                var responseMessage = new BridgeMessage
                {
                    MessageId = message.MessageId,
                    Type = MessageType.MethodResult,
                    ServiceName = message.ServiceName,
                    PropertyName = message.PropertyName,
                    Result = new { success = true },
                    Success = true
                };

                Console.WriteLine($"[C#] Sending set property response with MessageId: {responseMessage.MessageId}");
                SendMessageToJavaScript(responseMessage);
            }
            catch (Exception ex)
            {
                SendErrorResponse(message.MessageId, $"Property set error: {ex.Message}");
            }
        }

        /// <summary>
        /// Gère les appels de méthodes depuis JavaScript
        /// </summary>
        private void HandleMethodCall(BridgeMessage message)
        {
#if DEBUG
            var startTime = DateTime.Now;
            MethodCalled?.Invoke(new DebugLogEntry
            {
                Direction = MessageDirection.JavaScriptToCSharp,
                Type = MessageType.CallMethod,
                ServiceName = message.ServiceName,
                MethodName = message.MethodName,
                Parameters = message.Parameters,
                MessageId = message.MessageId,
                InstanceId = message.InstanceId,
                Timestamp = startTime
            });
#endif
            try
            {
                Console.WriteLine($"[C#] HandleMethodCall - Service: {message.ServiceName}, Method: {message.MethodName}, MessageId: {message.MessageId}");
                
                var service = GetServiceInstance(message.ServiceName, message.InstanceId);
                
                if (service == null)
                {
                    Console.WriteLine($"[C#] Service '{message.ServiceName}' not found");
                    SendErrorResponse(message.MessageId, $"Service '{message.ServiceName}' not found");
                    return;
                }

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

#if DEBUG
                var endTime = DateTime.Now;
                var duration = endTime - startTime;
                MethodCompleted?.Invoke(new DebugLogEntry
                {
                    Direction = MessageDirection.CSharpToJavaScript,
                    Type = MessageType.MethodResult,
                    ServiceName = message.ServiceName,
                    MethodName = message.MethodName,
                    Result = result,
                    MessageId = message.MessageId,
                    InstanceId = message.InstanceId,
                    Timestamp = endTime,
                    Duration = duration
                });
#endif
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
        /// <summary>
        /// Gère les abonnements aux événements depuis JavaScript
        /// </summary>
        private void HandleEventSubscription(BridgeMessage message)
        {
            try
            {
                var instanceId = message.InstanceId ?? string.Empty;
                var key = (message.ServiceName, message.MethodName, instanceId);

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

#if DEBUG
            MessageSent?.Invoke(new DebugLogEntry
            {
                Direction = MessageDirection.CSharpToJavaScript,
                Type = message.Type,
                ServiceName = message.ServiceName,
                MethodName = message.MethodName,
                Result = message.Result,
                Error = message.Error,
                MessageId = message.MessageId,
                InstanceId = message.InstanceId,
                Timestamp = DateTime.Now
            });
#endif
            try
            {
                var jsonMessage = JsonSerializer.Serialize(message, _jsonOptions);
                _messageHandler.Dispatcher.Invoke(() =>
                {
                    _messageHandler.SendMessage(jsonMessage);
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
#if DEBUG
            ErrorOccurred?.Invoke(new DebugLogEntry
            {
                Direction = MessageDirection.CSharpToJavaScript,
                Type = MessageType.ErrorResponse,
                Error = error,
                MessageId = messageId,
                Timestamp = DateTime.Now
            });
#endif
            var errorMessage = new BridgeMessage
            {
                MessageId = messageId,
                Type = MessageType.ErrorResponse,
                Error = error,
                Success = false
            };

            SendMessageToJavaScript(errorMessage);
        }

#if DEBUG
        /// <summary>
        /// Retourne les métadonnées de toutes les services enregistrés (1 par instance active)
        /// Utilisé par l'onglet "Services Instances" du Debug Panel
        /// </summary>
        public IEnumerable<ServiceDebugInfo> GetActiveInstances()
        {
            var result = new List<ServiceDebugInfo>();

            foreach (var kvp in _serviceRegistrations)
            {
                var serviceName = kvp.Key;
                var registrationInfo = kvp.Value;

                if (registrationInfo.SingletonInstance != null)
                {
                    var serviceInstance = registrationInfo.SingletonInstance;
                    result.Add(new ServiceDebugInfo
                    {
                        ServiceName = serviceName,
                        ServiceType = serviceInstance.GetType().FullName,
                        Lifetime = "Singleton",
                        Methods = serviceInstance.GetType().GetMethods(BindingFlags.Public | BindingFlags.Instance)
                            .Where(m => !m.IsSpecialName && m.DeclaringType != typeof(object) && !m.IsGenericMethod)
                            .Select(m => new MethodMetadata
                            {
                                Name = m.Name,
                                Parameters = m.GetParameters().Select(p => new ParameterMetadata
                                {
                                    Name = p.Name,
                                    Type = GetSimpleTypeName(p.ParameterType)
                                }).ToArray(),
                                ReturnType = GetSimpleTypeName(m.ReturnType)
                            }).ToArray(),
                        Events = serviceInstance.GetType().GetEvents(BindingFlags.Public | BindingFlags.Instance)
                            .Where(e => e.DeclaringType != typeof(object) && e.Name != "PropertyChanged")
                            .Select(e => e.Name).ToArray(),
                        Properties = serviceInstance.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance)
                            .Where(p => p.DeclaringType != typeof(object) && p.GetIndexParameters().Length == 0 && p.CanRead)
                            .Select(p => new PropertyMetadata
                            {
                                Name = p.Name,
                                Type = GetSimpleTypeName(p.PropertyType),
                                Value = TryGetPropertyValue(serviceInstance, p),
                                IsObservableCollection = typeof(System.Collections.Specialized.INotifyCollectionChanged).IsAssignableFrom(p.PropertyType)
                            }).ToArray(),
                        SupportsPropertyChanged = typeof(System.ComponentModel.INotifyPropertyChanged).IsAssignableFrom(serviceInstance.GetType()),
                        InstanceId = null
                    });
                }
                else
                {
                    foreach (var instanceKvp in registrationInfo.TransientInstances)
                    {
                        if (instanceKvp.Value.TryGetTarget(out var serviceInstance))
                        {
                            result.Add(new ServiceDebugInfo
                            {
                                ServiceName = serviceName,
                                ServiceType = serviceInstance.GetType().FullName,
                                Lifetime = "Transient",
                                Methods = serviceInstance.GetType().GetMethods(BindingFlags.Public | BindingFlags.Instance)
                                    .Where(m => !m.IsSpecialName && m.DeclaringType != typeof(object) && !m.IsGenericMethod)
                                    .Select(m => new MethodMetadata
                                    {
                                        Name = m.Name,
                                        Parameters = m.GetParameters().Select(p => new ParameterMetadata
                                        {
                                            Name = p.Name,
                                            Type = GetSimpleTypeName(p.ParameterType)
                                        }).ToArray(),
                                        ReturnType = GetSimpleTypeName(m.ReturnType)
                                    }).ToArray(),
                                Events = serviceInstance.GetType().GetEvents(BindingFlags.Public | BindingFlags.Instance)
                                    .Where(e => e.DeclaringType != typeof(object) && e.Name != "PropertyChanged")
                                    .Select(e => e.Name).ToArray(),
                                Properties = serviceInstance.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance)
                                    .Where(p => p.DeclaringType != typeof(object) && p.GetIndexParameters().Length == 0 && p.CanRead)
                                    .Select(p => new PropertyMetadata
                                    {
                                        Name = p.Name,
                                        Type = GetSimpleTypeName(p.PropertyType),
                                        Value = TryGetPropertyValue(serviceInstance, p),
                                        IsObservableCollection = typeof(System.Collections.Specialized.INotifyCollectionChanged).IsAssignableFrom(p.PropertyType)
                                    }).ToArray(),
                                SupportsPropertyChanged = typeof(System.ComponentModel.INotifyPropertyChanged).IsAssignableFrom(serviceInstance.GetType()),
                                InstanceId = instanceKvp.Key
                            });
                        }
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Renvoie les définitions de tous les services enregistrés (1 par type)
        /// Utilisé par l'onglet "Services" du Debug Panel
        /// </summary>
        public IEnumerable<ServiceDebugInfo> GetServiceDefinitions()
        {
            var result = new List<ServiceDebugInfo>();

            foreach (var kvp in _serviceRegistrations)
            {
                var serviceName = kvp.Key;
                var registrationInfo = kvp.Value;

                object? serviceInstance;

                if (registrationInfo.Lifetime == ServiceLifetime.Singleton)
                {
                    serviceInstance = registrationInfo.SingletonInstance
                        ?? _serviceProvider?.GetService(registrationInfo.ServiceType);

                    if (serviceInstance == null)
                        continue;
                }
                else
                {
                    var activeInstance = registrationInfo.TransientInstances.Values.FirstOrDefault(v =>
                    {
                        v.TryGetTarget(out var target);
                        return target != null;
                    });

                    if (activeInstance != null)
                    {
                        activeInstance.TryGetTarget(out serviceInstance);
                    }
                    else
                    {
                        serviceInstance = _serviceProvider?.GetService(registrationInfo.ServiceType);
                    }

                    if (serviceInstance == null)
                        continue;
                }

                result.Add(new ServiceDebugInfo
                {
                    ServiceName = serviceName,
                    ServiceType = serviceInstance.GetType().FullName,
                    Lifetime = registrationInfo.Lifetime == ServiceLifetime.Singleton ? "Singleton" : "Transient",
                    InstanceId = null,
                    Methods = serviceInstance.GetType().GetMethods(BindingFlags.Public | BindingFlags.Instance)
                        .Where(m => !m.IsSpecialName && m.DeclaringType != typeof(object) && !m.IsGenericMethod)
                        .Select(m => new MethodMetadata
                        {
                            Name = m.Name,
                            Parameters = m.GetParameters().Select(p => new ParameterMetadata
                            {
                                Name = p.Name,
                                Type = GetSimpleTypeName(p.ParameterType)
                            }).ToArray(),
                            ReturnType = GetSimpleTypeName(m.ReturnType)
                        }).ToArray(),
                    Events = serviceInstance.GetType().GetEvents(BindingFlags.Public | BindingFlags.Instance)
                        .Where(e => e.DeclaringType != typeof(object) && e.Name != "PropertyChanged")
                        .Select(e => e.Name).ToArray(),
                    Properties = serviceInstance.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance)
                        .Where(p => p.DeclaringType != typeof(object) && p.GetIndexParameters().Length == 0 && p.CanRead)
                        .Select(p => new PropertyMetadata
                        {
                            Name = p.Name,
                            Type = GetSimpleTypeName(p.PropertyType),
                            Value = TryGetPropertyValue(serviceInstance, p),
                            IsObservableCollection = typeof(System.Collections.Specialized.INotifyCollectionChanged).IsAssignableFrom(p.PropertyType)
                        }).ToArray(),
                    SupportsPropertyChanged = typeof(System.ComponentModel.INotifyPropertyChanged).IsAssignableFrom(serviceInstance.GetType())
                });
            }

            return result;
        }

        /// <summary>
        /// Émet un événement de log de debug
        /// </summary>
        private void EmitDebugLog(DebugLogEntry logEntry)
        {
            switch (logEntry.Type)
            {
                case MessageType.CallMethod:
                    MethodCalled?.Invoke(logEntry);
                    break;
                case MessageType.MethodResult:
                    MethodCompleted?.Invoke(logEntry);
                    break;
                case MessageType.EventFired:
                case MessageType.PropertyChangeFired:
                    EventFired?.Invoke(logEntry);
                    break;
                case MessageType.ErrorResponse:
                    ErrorOccurred?.Invoke(logEntry);
                    break;
                case MessageType.GetProperty:
                case MessageType.SetProperty:
                    MethodCalled?.Invoke(logEntry);
                    break;
            }
        }
#endif

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
            _serviceRegistrations.Clear();
            _pendingCalls.Clear();

            _messageHandler.MessageReceived -= OnWebMessageReceived;
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

const DotnetBridge = (function() {
    let messageIdCounter = 0;
    const pendingCalls = {};
    const eventListeners = {};
    const services = new Map();
    
    let bridgeReady = false;
    let bridgeReadyCallbacks = [];
    
    function generateMessageId() {
        messageIdCounter++;
        return 'msg_' + messageIdCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function sendMessage(message) {
        try {
            console.log('[DotnetBridge] Sending message:', message);
            window.chrome.webview.postMessage(JSON.stringify(message));
        } catch (error) {
            console.error('[DotnetBridge] Error sending message:', error);
            throw error;
        }
    }
    
    function initializeMessageListener() {
        if (!window.chrome?.webview) {
            console.warn('[DotnetBridge] Not running in WebView2 environment');
            return;
        }
        
        window.chrome.webview.addEventListener('message', function(event) {
            try {
                const message = JSON.parse(event.data);
                console.log('[DotnetBridge] Received message:', message.type);
                handleMessage(message);
            } catch (error) {
                console.error('[DotnetBridge] Error parsing message:', error);
            }
        });
    }
    
    function handleMessage(message) {
        switch (message.type) {
            case 'methodResult':
                handleMethodResult(message);
                break;
                
            case 'eventFired':
                handleEventFired(message);
                break;
                
            case 'propertyChangeFired':
            case 'PropertyChangeFired':
                handlePropertyChange(message);
                break;
                
            case 'errorResponse':
                handleErrorResponse(message);
                break;
                
            default:
                console.warn('[DotnetBridge] Unknown message type:', message.type);
        }
    }
    
    
    function createServiceProxy(serviceName, properties = [], instanceId = null) {
        const proxy = {
            _serviceName: serviceName,
            _instanceId: instanceId,
            _listeners: new Map(),
            _propertyValues: new Map(),
            _propertySubscribers: new Map(),
            _observableCollections: new Map()
        };
        
        properties.forEach(prop => {
            proxy._propertyValues.set(prop.name, prop.value);
            proxy._propertySubscribers.set(prop.name, new Set());
            if (prop.isObservableCollection) {
                proxy._observableCollections.set(prop.name, true);
            }
        });
        
        proxy.call = function(methodName, parameters) {
            return new Promise((resolve, reject) => {
                const messageId = generateMessageId();
                
                pendingCalls[messageId] = { resolve, reject };
                
                const message = {
                    type: 'CallMethod',
                    messageId: messageId,
                    serviceName: serviceName,
                    instanceId: instanceId,
                    methodName: methodName,
                    parameters: parameters || []
                };
                
                sendMessage(message);
            });
        };
        
        proxy._updateProperty = function(propertyName, value) {
            const oldValue = proxy._propertyValues.get(propertyName);
            proxy._propertyValues.set(propertyName, value);
            
            const subscribers = proxy._propertySubscribers.get(propertyName);
            console.log("-----------  PROPERTY CHANGED : " + propertyName );
            console.log(subscribers);
            if (subscribers) {
                subscribers.forEach(callback => {
                    try {
                        callback(value, oldValue);
                    } catch (error) {
                        console.error(`[DotnetBridge] Error in property callback for ${propertyName}:`, error);
                    }
                });
            }
        };
        
        const methodHandler = {
            get: function(target, propertyName) {
                if (propertyName === '_serviceName' || 
                    propertyName === '_listeners' || 
                    propertyName === 'call' ||
                    propertyName === '_updateProperty' ||
                    propertyName === '_propertyValues' ||
                    propertyName === '_propertySubscribers') {
                    return target[propertyName];
                }
                
                if (['then', 'catch', 'finally'].includes(propertyName)) {
                    return undefined;
                }
                
                if (['toString', 'valueOf', 'constructor', 'prototype', 'length', 'name'].includes(propertyName)) {
                    return undefined;
                }
                
                if (propertyName.startsWith('On') && propertyName.length > 2) {
                    const eventName = propertyName.slice(2);
                    
                    // Vérifier si c'est de la forme On{PropertyName}Changed pour une propriété observable
                    if (eventName.endsWith('Changed') && eventName.length > 7) {
                        const propName = eventName.slice(0, -7); // Enlever "Changed"
                        
                        // Vérifier si cette propriété existe
                        if (target._propertyValues.has(propName)) {
                            // Vérifier si c'est une ObservableCollection ( événement classique)
                            // ou une ObservableProperty (pas d'abonnement C# nécessaire)
                            const isObservableCollection = target._observableCollections.get(propName);
                            
                            if (isObservableCollection) {
                                // C'est une ObservableCollection, traiter comme un événement classique
                                console.log(`[DotnetBridge] ${propName} is an ObservableCollection, using event subscription`);
                                return {
                                    subscribe: function(callback) {
                                        return subscribeToEvent(serviceName, eventName, callback, instanceId);
                                    },
                                    unsubscribe: function(listenerId) {
                                        unsubscribeFromEvent(serviceName, eventName, listenerId, instanceId);
                                    }
                                };
                            } else {
                                // C'est une ObservableProperty, stocker le callback localement
                                return {
                                    subscribe: function(callback) {
                                        const subscribers = target._propertySubscribers.get(propName);
                                        if (subscribers) {
                                            const listenerId = generateMessageId();
                                            subscribers.add(callback);
                                            // Stocker le mapping listenerId -> callback pour l'unsubscribe
                                            target._propertySubscriptions = target._propertySubscriptions || new Map();
                                            target._propertySubscriptions.set(listenerId, { propName, callback });
                                            console.log(`[DotnetBridge] Subscribed to ObservableProperty ${propName} changes via On${propName}Changed`);
                                            return listenerId;
                                        }
                                        return null;
                                    },
                                    unsubscribe: function(listenerId) {
                                        if (target._propertySubscriptions && target._propertySubscriptions.has(listenerId)) {
                                            const { propName, callback } = target._propertySubscriptions.get(listenerId);
                                            const subscribers = target._propertySubscribers.get(propName);
                                            if (subscribers) {
                                                subscribers.delete(callback);
                                                target._propertySubscriptions.delete(listenerId);
                                                console.log(`[DotnetBridge] Unsubscribed from ObservableProperty ${propName} changes`);
                                            }
                                        }
                                    }
                                };
                            }
                        }
                    }
                    
                    // Sinon, c'est un événement classique
                    return {
                        subscribe: function(callback) {
                            return subscribeToEvent(serviceName, eventName, callback, instanceId);
                        },
                        unsubscribe: function(listenerId) {
                            unsubscribeFromEvent(serviceName, eventName, listenerId, instanceId);
                        }
                    };
                }
                
                if (target._propertyValues.has(propertyName)) {
                    const propertyValue = target._propertyValues.get(propertyName);
                    
                    subscribeToPropertyChange(serviceName, propertyName);
                    
                    // Retourner directement la valeur de la propriété (pas une fonction)
                    return propertyValue;
                }
                
            // Générer automatiquement Get{PropertyName} et Set{PropertyName} pour les propriétés
            if (propertyName.startsWith('Get') && propertyName.length > 3) {
                const propName = propertyName.substring(3);
                if (target._propertyValues.has(propName)) {
                    // Getter généré automatiquement pour la propriété
                    return function(...args) {
                        return new Promise((resolve, reject) => {
                            const messageId = generateMessageId();
                            pendingCalls[messageId] = { resolve, reject };
                            
                            const message = {
                                type: 'GetProperty',
                                messageId: messageId,
                                serviceName: serviceName,
                                instanceId: instanceId,
                                propertyName: propName
                            };
                            
                            sendMessage(message);
                        });
                    };
                }
            }
                
            // Générer automatiquement Set{PropertyName} pour les propriétés
            if (propertyName.startsWith('Set') && propertyName.length > 3) {
                const propName = propertyName.substring(3);
                if (target._propertyValues.has(propName)) {
                    // Setter généré automatiquement pour la propriété
                    return function(value) {
                        return new Promise((resolve, reject) => {
                            const messageId = generateMessageId();
                            pendingCalls[messageId] = { resolve, reject };
                            
                            const message = {
                                type: 'SetProperty',
                                messageId: messageId,
                                serviceName: serviceName,
                                instanceId: instanceId,
                                propertyName: propName,
                                parameters: [value]
                            };
                            
                            sendMessage(message);
                        });
                    };
                }
            }
                
                return function(...args) {
                    return proxy.call(propertyName, args);
                };
            }
        };
        
        return new Proxy(proxy, methodHandler);
    }
    
    function handleMethodResult(message) {
        console.log('[DotnetBridge] handleMethodResult called:', message);
        
        const { messageId, result, success, error } = message;
        const pending = pendingCalls[messageId];
        
        if (pending) {
            delete pendingCalls[messageId];
            console.log('[DotnetBridge] Resolving pending call for messageId:', messageId);
            
            if (success) {
                pending.resolve(result);
            } else {
                pending.reject(new Error(error || 'Method call failed'));
            }
        } else {
            console.warn('[DotnetBridge] No pending call found for messageId:', messageId, 'Pending keys:', Object.keys(pendingCalls));
        }
    }
    
    function handleEventFired(message) {
        const { serviceName, methodName: eventName, result, instanceId } = message;
        // Utiliser l'instanceId pour construire la clé des écouteurs
        const key = instanceId ? `${serviceName}_${eventName}_${instanceId}` : `${serviceName}_${eventName}`;
        const listeners = eventListeners[key];
        
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(result);
                } catch (error) {
                    console.error('[DotnetBridge] Error in event callback:', error);
                }
            });
        }
    }
    
    function handlePropertyChange(message) {
        const { serviceName, methodName: propertyName, result, instanceId } = message;
        
        // Construire la bonne clé de cache
        const cacheKey = instanceId ? `${serviceName}_${instanceId}` : serviceName;
        const service = services.get(cacheKey);
        
        if (service && service._updateProperty) {
            const value = result?.value;
            console.log(`[DotnetBridge] Property ${propertyName} changed to:`, value);
            service._updateProperty(propertyName, value);
        } else {
            console.warn(`[DotnetBridge] Service not found for property change: ${cacheKey}`);
        }
    }

    function subscribeToPropertyChange(serviceName, propertyName) {
        const key = `${serviceName}_PropertyChange_${propertyName}`;
        
        if (!eventListeners[key]) {
            eventListeners[key] = new Set();
        }
        
        // Observable properties automatically send propertyChangeFired notifications
        // No need to subscribe - they work out of the box
    }

    function handleErrorResponse(message) {
        const { messageId, error } = message;
        const pending = pendingCalls[messageId];
        
        if (pending) {
            delete pendingCalls[messageId];
            pending.reject(new Error(error || 'Unknown error'));
        }
    }
    
    function subscribeToEvent(serviceName, eventName, callback, instanceId) {
        console.log('[DotnetBridge] Subscribing to event:', serviceName, eventName, 'instanceId:', instanceId);
        
        const listenerId = generateMessageId();
        const key = instanceId ? `${serviceName}_${eventName}_${instanceId}` : `${serviceName}_${eventName}`;
        
        if (!eventListeners[key]) {
            eventListeners[key] = new Set();
        }
        
        eventListeners[key].add(callback);
        
        const message = {
            type: 'SubscribeEvent',
            messageId: listenerId,
            listenerId: listenerId,
            serviceName: serviceName,
            instanceId: instanceId,
            methodName: eventName
        };
        
        // Add to pending calls to handle the methodResult response
        pendingCalls[listenerId] = { 
            resolve: () => { /* Subscription successful, no data needed */ },
            reject: (error) => console.error(`[DotnetBridge] Failed to subscribe to ${eventName}:`, error)
        };
        
        sendMessage(message);
        
        console.log('[DotnetBridge] Subscription sent with listenerId:', listenerId);
        return listenerId;
    }
    
    function unsubscribeFromEvent(serviceName, eventName, listenerId, instanceId) {
        const key = instanceId ? `${serviceName}_${eventName}_${instanceId}` : `${serviceName}_${eventName}`;
        
        if (eventListeners[key]) {
            eventListeners[key].clear();
        }
        
        const message = {
            type: 'UnsubscribeEvent',
            messageId: listenerId,
            listenerId: listenerId,
            serviceName: serviceName,
            instanceId: instanceId,
            methodName: eventName
        };
        
        sendMessage(message);
    }
    
    function notifyBridgeReady() {
        bridgeReady = true;
        console.log('[DotnetBridge] Bridge is ready!');
        
        bridgeReadyCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('[DotnetBridge] Error in ready callback:', error);
            }
        });
        
        bridgeReadyCallbacks = [];
    }
    
    async function getService(serviceName, options = {}) {
        // options.instanceId : pour récupérer une instance transient spécifique
        // options.createNewInstance : pour forcer la création d'une nouvelle instance transient
        
        const cacheKey = options.instanceId 
            ? `${serviceName}_${options.instanceId}`
            : serviceName;
        
        // Pour singleton : comportement actuel (cache)
        if (!options.createNewInstance && !options.instanceId && services.has(serviceName)) {
            return services.get(serviceName);
        }
        
        // Pour transient : ne pas mettre en cache (ou cache avec instanceId unique)
        if (options.createNewInstance || options.instanceId) {
            // Ne pas utiliser le cache, toujours demander à C#
        } else if (services.has(cacheKey)) {
            return services.get(cacheKey);
        }

        // Demander les métadonnées du service à C# (lazy loading)
        const messageId = generateMessageId();
        
        return new Promise((resolve, reject) => {
            pendingCalls[messageId] = { resolve, reject };
            
            const message = {
                type: 'GetService',
                messageId: messageId,
                serviceName: serviceName,
                instanceId: options.instanceId
            };
            
            sendMessage(message);
        }).then(serviceMetadata => {
        
            // Créer le proxy avec les métadonnées reçues
            const proxy = createServiceProxy(serviceName, serviceMetadata.properties || [], serviceMetadata.instanceId);
            
            // Cache avec la clé appropriée
            if (serviceMetadata.lifetime === 'Singleton') {
                services.set(serviceName, proxy);
            } else {
                // Pour les transients, utiliser une clé unique avec instanceId
                const transientCacheKey = serviceMetadata.instanceId 
                    ? `${serviceName}_${serviceMetadata.instanceId}`
                    : `${serviceName}_${Date.now()}_${Math.random()}`;
                services.set(transientCacheKey, proxy);
            }
            
            console.log('[DotnetBridge] Service loaded:', serviceName);
            console.log(`[DotnetBridge] Métadonnées reçues pour ${serviceName}:`, {
                lifetime: serviceMetadata.lifetime,
                instanceId: serviceMetadata.instanceId,
                methods: serviceMetadata.methods?.map(m => m.name),
                events: serviceMetadata.events,
                properties: serviceMetadata.properties?.map(p => p.name)
            });


            if (!bridgeReady) {
                notifyBridgeReady();
            }
            
            return proxy;
        });
    }

    
    function isReady() {
        return bridgeReady;
    }
    
    function onReady(callback) {
        if (bridgeReady) {
            callback();
        } else {
            bridgeReadyCallbacks.push(callback);
        }
    }
    
    initializeMessageListener();
    
    return {
        getService,
        isReady,
        onReady
    };
})();

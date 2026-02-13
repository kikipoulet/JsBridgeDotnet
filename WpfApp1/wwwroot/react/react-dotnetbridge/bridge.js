/**
 * @fileoverview Core bridge for communication between JavaScript and .NET via WebView2
 * @module bridge
 */

/**
 * @typedef {Object} ServiceProxy
 * @property {string} _serviceName - Nom du service
 * @property {string} [_instanceId] - ID de l'instance (pour services transient)
 * @property {function(string, Array): Promise} call - Appeler une méthode du service
 * @property {function(string, any): void} _updateProperty - Mettre à jour une propriété
 * @property {Map<string, any>} _propertyValues - Valeurs des propriétés
 * @property {Map<string, Set<function>>} _propertySubscribers - Abonnés aux changements de propriétés
 * @property {function(string, function): string} On[PropertyName].subscribe - S'abonner à un changement
 * @property {function(string): void} On[PropertyName].unsubscribe - Se désabonner
 */

/**
 * @typedef {Object} BridgeOptions
 * @property {string} [instanceId] - ID de l'instance pour services transient
 * @property {boolean} [createNewInstance] - Forcer la création d'une nouvelle instance
 * @property {Array} [constructorParameters] - Paramètres du constructeur
 */

/**
 * @typedef {Object} Message
 * @property {string} type - Type de message (CallMethod, GetService, SubscribeEvent, etc.)
 * @property {string} messageId - Identifiant unique du message
 * @property {string} serviceName - Nom du service cible
 * @property {string} [instanceId] - ID de l'instance
 * @property {string} [methodName] - Nom de la méthode
 * @property {Array} [parameters] - Paramètres de la méthode
 * @property {string} [propertyName] - Nom de la propriété
 * @property {string} [listenerId] - ID de l'écouteur
 */

let DotnetBridge = (function() {
    /**
     * Compteur pour générer des IDs uniques
     * @type {number}
     */
    let messageIdCounter = 0;

    /**
     * Appels en attente de réponse
     * @type {Object.<string, {resolve: function, reject: function}>}
     */
    const pendingCalls = {};

    /**
     * Écouteurs d'événements enregistrés
     * @type {Object.<string, Set<function>>}
     */
    const eventListeners = {};

    /**
     * Services mis en cache
     * @type {Map<string, ServiceProxy>}
     */
    const services = new Map();

    /**
     * Indique si le bridge est prêt
     * @type {boolean}
     */
    let bridgeReady = false;

    /**
     * Callbacks à exécuter quand le bridge est prêt
     * @type {Array<function>}
     */
    let bridgeReadyCallbacks = [];

    /**
     * Génère un ID unique pour les messages
     * @returns {string} ID unique
     */
    function generateMessageId() {
        messageIdCounter++;
        return 'msg_' + messageIdCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Envoie un message vers .NET via WebView2
     * @param {Message} message - Message à envoyer
     * @throws {Error} Si l'envoi échoue
     */
    function sendMessage(message) {
        try {
            console.log('[DotnetBridge] Sending message:', message);
            window.chrome.webview.postMessage(JSON.stringify(message));
        } catch (error) {
            console.error('[DotnetBridge] Error sending message:', error);
            throw error;
        }
    }

    /**
     * Initialise l'écouteur de messages depuis .NET
     */
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

    /**
     * Gère les messages reçus depuis .NET
     * @param {Message} message - Message reçu
     */
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

    /**
     * Met à jour une propriété nested
     * @param {Object} obj - Objet à modifier
     * @param {Array<string>} pathParts - Chemin de la propriété
     * @param {any} newValue - Nouvelle valeur
     * @returns {Object} Nouvel objet avec la propriété mise à jour
     */
    function updateNestedProperty(obj, pathParts, newValue) {
        if (pathParts.length === 0) {
            return newValue;
        }

        const [currentProp, ...remainingProps] = pathParts;
        const normalizedProp = currentProp.charAt(0).toLowerCase() + currentProp.slice(1);

        if (typeof obj !== 'object' || obj === null) {
            return newValue;
        }

        const newObj = { ...obj };

        if (remainingProps.length === 0) {
            newObj[normalizedProp] = newValue;
        } else {
            const currentObj = obj[normalizedProp];
            if (currentObj && typeof currentObj === 'object') {
                newObj[normalizedProp] = updateNestedProperty(currentObj, remainingProps, newValue);
            } else {
                newObj[normalizedProp] = newValue;
            }
        }

        return newObj;
    }

    /**
     * Crée un proxy pour un service .NET
     * @param {string} serviceName - Nom du service
     * @param {Array<{name: string, value: any, isObservableCollection?: boolean}>} properties - Propriétés du service
     * @param {string} [instanceId] - ID de l'instance
     * @returns {ServiceProxy} Proxy du service
     */
    function createServiceProxy(serviceName, properties = [], instanceId = null) {
        const proxy = {
            _serviceName: serviceName,
            _instanceId: instanceId,
            _listeners: new Map(),
            _propertyValues: new Map(),
            _propertySubscribers: new Map(),
            _observableCollections: new Map(),
            _methodCache: new Map()  // Cache for method references
        };

        properties.forEach(prop => {
            proxy._propertyValues.set(prop.name, prop.value);
            proxy._propertySubscribers.set(prop.name, new Set());
            if (prop.isObservableCollection) {
                proxy._observableCollections.set(prop.name, true);
            }
        });

        /**
         * Appelle une méthode du service
         * @param {string} methodName - Nom de la méthode
         * @param {Array} [parameters] - Paramètres de la méthode
         * @returns {Promise<any>} Résultat de la méthode
         */
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

        /**
         * Met à jour une propriété
         * @param {string} propertyPath - Chemin de la propriété (ex: "User.Name")
         * @param {any} value - Nouvelle valeur
         */
        proxy._updateProperty = function(propertyPath, value) {
            const pathParts = propertyPath.split('.');

            if (pathParts.length === 1) {
                const propertyName = pathParts[0];
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
            } else {
                const [parentProp, ...nestedProps] = pathParts;
                const oldParentObject = proxy._propertyValues.get(parentProp);

                if (oldParentObject && nestedProps.length > 0) {
                    const newParentObject = updateNestedProperty(oldParentObject, nestedProps, value);
                    proxy._propertyValues.set(parentProp, newParentObject);

                    const subscribers = proxy._propertySubscribers.get(parentProp);
                    console.log(`[DotnetBridge] NESTED PROPERTY CHANGED : ${propertyPath}`);
                    console.log(subscribers);
                    if (subscribers) {
                        subscribers.forEach(callback => {
                            try {
                                callback(newParentObject, oldParentObject);
                            } catch (error) {
                                console.error(`[DotnetBridge] Error in property callback for ${propertyPath}:`, error);
                            }
                        });
                    }
                }
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

                if (propertyName && typeof propertyName === 'string' && propertyName.startsWith('On') && propertyName.length > 2) {
                    const eventName = propertyName.slice(2);

                    if (eventName.endsWith('Changed') && eventName.length > 7) {
                        const propName = eventName.slice(0, -7);

                        if (target._propertyValues.has(propName)) {
                            const isObservableCollection = target._observableCollections.get(propName);

                            if (isObservableCollection) {
                                return {
                                    subscribe: function(callback) {
                                        return subscribeToEvent(serviceName, eventName, callback, instanceId);
                                    },
                                    unsubscribe: function(listenerId) {
                                        unsubscribeFromEvent(serviceName, eventName, listenerId, instanceId);
                                    }
                                };
                            } else {
                                return {
                                    subscribe: function(callback) {
                                        const subscribers = target._propertySubscribers.get(propName);
                                        if (subscribers) {
                                            const listenerId = generateMessageId();
                                            subscribers.add(callback);
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
                    return propertyValue;
                }

                if (propertyName && typeof propertyName === 'string' && propertyName.startsWith('Get') && propertyName.length > 3) {
                    const propName = propertyName.substring(3);
                    if (target._propertyValues.has(propName)) {
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

                if (propertyName && typeof propertyName === 'string' && propertyName.startsWith('Set') && propertyName.length > 3) {
                    const propName = propertyName.substring(3);
                    if (target._propertyValues.has(propName)) {
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

                // Check method cache for stable references
                if (target._methodCache.has(propertyName)) {
                    return target._methodCache.get(propertyName);
                }

                // Create and cache the method
                const cachedMethod = function(...args) {
                    return proxy.call(propertyName, args);
                };
                target._methodCache.set(propertyName, cachedMethod);
                return cachedMethod;
            }
        };

        return new Proxy(proxy, methodHandler);
    }

    /**
     * Gère le résultat d'un appel de méthode
     * @param {Object} message - Message de résultat
     */
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

    /**
     * Gère un événement reçu depuis .NET
     * @param {Object} message - Message d'événement
     */
    function handleEventFired(message) {
        const { serviceName, methodName: eventName, result, instanceId } = message;
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

    /**
     * Gère un changement de propriété
     * @param {Object} message - Message de changement de propriété
     */
    function handlePropertyChange(message) {
        const { serviceName, methodName: propertyName, result, instanceId } = message;

        const cacheKey = instanceId ? `${serviceName}_${instanceId}` : serviceName;
        const service = services.get(cacheKey);

        if (service && service._updateProperty) {
            const value = result?.value;
            const propertyPath = result?.propertyPath || propertyName;
            console.log(`[DotnetBridge] Property ${propertyPath} changed to:`, value);
            service._updateProperty(propertyPath, value);
        } else {
            console.warn(`[DotnetBridge] Service not found for property change: ${cacheKey}`);
        }
    }

    /**
     * Subscribe aux changements de propriété
     * @param {string} serviceName - Nom du service
     * @param {string} propertyName - Nom de la propriété
     */
    function subscribeToPropertyChange(serviceName, propertyName) {
        const key = `${serviceName}_PropertyChange_${propertyName}`;

        if (!eventListeners[key]) {
            eventListeners[key] = new Set();
        }
    }

    /**
     * Gère une erreur
     * @param {Object} message - Message d'erreur
     */
    function handleErrorResponse(message) {
        const { messageId, error } = message;
        const pending = pendingCalls[messageId];

        if (pending) {
            delete pendingCalls[messageId];
            pending.reject(new Error(error || 'Unknown error'));
        }
    }

    /**
     * S'abonne à un événement
     * @param {string} serviceName - Nom du service
     * @param {string} eventName - Nom de l'événement
     * @param {function} callback - Fonction de callback
     * @param {string} [instanceId] - ID de l'instance
     * @returns {string} ID de l'écouteur
     */
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

        pendingCalls[listenerId] = {
            resolve: () => {},
            reject: (error) => console.error(`[DotnetBridge] Failed to subscribe to ${eventName}:`, error)
        };

        sendMessage(message);

        console.log('[DotnetBridge] Subscription sent with listenerId:', listenerId);
        return listenerId;
    }

    /**
     * Se désabonne d'un événement
     * @param {string} serviceName - Nom du service
     * @param {string} eventName - Nom de l'événement
     * @param {string} listenerId - ID de l'écouteur
     * @param {string} [instanceId] - ID de l'instance
     */
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

    /**
     * Notifie que le bridge est prêt
     */
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

    /**
     * Récupère un service .NET
     * @param {string} serviceName - Nom du service
     * @param {BridgeOptions} [options] - Options
     * @returns {Promise<ServiceProxy>} Proxy du service
     */
    async function getService(serviceName, options = {}) {
        const cacheKey = options.instanceId
            ? `${serviceName}_${options.instanceId}`
            : serviceName;

        if (!options.createNewInstance && !options.instanceId && services.has(serviceName)) {
            return services.get(serviceName);
        }

        if (options.createNewInstance || options.instanceId) {
        } else if (services.has(cacheKey)) {
            return services.get(cacheKey);
        }

        const messageId = generateMessageId();

        return new Promise((resolve, reject) => {
            pendingCalls[messageId] = { resolve, reject };

            const message = {
                type: 'GetService',
                messageId: messageId,
                serviceName: serviceName,
                instanceId: options.instanceId,
                parameters: options.constructorParameters || null
            };

            sendMessage(message);
        }).then(serviceMetadata => {
            const proxy = createServiceProxy(serviceName, serviceMetadata.properties || [], serviceMetadata.instanceId);

            if (serviceMetadata.lifetime === 'Singleton') {
                services.set(serviceName, proxy);
            } else {
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

    /**
     * Vérifie si le bridge est prêt
     * @returns {boolean}
     */
    function isReady() {
        return bridgeReady;
    }

    /**
     * Exécute un callback quand le bridge est prêt
     * @param {function} callback - Callback à exécuter
     */
    function onReady(callback) {
        if (bridgeReady) {
            callback();
        } else {
            bridgeReadyCallbacks.push(callback);
        }
    }

    initializeMessageListener();

    const bridge = {
        getService,
        isReady,
        onReady
    };

    if (typeof window !== 'undefined') {
        window.DotnetBridge = bridge;
    }

    return bridge;
})();

export default DotnetBridge;

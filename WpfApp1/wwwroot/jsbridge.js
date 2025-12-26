const WpfBridge = (function() {
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
            console.log('[WpfBridge] Sending message:', message);
            window.chrome.webview.postMessage(JSON.stringify(message));
        } catch (error) {
            console.error('[WpfBridge] Error sending message:', error);
            throw error;
        }
    }
    
    function initializeMessageListener() {
        if (!window.chrome?.webview) {
            console.warn('[WpfBridge] Not running in WebView2 environment');
            return;
        }
        
        window.chrome.webview.addEventListener('message', function(event) {
            try {
                const message = JSON.parse(event.data);
                console.log('[WpfBridge] Received message:', message.type);
                handleMessage(message);
            } catch (error) {
                console.error('[WpfBridge] Error parsing message:', error);
            }
        });
    }
    
    function handleMessage(message) {
        switch (message.type) {
            case 'registerService':
            case 'RegisterService':
                handleServiceRegistration(message);
                break;
                
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
                console.warn('[WpfBridge] Unknown message type:', message.type);
        }
    }
    
    function handleServiceRegistration(message) {
        const serviceName = message.result?.serviceName || message.ServiceName;
        console.log('[WpfBridge] Singleton service registered:', serviceName);
        console.log('[WpfBridge] Registration message details:', message);
        
        if (serviceName) {
            const properties = message.result?.properties || [];
            const proxy = createServiceProxy(serviceName, properties);
            services.set(serviceName, proxy);
            
            if (!bridgeReady) {
                notifyBridgeReady();
            }
        } else {
            console.error('[WpfBridge] Service registration failed - no serviceName in message:', message);
        }
    }
    
    function createServiceProxy(serviceName, properties = []) {
        const proxy = {
            _serviceName: serviceName,
            _listeners: new Map(),
            _propertyValues: new Map(),
            _propertySubscribers: new Map()
        };
        
        properties.forEach(prop => {
            proxy._propertyValues.set(prop.name, prop.value);
            proxy._propertySubscribers.set(prop.name, new Set());
        });
        
        proxy.call = function(methodName, parameters) {
            return new Promise((resolve, reject) => {
                const messageId = generateMessageId();
                
                pendingCalls[messageId] = { resolve, reject };
                
                const message = {
                    type: 'CallMethod',
                    messageId: messageId,
                    serviceName: serviceName,
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
            if (subscribers) {
                subscribers.forEach(callback => {
                    try {
                        callback(value, oldValue);
                    } catch (error) {
                        console.error(`[WpfBridge] Error in property callback for ${propertyName}:`, error);
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
                    return {
                        subscribe: function(callback) {
                            return subscribeToEvent(serviceName, eventName, callback);
                        },
                        unsubscribe: function(listenerId) {
                            unsubscribeFromEvent(serviceName, eventName, listenerId);
                        }
                    };
                }
                
                if (target._propertyValues.has(propertyName)) {
                    const propertyValue = target._propertyValues.get(propertyName);
                    
                    const getter = function() {
                        return target._propertyValues.get(propertyName);
                    };
                    
                    getter.subscribe = function(callback) {
                        target._propertySubscribers.get(propertyName).add(callback);
                        return {
                            unsubscribe: function() {
                                target._propertySubscribers.get(propertyName).delete(callback);
                            }
                        };
                    };
                    
                    subscribeToPropertyChange(serviceName, propertyName);
                    
                    getter.value = propertyValue;
                    
                    return getter;
                }
                
                return function(...args) {
                    return proxy.call(propertyName, args);
                };
            }
        };
        
        return new Proxy(proxy, methodHandler);
    }
    
    function handleMethodResult(message) {
        console.log('[WpfBridge] handleMethodResult called:', message);
        
        const { messageId, result, success, error } = message;
        const pending = pendingCalls[messageId];
        
        if (pending) {
            delete pendingCalls[messageId];
            console.log('[WpfBridge] Resolving pending call for messageId:', messageId);
            
            if (success) {
                pending.resolve(result);
            } else {
                pending.reject(new Error(error || 'Method call failed'));
            }
        } else {
            console.warn('[WpfBridge] No pending call found for messageId:', messageId, 'Pending keys:', Object.keys(pendingCalls));
        }
    }
    
    function handleEventFired(message) {
        const { serviceName, methodName: eventName, result } = message;
        const key = `${serviceName}_${eventName}`;
        const listeners = eventListeners[key];
        
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(result);
                } catch (error) {
                    console.error('[WpfBridge] Error in event callback:', error);
                }
            });
        }
    }
    
    function handlePropertyChange(message) {
        const { serviceName, methodName: propertyName, result } = message;
        const service = services.get(serviceName);
        
        if (service && service._updateProperty) {
            const value = result?.value;
            console.log(`[WpfBridge] Property ${propertyName} changed to:`, value);
            service._updateProperty(propertyName, value);
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
    
    function subscribeToEvent(serviceName, eventName, callback) {
        console.log('[WpfBridge] Subscribing to event:', serviceName, eventName);
        
        const listenerId = generateMessageId();
        const key = `${serviceName}_${eventName}`;
        
        if (!eventListeners[key]) {
            eventListeners[key] = new Set();
        }
        
        eventListeners[key].add(callback);
        
        const message = {
            type: 'SubscribeEvent',
            messageId: listenerId,
            listenerId: listenerId,
            serviceName: serviceName,
            methodName: eventName
        };
        
        // Add to pending calls to handle the methodResult response
        pendingCalls[listenerId] = { 
            resolve: () => { /* Subscription successful, no data needed */ },
            reject: (error) => console.error(`[WpfBridge] Failed to subscribe to ${eventName}:`, error)
        };
        
        sendMessage(message);
        
        console.log('[WpfBridge] Subscription sent with listenerId:', listenerId);
        return listenerId;
    }
    
    function unsubscribeFromEvent(serviceName, eventName, listenerId) {
        const key = `${serviceName}_${eventName}`;
        
        if (eventListeners[key]) {
            eventListeners[key].clear();
        }
        
        const message = {
            type: 'UnsubscribeEvent',
            messageId: listenerId,
            listenerId: listenerId,
            serviceName: serviceName,
            methodName: eventName
        };
        
        sendMessage(message);
    }
    
    function notifyBridgeReady() {
        bridgeReady = true;
        console.log('[WpfBridge] Bridge is ready!');
        
        bridgeReadyCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('[WpfBridge] Error in ready callback:', error);
            }
        });
        
        bridgeReadyCallbacks = [];
    }
    
    function getService(serviceName) {
        return services.get(serviceName);
    }
    
    function hasService(serviceName) {
        return services.has(serviceName);
    }
    
    function waitForService(serviceName, timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (services.has(serviceName)) {
                resolve(services.get(serviceName));
                return;
            }
            
            const timeoutId = setTimeout(() => {
                reject(new Error(`Service '${serviceName}' not available after ${timeout}ms`));
            }, timeout);
            
            const checkInterval = setInterval(() => {
                if (services.has(serviceName)) {
                    clearInterval(checkInterval);
                    clearTimeout(timeoutId);
                    resolve(services.get(serviceName));
                }
            }, 100);
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
        hasService,
        waitForService,
        isReady,
        onReady
    };
})();

async function useSingletonService(serviceName) {
    return await WpfBridge.waitForService(serviceName);
}

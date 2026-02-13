import React from 'react';

/**
 * @fileoverview React hooks for DotnetBridge integration
 * @module bridge-react
 */

/**
 * @typedef {import('./bridge').ServiceProxy} ServiceProxy
 */

/**
 * Hook to subscribe to an Observable Property from .NET
 *
 * @template T - Type de la propriété
 * @param {ServiceProxy|null} service - The Dotnet service proxy
 * @param {string} propertyName - The name of property (e.g., 'IsRunning')
 * @returns {[T|null, function(T): void]} [value, setValue] tuple like useState
 *
 * @example
 * // Dans un composant React :
 * let timerService = null;
 * const [isRunning, setIsRunning] = useObservableProperty(timerService, 'IsRunning');
 *
 * // Dans JSX :
 * <p>Status: {isRunning ? 'Running' : 'Stopped'}</p>
 *
 * // Pour modifier la valeur (appelle SetIsRunning sur le service) :
 * setIsRunning(true);
 */
export function useObservableProperty(service, propertyName) {
  const [value, setValue] = React.useState(null);

  React.useEffect(() => {
    if (!service || !propertyName) return;

    const getterMethod = 'Get' + propertyName;
    const setterMethod = 'Set' + propertyName;
    const eventName = 'On' + propertyName + 'Changed';

    if (typeof service[getterMethod] === 'function') {
      service[getterMethod]().then(initialValue => {
        setValue(initialValue);
      }).catch(error => {
        console.error(`[useObservableProperty] Error getting initial value for ${propertyName}:`, error);
      });
    }

    if (service[eventName] && typeof service[eventName].subscribe === 'function') {
      const listenerId = service[eventName].subscribe((newValue, oldValue) => {
        console.log('[useObservableProperty] === CALLBACK CALLED ===');
        console.log('[useObservableProperty] propertyName:', propertyName);
        console.log('[useObservableProperty] newValue:', newValue);
        console.log('[useObservableProperty] oldValue:', oldValue);
        console.log('[useObservableProperty] newValue type:', typeof newValue);
        if (newValue && typeof newValue === 'object') {
          console.log('[useObservableProperty] newValue keys:', Object.keys(newValue));
        }
        console.log('[useObservableProperty] Calling setValue(newValue)');
        setValue(newValue);
        console.log('[useObservableProperty] === END CALLBACK ===');
      });

      return () => {
        try {
          service[eventName].unsubscribe(listenerId);
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      };
    }
  }, [service, propertyName]);

  /**
   * Custom setter that calls the .NET setter
   * @param {T} newValue - Nouvelle valeur
   */
  const setValueWrapper = React.useCallback((newValue) => {
    const setterMethod = 'Set' + propertyName;
    if (service && typeof service[setterMethod] === 'function') {
      service[setterMethod](newValue);
    }
  }, [service, propertyName]);

  return [value, setValueWrapper];
}

/**
 * Hook to subscribe to an ObservableCollection from .NET
 *
 * @template T - Type des éléments de la collection
 * @param {ServiceProxy|null} service - The Dotnet service proxy
 * @param {string} collectionName - The name of the collection (e.g., 'Todos')
 * @returns {T[]} The collection array
 *
 * @example
 * // Dans un composant React :
 * let todoService = null;
 * const todos = useObservableCollection(todoService, 'Todos');
 *
 * // Dans JSX :
 * {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
 */
export function useObservableCollection(service, collectionName) {
  const [collection, setCollection] = React.useState([]);

  React.useEffect(() => {
    if (!service || !collectionName) return;

    const getterMethod = 'Get' + collectionName;
    const eventName = 'On' + collectionName + 'Changed';

    /**
     * Helper to fetch and update collection
     */
    const updateCollection = async () => {
      try {
        const data = await service[getterMethod]();
        console.log(`[useObservableCollection] Collection ${collectionName} updated:`, data);
        if (Array.isArray(data)) {
          setCollection(data);
        } else {
          console.error(`[useObservableCollection] ${getterMethod} did not return an array:`, data);
        }
      } catch (error) {
        console.error(`[useObservableCollection] Error getting collection ${collectionName}:`, error);
      }
    };

    updateCollection();

    if (service[eventName] && typeof service[eventName].subscribe === 'function') {
      const listenerId = service[eventName].subscribe(() => {
        updateCollection();
      });

      console.log(`[useObservableCollection] Subscribed to ${eventName}`);

      return () => {
        try {
          service[eventName].unsubscribe(listenerId);
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      };
    }
  }, [service, collectionName]);

  return collection;
}

/**
 * Hook to get a full service with organized reactive properties, methods, collections, and events
 * Returns an organized object structure for clean API access
 *
 * @template T
 * @param {string} serviceName - The name of the service to load (e.g., 'Timer')
 * @returns {Object} Service object with Properties, Collections, Methods, and Events
 *
 * @example
 * const timer = useService('Timer');
 *
 * // Access:
 * timer.Properties.IsRunning      // Reactive value
 * timer.Collections.Todos       // Synchronized array
 * timer.Methods.Start()         // Stable method
 * timer.Events.OnTimerStopped.subscribe(callback)
 */

// Store cache to hold service stores
const serviceStores = {};

function getOrCreateStore(serviceName) {
  if (!serviceStores[serviceName]) {
    serviceStores[serviceName] = createServiceStore(serviceName);
  }
  return serviceStores[serviceName];
}

function createServiceStore(serviceName) {
  let service = null;
  let loaded = false;
  let loading = false;  // Prevent concurrent loading
  let version = 0;
  let cachedSnapshot = null;
  const subscribers = new Set();
  
  // Internal state (mutable)
  const internalState = {
    Properties: {},
    Collections: {},
    Methods: {},
    Events: {},
    _loading: true,
    _service: null
  };

  function notify() {
    version++;
    cachedSnapshot = null; // Invalidate cache so a new snapshot is created
    subscribers.forEach(cb => cb());
  }

  function createSnapshot() {
    // Create a new object with current values
    // This ensures React detects the change via Object.is()
    return {
      Properties: { ...internalState.Properties },
      Collections: { ...internalState.Collections },
      Methods: internalState.Methods, // Proxy, same reference is OK
      Events: { ...internalState.Events },
      _loading: internalState._loading,
      _service: internalState._service,
      _version: version
    };
  }

  function initializeService(s) {
    if (loaded) return;
    loaded = true;
    service = s;
    
    // Get property names safely
    let propertyNames = [];
    if (s._propertyValues && typeof s._propertyValues.keys === 'function') {
      propertyNames = Array.from(s._propertyValues.keys());
    }
    
    // Initialize each property
    propertyNames.forEach(propName => {
      // Get initial value
      const value = s._propertyValues ? s._propertyValues.get(propName) : undefined;
      internalState.Properties[propName] = value;
      
      // Create setter
      internalState.Properties[`Set${propName}`] = (val) => {
        const setterMethod = `Set${propName}`;
        if (service && typeof service[setterMethod] === 'function') {
          service[setterMethod](val);
        }
      };

      // Subscribe to property changes
      const eventName = `On${propName}Changed`;
      if (service[eventName] && typeof service[eventName].subscribe === 'function') {
        // Store event reference
        internalState.Events[eventName] = {
          subscribe: (callback) => service[eventName].subscribe(callback),
          unsubscribe: (id) => service[eventName].unsubscribe(id)
        };

        // Subscribe and update state
        const listenerId = service[eventName].subscribe((newValue) => {
          console.log(`[useService] Property ${propName} changed to:`, newValue);
          internalState.Properties[propName] = newValue;
          notify();
          console.log(`[useService] Notified ${subscribers.size} subscribers`);
        });
        
        console.log(`[useService] Subscribed to ${eventName}, listenerId:`, listenerId);
      }
    });

    // Initialize collections
    propertyNames.forEach((propName) => {
      const isCollection = s._observableCollections && 
                         typeof s._observableCollections.get === 'function' ? 
                         s._observableCollections.get(propName) : false;
      
      if (isCollection) {
        const getterMethod = `Get${propName}`;
        if (service[getterMethod]) {
          service[getterMethod]().then((data) => {
            internalState.Collections[propName] = data;
            notify();
          }).catch((e) => {
            console.error(`Error fetching collection ${propName}:`, e);
          });
        }

        const eventName = `On${propName}Changed`;
        if (service[eventName]) {
          service[eventName].subscribe(() => {
            service[getterMethod]().then((data) => {
              internalState.Collections[propName] = data;
              notify();
            });
          });
        }
      }
    });

    // Create methods proxy
    internalState.Methods = new Proxy({}, {
      get(target, prop) {
        if (service && typeof service[prop] === 'function') {
          return service[prop];
        }
        return undefined;
      }
    });

    internalState._loading = false;
    internalState._service = service;
    
    // Notify that we're done loading
    notify();
    
    console.log(`[useService] Service ${serviceName} initialized successfully`);
  }

  // Load the service
  function loadService() {
    if (loaded || loading || !DotnetBridge) return;
    loading = true;  // Prevent concurrent calls
    
    DotnetBridge.getService(serviceName).then(initializeService).catch(error => {
      console.error(`[useService] Error loading service ${serviceName}:`, error);
      internalState._loading = false;
      loading = false;
      notify();
    });
  }

  // Try to load immediately
  loadService();

  // Also try when bridge is ready (in case it wasn't ready yet)
  if (typeof DotnetBridge !== 'undefined' && DotnetBridge.onReady) {
    DotnetBridge.onReady(loadService);
  }

  return {
    subscribe(onChange) {
      subscribers.add(onChange);
      return () => subscribers.delete(onChange);
    },
    getSnapshot() {
      // Return cached snapshot if version hasn't changed
      if (cachedSnapshot && cachedSnapshot._version === version) {
        return cachedSnapshot;
      }
      // Create new snapshot with current version
      cachedSnapshot = createSnapshot();
      return cachedSnapshot;
    }
  };
}

export function useService(serviceName) {
  const store = getOrCreateStore(serviceName);
  
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot
  );
}

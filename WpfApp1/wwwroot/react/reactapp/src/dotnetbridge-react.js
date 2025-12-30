import React, { useState, useEffect, useCallback } from 'react';

/**
 * dotnetbridge-react.js
 * Helper functions for React integration with DotnetBridge
 */

/**
 * Hook to subscribe to an Observable Property from .NET
 * @param {Object} service - The Dotnet service proxy
 * @param {string} propertyName - The name of property (e.g., 'IsRunning')
 * @returns {[any, function]} [value, setValue] tuple like useState
 *
 * @example
 * let timerService = null;
 * const [isRunning, setIsRunning] = useObservableProperty(timerService, 'IsRunning');
 *
 * // In JSX:
 * <p>Status: {isRunning ? 'Running' : 'Stopped'}</p>
 * 
 * // To set value (calls SetIsRunning on the service):
 * setIsRunning(true);
 */
export function useObservableProperty(service, propertyName) {
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (!service || !propertyName) return;

    const getterMethod = 'Get' + propertyName;
    const setterMethod = 'Set' + propertyName;
    const eventName = 'On' + propertyName + 'Changed';

    // Get initial value
    if (typeof service[getterMethod] === 'function') {
      service[getterMethod]().then(initialValue => {
        setValue(initialValue);
      }).catch(error => {
        console.error(`[useObservableProperty] Error getting initial value for ${propertyName}:`, error);
      });
    }

    // Subscribe to changes
    if (service[eventName] && typeof service[eventName].subscribe === 'function') {
      const listenerId = service[eventName].subscribe((newValue, oldValue) => {
        setValue(newValue);
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

  // Custom setter that calls the .NET setter
  const setValueWrapper = useCallback((newValue) => {
    const setterMethod = 'Set' + propertyName;
    if (service && typeof service[setterMethod] === 'function') {
      service[setterMethod](newValue);
    }
  }, [service, propertyName]);

  return [value, setValueWrapper];
}

/**
 * Hook to subscribe to an ObservableCollection from .NET
 * @param {Object} service - The Dotnet service proxy
 * @param {string} collectionName - The name of the collection (e.g., 'Todos')
 * @returns {Array} The collection array
 *
 * @example
 * let todoService = null;
 * const todos = useObservableCollection(todoService, 'Todos');
 *
 * // In JSX:
 * {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
 */
export function useObservableCollection(service, collectionName) {
  const [collection, setCollection] = useState([]);

  useEffect(() => {
    if (!service || !collectionName) return;

    const getterMethod = 'Get' + collectionName;
    const eventName = 'On' + collectionName + 'Changed';

    // Helper to fetch and update collection
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

    // Get initial collection
    updateCollection();

    // Subscribe to changes
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

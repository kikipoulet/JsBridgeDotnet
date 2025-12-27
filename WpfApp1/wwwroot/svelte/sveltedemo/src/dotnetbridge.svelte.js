// dotnetbridge.svelte.js
// Helper functions for Svelte integration with DotnetBridge

import { writable, derived } from 'svelte/store';

/**
 * Convert an Observable Property from .NET to a Svelte store with bidirectional binding.
 * This function:
 * 1. Gets the initial value from the service (calls Get{PropertyName})
 * 2. Subscribes to property changes (On{PropertyName}Changed)
 * 3. Returns a writable store that can be used with the $ prefix in Svelte
 * 4. When setting the store value (e.g., $isRunning = true), it calls Set{PropertyName} on the service
 *
 * @param {Object} service - The Dotnet service proxy
 * @param {string} propertyName - The name of the property (e.g., 'IsRunning')
 * @returns {import('svelte/store').Writable} A writable store for the property
 *
 * @example
 * let timerService = null;
 * let isRunning = null;
 *
 * onMount(async () => {
 *     timerService = await DotnetBridge.getService('Timer');
 *     isRunning = OPtoStore(timerService, 'IsRunning');
 * });
 *
 * // In template (use $ prefix):
 * <p>Status: {$isRunning ? 'Running' : 'Stopped'}</p>
 * 
 * // In script (bidirectional binding):
 * $isRunning = true;  // Calls SetIsRunning(true) on the service
 */
export function OPtoStore(service, propertyName) {
    if (!service) {
        console.error('[OPtoStore] Service is null or undefined');
        return writable(null);
    }

    if (!propertyName) {
        console.error('[OPtoStore] Property name is required');
        return writable(null);
    }

    // Construct the getter method name (e.g., 'GetIsRunning')
    const getterMethod = 'Get' + propertyName;

    // Construct the setter method name (e.g., 'SetIsRunning')
    const setterMethod = 'Set' + propertyName;

    // Construct the event name (e.g., 'OnIsRunningChanged')
    const eventName = 'On' + propertyName + 'Changed';

    // Check if the getter method exists
    if (typeof service[getterMethod] !== 'function') {
        console.error(`[OPtoStore] Method ${getterMethod} not found on service`);
        return writable(null);
    }

    // Create a custom writable store
    const { set, subscribe, update } = writable(null);
    
    // Internal set method that doesn't call the .NET setter
    // This is used when the property changes from .NET side
    const internalSet = (value) => {
        set(value);
    };

    // Override the set method to call the .NET setter
    const externalSet = (value) => {
        // Call the .NET setter
        if (typeof service[setterMethod] === 'function') {
            service[setterMethod](value);
        } else {
            console.warn(`[OPtoStore] Setter method ${setterMethod} not found, only updating local store`);
            internalSet(value);
        }
    };

    // Asynchronously get the initial value and update the store
    service[getterMethod]().then(initialValue => {
        internalSet(initialValue);
        console.log(`[OPtoStore] Initial value for ${propertyName}:`, initialValue);
    }).catch(error => {
        console.error(`[OPtoStore] Error getting initial value for ${propertyName}:`, error);
    });

    // Check if the event subscription interface exists
    if (service[eventName] && typeof service[eventName].subscribe === 'function') {
        // Subscribe to property changes and update the store using internalSet
        const listenerId = service[eventName].subscribe((newValue, oldValue) => {
            internalSet(newValue);
            console.log(`[OPtoStore] ${propertyName} changed: ${oldValue} -> ${newValue}`);
        });

        console.log(`[OPtoStore] Subscribed to ${eventName} with listener ID:`, listenerId);
    } else {
        console.warn(`[OPtoStore] Event ${eventName} not found or does not have subscribe method`);
    }

    // Return the store with custom set method
    return {
        set: externalSet,
        subscribe,
        update
    };
}

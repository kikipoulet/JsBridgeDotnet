/**
 * TypeScript type definitions for @kikipoulet/react-dotnetbridge
 */

import type { Dispatch, SetStateAction } from 'react';

/**
 * Core bridge interface
 */
export interface DotnetBridge {
  /**
   * Get a .NET service proxy
   * @param serviceName - Name of the service to retrieve
   * @param options - Optional configuration for instance management
   */
  getService<T extends ServiceProxy = ServiceProxy>(
    serviceName: string,
    options?: BridgeOptions
  ): Promise<T>;

  /**
   * Check if the bridge is ready to communicate with .NET
   */
  isReady(): boolean;

  /**
   * Register a callback to be executed when the bridge is ready
   * @param callback - Function to call when bridge is ready
   */
  onReady(callback: () => void): void;
}

/**
 * Options for retrieving a service
 */
export interface BridgeOptions {
  /** Specific instance ID for transient services */
  instanceId?: string;
  /** Force creation of a new instance */
  createNewInstance?: boolean;
  /** Parameters to pass to the constructor (transient only) */
  constructorParameters?: unknown[];
}

/**
 * Proxy representing a .NET service
 */
export interface ServiceProxy {
  /** Name of the service */
  _serviceName: string;
  /** Instance ID for transient services */
  _instanceId?: string;

  /**
   * Call a method on the service
   * @param methodName - Name of the method to call
   * @param parameters - Parameters to pass to the method
   */
  call(methodName: string, parameters?: unknown[]): Promise<unknown>;

  /**
   * Internal method to update a property value
   * @internal
   */
  _updateProperty(propertyPath: string, value: unknown): void;

  /** @internal */
  _propertyValues: Map<string, unknown>;
  /** @internal */
  _propertySubscribers: Map<string, Set<(value: unknown, oldValue: unknown) => void>>;
  /** @internal */
  _observableCollections: Map<string, boolean>;
  /** @internal */
  _propertySubscriptions?: Map<string, { propName: string; callback: (value: unknown) => void }>;

  /**
   * Dynamic property access and method calls
   * @param propertyName - Property name or method name
   */
  [key: string]: unknown;
}

/**
 * Event subscription interface
 */
export interface EventSubscription {
  /**
   * Subscribe to an event
   * @param callback - Function to call when the event fires
   * @returns Listener ID for unsubscribe
   */
  subscribe(callback: (...args: unknown[]) => void): string;

  /**
   * Unsubscribe from the event
   * @param listenerId - Listener ID returned from subscribe
   */
  unsubscribe(listenerId: string): void;
}

/**
 * Options for useObservableProperty hook
 */
export interface UseObservablePropertyOptions {
  /** Optional initial value while loading */
  initialValue?: unknown;
}

/**
 * Hook to subscribe to an Observable Property from .NET
 *
 * @template T - Type of the property value
 * @param service - The Dotnet service proxy (null if not yet available)
 * @param propertyName - Name of the property (e.g., 'IsRunning', 'User.Name')
 * @param options - Optional configuration
 * @returns [value, setValue] - Current value and setter function
 *
 * @example
 * ```tsx
 * import { useObservableProperty } from '@kikipoulet/react-dotnetbridge';
 *
 * function MyComponent() {
 *   const [count, setCount] = useObservableProperty<number>(counterService, 'Count');
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useObservableProperty<T = unknown>(
  service: ServiceProxy | null,
  propertyName: string,
  options?: UseObservablePropertyOptions
): [T | undefined, (value: T) => void];

/**
 * Hook to subscribe to an ObservableCollection from .NET
 *
 * @template T - Type of items in the collection
 * @param service - The Dotnet service proxy (null if not yet available)
 * @param collectionName - Name of the collection property
 * @returns Array of items that updates automatically
 *
 * @example
 * ```tsx
 * import { useObservableCollection } from '@kikipoulet/react-dotnetbridge';
 *
 * interface Todo {
 *   id: number;
 *   text: string;
 *   isComplete: boolean;
 * }
 *
 * function TodoList() {
 *   const todos = useObservableCollection<Todo>(todoService, 'Todos');
 *
 *   return (
 *     <ul>
 *       {todos.map(todo => (
 *         <li key={todo.id} style={{ textDecoration: todo.isComplete ? 'line-through' : 'none' }}>
 *           {todo.text}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useObservableCollection<T = unknown>(
  service: ServiceProxy | null,
  collectionName: string
): T[];

/**
 * Default export for vanilla JavaScript usage
 */
declare const DotnetBridge: DotnetBridge;
export default DotnetBridge;

/**
 * Re-export for convenience
 */
export { DotnetBridge as dotnetBridge };

# JsWebViewConnector Implementation

## Overview
This project implements a JavaScript-C# bridge using WebView2, as described in `guide.md`. The implementation allows JavaScript code running in a WebView2 control to call C# methods and subscribe to C# events.

## Project Structure

### JsWebviewConnector Library
A reusable library that provides the bridge functionality:

- **Core/BridgeMessage.cs**: Defines message types for communication between JavaScript and C#
- **Core/ServiceBridge.cs**: Main bridge class that handles service registration and message routing
- **Extensions/WebViewExtensions.cs**: Extension methods for easy integration with WebView2 controls

### WpfApp1 (Demo Application)
A WPF application demonstrating the bridge with a TodoList service:

- **Services/TodoListService.cs**: Simple todo list service with CRUD operations and events
- **MainWindow.xaml.cs**: WPF window that hosts the WebView2 control and sets up the bridge
- **wwwroot/index.html**: Test UI for interacting with the TodoList service

## How It Works

### Communication Flow

1. **Initialization**: When the WebView2 is ready, a ServiceBridge is created and the TodoList service is registered
2. **JavaScript Bridge Injection**: A JavaScript object (`window.TodoListBridge`) is injected into the web page
3. **Method Calls**: JavaScript calls C# methods via `window.TodoListBridge.callMethod()`
4. **Event Subscriptions**: JavaScript subscribes to C# events via `window.TodoListBridge.subscribe()`
5. **Message Passing**: Messages are sent through WebView2's postMessage API and handled by the ServiceBridge

### JavaScript API

The injected bridge provides these methods:

```javascript
// Call a C# method
TodoListBridge.callMethod('MethodName', [param1, param2], function(error, result) {
    if (error) {
        console.error(error);
        return;
    }
    console.log(result);
});

// Subscribe to a C# event
const listenerId = TodoListBridge.subscribe('EventName', function(data) {
    console.log('Event received:', data);
});

// Unsubscribe from an event
TodoListBridge.unsubscribe(listenerId);
```

## TodoList Service API

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `GetAll` | none | `TodoItem[]` | Gets all todos |
| `Add` | `text` (string) | `TodoItem` | Creates a new todo |
| `Update` | `id`, `text?`, `isCompleted?` | `TodoItem` | Updates an existing todo |
| `Remove` | `id` (string) | void | Deletes a todo |
| `Clear` | none | void | Deletes all todos |
| `Count` | none | int | Gets total count |
| `GetCompletedCount` | none | int | Gets completed count |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `TodoAdded` | `TodoItem` | Fired when a todo is added |
| `TodoUpdated` | `TodoItem` | Fired when a todo is updated |
| `TodoRemoved` | `id` (string) | Fired when a todo is removed |
| `TodosCleared` | none | Fired when all todos are cleared |

### TodoItem Object

```json
{
  "id": "1",
  "text": "Task description",
  "isCompleted": false
}
```

## Running the Demo

1. Build the solution:
   ```
   dotnet build WpfApp1.sln
   ```

2. Run the WPF application:
   ```
   dotnet run --project WpfApp1/WpfApp1.csproj
   ```

3. The application will open with the TodoList interface loaded in the WebView2 control

4. Test the functionality:
   - Add new todos using the input field
   - Click checkboxes to mark todos as completed
   - Use the ✏️ button to edit todo text
   - Use the 🗑️ button to delete individual todos
   - Use "Tout effacer" to clear all todos

## Usage in Your Own Project

### 1. Reference the JsWebviewConnector Library

Add a project reference to your .csproj file:
```xml
<ProjectReference Include="..\JsWebviewConnector\JsWebviewConnector.csproj" />
```

### 2. Create Your Service

```csharp
public class MyService
{
    public string DoWork(string input)
    {
        return $"Processed: {input}";
    }
}
```

### 3. Set Up the Bridge in Your WPF Application

```csharp
using JsWebviewConnector.Core;
using JsWebviewConnector.Extensions;

// In your Window class
private MyService _myService;
private ServiceBridge _serviceBridge;

private async void InitializeAsync()
{
    await webView.EnsureCoreWebView2Async(null);
    
    _myService = new MyService();
    _serviceBridge = await webView.CreateServiceBridgeAsync();
    _serviceBridge.RegisterService("MyService", _myService);
    
    // Inject your JavaScript bridge code
    await InjectBridgeScript();
}
```

### 4. Create JavaScript Interface

```javascript
window.MyBridge = {
    callMethod: function(methodName, params, callback) {
        const message = {
            type: 'CallMethod',
            messageId: 'msg_' + Date.now(),
            serviceName: 'MyService',
            methodName: methodName,
            parameters: params || []
        };
        
        window.chrome.webview.postMessage(JSON.stringify(message));
        
        // Handle response in message listener
        window.chrome.webview.addEventListener('message', function(e) {
            const response = JSON.parse(e.data);
            if (response.type === 'MethodResult' && response.messageId === message.messageId) {
                callback(response.error || null, response.result);
            }
        });
    }
};

// Use it
MyBridge.callMethod('DoWork', ['Hello'], function(error, result) {
    console.log(result); // "Processed: Hello"
});
```

## Technical Details

### Message Format

**Call Method Message (JS → C#)**:
```json
{
  "type": "CallMethod",
  "messageId": "msg_123",
  "serviceName": "TodoList",
  "methodName": "Add",
  "parameters": ["New task"]
}
```

**Method Result Message (C# → JS)**:
```json
{
  "type": "MethodResult",
  "messageId": "msg_123",
  "success": true,
  "result": { "id": "1", "text": "New task", "isCompleted": false }
}
```

**Event Subscription Message (JS → C#)**:
```json
{
  "type": "SubscribeEvent",
  "messageId": "listener_456",
  "listenerId": "listener_456",
  "serviceName": "TodoList",
  "methodName": "TodoAdded"
}
```

**Event Fired Message (C# → JS)**:
```json
{
  "type": "EventFired",
  "serviceName": "TodoList",
  "methodName": "TodoAdded",
  "result": { "id": "1", "text": "New task", "isCompleted": false }
}
```

## Dependencies

- .NET 9.0
- Microsoft.Web.WebView2 (1.0.3712-prerelease)
- System.Text.Json (for JSON serialization)

## Notes

- The bridge uses WebView2's postMessage API for bi-directional communication
- All method parameters must be JSON serializable
- Events are multicast - multiple JavaScript listeners can subscribe to the same C# event
- The bridge automatically handles unique message IDs and listener IDs
- Error handling includes proper error propagation to JavaScript callbacks

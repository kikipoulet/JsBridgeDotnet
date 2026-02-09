
# JsBridgeDotnet

**An experimental bridge for React + C# MVVM desktop applications.**

---

## What is this?

JsBridgeDotnet is a prototype exploring a specific approach: building desktop applications using **React for the UI layer** and **C#/.NET for the business logic**, connected through a simple MVVM-style bridge.

The idea is straightforward: what if we could treat a React frontend like a XAML view, with full two-way data binding to .NET ViewModels? No REST APIs, no complex IPC—just direct method calls and observable properties.

---

## Why this approach?

### The Problem
Building modern desktop UIs with WPF/XAML can feel limiting compared to web development that have almost infinite controls and styles. Meanwhile, Electron-style apps often become bloated and lose access to native platform capabilities.

### The Experiment
This prototype explores a middle ground:
- Keep the **React ecosystem** (components, hooks, npm packages) for UI development
- Retain **.NET's strengths** for business logic, file system access, native APIs
- Use **MVVM patterns** you already know from WPF development
- Avoid the complexity of full client-server architectures for desktop apps

---


## Key Ideas Being Explored

**1. Services as ViewModels**
.NET services decorated with `[JsService]` become accessible from React.

```csharp
[JsService("Timer")]
public partial class TimerService : ObservableObject
{
    [ObservableProperty] private bool isRunning;
}
```

**2. React as a View Layer**
Instead of fighting with XAML styling and limited component libraries, use React's ecosystem directly:

```jsx
const [running, setRunning] = useObservableProperty(timerService, 'IsRunning');

 return (
            <h2>
                {running ? '⏱️ Timer Running' : '⏹️ Timer Ready'}   // <-- Reactive by Default !
            </h2>
        )
```

**3. Simple Dependency Injection**
Register services in .NET's DI container, access them from JavaScript by name. No manual service location or complex initialization.




# Getting Started


Bridge your WPF application with React seamlessly. This guide walks you through building a simple Timer application that demonstrates the two-way communication between .NET and JavaScript.

## What You'll Build

A WPF app with an embedded React UI that can control a .NET service. The React frontend will be able to start a timer running in the .NET backend and receive real-time status updates.

---

## Prerequisites

- Visual Studio with WPF workload
- Node.js and npm
- .NET 6 or later

---

## Part 1: Setting Up the WPF Application

### 1. Create a New WPF App

Create a new WPF Application project in Visual Studio.

### 2. Install Required NuGet Packages

```bash
Install-Package JsBridgeDotnet.WPF
Install-Package CommunityToolkit.Mvvm
```

### 3. Add the WebView to Your Main Window

Open `MainWindow.xaml` and add the JsBridgeWebView control:

```xml
<Window x:Class="YourApp.MainWindow"
        xmlns:jsbridge="clr-namespace:JsBridgeDotnet;assembly=JsBridgeDotnet">
    
    <jsbridge:JsBridgeWebView x:Name="jsBridgeWebView" />
    
</Window>
```

### 4. Create a Sample Service

Create a `TimerService.cs` file with the following code:

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using JsBridgeDotnet;

[JsService("Timer")]
public partial class TimerService : ObservableObject
{
    [ObservableProperty] 
    private bool isRunning = false;
    
    public void Start()
    {
        IsRunning = true;

        Task.Delay(4000).ContinueWith(t => IsRunning = false);
    }
}
```

> **Note:** The `[JsService("Timer")]` attribute exposes this class to JavaScript with the name "Timer". The `[ObservableProperty]` attribute from MVVM Toolkit automatically creates the `IsRunning` property with change notification.

### 5. Configure the WebView

In `MainWindow.xaml.cs`, set up the service provider and initialize the bridge:

```csharp
public partial class MainWindow : Window
{
    public static IServiceProvider ServiceProvider;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += async (s, e) => await InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        try
        {
            // Configure the local React app location
            await jsBridgeWebView.ConfigureLocalPage("ReactApp", "dist");

            // Register your services
            var services = new ServiceCollection();
            services.AddSingleton<TimerService>();
            ServiceProvider = services.BuildServiceProvider();

            // Initialize the bridge
            await jsBridgeWebView.InitializeAsync(services, ServiceProvider);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Initialization error: {ex.Message}", 
                "Error", 
                MessageBoxButton.OK, 
                MessageBoxImage.Error);
        }
    }
}
```

---

## Part 2: Creating the React Frontend

### 6. Initialize the React Application

From your WPF project directory, create a new React app:

```bash
npm create vite@latest ReactApp -- --template react
```

When prompted, select **React** and **JavaScript**.

### 7. Install the React Bridge Package

```bash
cd ReactApp
npm install @kikipoulet/react-dotnetbridge
```

### 8. Create the React Component

Replace the contents of `src/App.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import { DotnetBridge, useObservableProperty } from '@kikipoulet/react-dotnetbridge';

function App() {
    const [timerService, setTimerService] = useState(null);
    const [running, setRunning] = useObservableProperty(timerService, 'IsRunning');

    useEffect(() => {
        const initService = async () => {
            const service = await DotnetBridge.getService('Timer');
            setTimerService(service);
        };
        initService();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>

            <h2 style={{ color: running ? '#4CAF50' : '#666' }}>
                {running ? '⏱️ Timer Running' : '⏹️ Timer Ready'}
            </h2>
            
            <button  onClick={() => timerService?.Start()} disabled={running} >
                Start Timer
            </button>
        </div>
    );
}

export default App;
```

> **How it works:**
> - `DotnetBridge.getService('Timer')` retrieves the .NET service we registered
> - `useObservableProperty` automatically subscribes to property changes and keeps the UI in sync

### 9. Build the React Application

```bash
npm run build
```

This creates a `dist` folder with your compiled React app.

---

## Part 3: Wiring Everything Together

### 10. Verify the Path Configuration

Ensure the path in your `MainWindow.xaml.cs` matches your React build output:

```csharp
await jsBridgeWebView.ConfigureLocalPage("ReactApp", "dist");
```

The first argument is the folder name relative to your project root. The second is the subfolder containing the built files (typically `dist` for Vite).

### 11. Include React Files in Your Build

Add this to your `.csproj` file to ensure the React app is copied to the output directory:

```xml
<ItemGroup>
    <Content Include="ReactApp\**">
        <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
</ItemGroup>
```

---

## Part 4: Run Your Application

### 12. Launch the WPF App

You should see:
- A React UI embedded in your WPF window
- A button that starts a 4-second timer
- The status text updating in real-time when the timer starts and stops



# React Complete API



---

## 1. ObservableProperty - Basic Types

Synchronize simple types (boolean, string, number) between React and C#.

**React:**
```jsx
const [isRunning, setIsRunning] = useObservableProperty(timerService, 'IsRunning');
const [input, setInput] = useObservableProperty(timerService, 'Input');

// Display
<p>Status: {isRunning ? 'Running' : 'Stopped'}</p>
<input value={input} onChange={(e) => setInput(e.target.value)} />
```

**C# Service:**
```csharp
public class TimerService : ObservableObject
{
    [ObservableProperty] private bool isRunning;
    [ObservableProperty] private string input;
}
```

---

## 2. ObservableProperty - Complex Objects

Synchronize complex objects with automatic nested property updates.

**React:**
```jsx
const [article, setArticle] = useObservableProperty(service, 'Article');

// Nested properties update automatically
<p>{article.name}</p>
<p>${article.price.toFixed(2)}</p>
<img src={article.imageUrl} />
```

**C# Service:**
```csharp
public class ArticleInfoService : ObservableObject
{
    [ObservableProperty] private Article article
}

public partial class Article : ObservableObject
{
    [ObservableProperty]private string name  = string.Empty;
    [ObservableProperty] private double price = 0;
    [ObservableProperty] private string imageUrl  = string.Empty;
}
```

---

## 3. ObservableCollection - Lists

Real-time synchronization of collections between .NET and React.

**React:**
```jsx
const todos = useObservableCollection(todoService, 'Todos');

// Automatically re-renders when collection changes
{todos.map(todo => (
  <li key={todo.id}>
    {todo.text}
    <button onClick={() => todoService.Delete(todo.id)}>Delete</button>
  </li>
))}
```

**C# Service:**
```csharp
public class TodoListService
{
    public ObservableCollection<Todo> Todos { get; } = new();

    public void Delete(string id) => ...
}

public class Todo
{
    public int Id { get; set; }
    public string Text { get; set; }
}
```

---

## 4. Service Methods

Call C# methods directly from React.

**React:**
```jsx
  await timerService.Start();

```

**C# Service:**
```csharp
public class TimerService
{
    public void Start() { /* ... */ }
}

```

---

## 5. Singleton/Transient Service

Single shared instance across the entire application.

**React:**
```jsx
 const [timerService, setTimerService] = useState(null);

useEffect(() => {
  const initService = async () => {
    const service = await DotnetBridge.getService('Timer');
    setTimerService(service);
  };
  initService();
}, []);
```


---

## 6. Transient Service with Parameters

Dynamic service instances with constructor injection.

**React:**
```jsx

    const service = await DotnetBridge.getService('ArticleInfo', {
      constructorParameters: [articleId]
    });
   
```

**C# Registration:**
```csharp

public class ArticleInfoService
{
    public ArticleInfoService(int articleId)
    {
       ...
    }
}
```

---

## 7. Property Getters/Setters (Auto-generated)

Automatic getter and setter methods for properties.

**React:**
```jsx
const count = await service.GetCount();

await service.SetCount(42);
```

**C# Service:**
```csharp
public class CounterService : ObservableObject
{
    [ObservableProperty] private int count;
}
```

---

## 8. Events

Subscribe to C# events from React.

**React:**
```jsx
useEffect(() => {

  const listenerId = service.OnTimerCompleted.subscribe((result) => {
    console.log('Timer finished!', result);
  });
  
}, []);
```

**C# Service:**
```csharp
public class TimerService
{
    public event EventHandler<string> OnTimerCompleted;
}
```

---

## Summary Table

| Feature | React Hook/Method | C# Pattern |
|---------|------------------|------------|
| **Property Sync** | `useObservableProperty(service, 'Name')` | `ObservableProperty` with `SetProperty()` |
| **Collection Sync** | `useObservableCollection(service, 'Items')` | `ObservableCollection<T>` |
| **Method Call** | `await service.MethodName()` | Public method in service |
| **Singleton** | `DotnetBridge.getService('Name')` | `services.AddSingleton<T>()` |
| **Transient** | `getService('Name', { constructorParameters: [] })` | `services.AddTransient<T>()` |
| **Event** | `service.OnEventName.subscribe(callback)` | C# `event EventHandler<T>` |
| **Nested Objects** | `property.subProperty` | Observable object properties |
| **Auto Getter** | `await service.GetPropertyName()` | Property with getter |
| **Auto Setter** | `await service.SetPropertyName(value)` | Property with setter |

---

## Core Principle

**Changes in C# automatically trigger React re-renders. No manual event handling or polling required.**

```

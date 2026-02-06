The goal of this mini framework is to use a js front-end with a MVVM approach. 
C# ViewModel is a classic unaltered ViewModel, and can be registered as singleton or transient.
Then, the js can get the service and get the properties and call methods directly.
The end goal could be to produce a deeper integration with js framework, an ObservableProperty could be bind directly to a svelte store, .. 

Simple C# ViewModel :

```csharp
public partial class TimerService : ObservableObject
{
    [ObservableProperty] private bool isRunning = false;

    public void Start()
    {
        // Change isrunning, wait 5 seconds and rechange isrunning + call stopped event
    }

    public event EventHandler? TimerStopped;
}
```

Used by Svelte Component : 

```javascript
<script>
  let timerService = null;
  let isRunning = null;

  onMount(async () => {
      timerService = await DotnetBridge.getService('Timer');
      
      isRunning = OPtoStore(timerService, 'IsRunning');
       
      timerService.OnTimerStopped.subscribe(() => console.log('Timer stopped!'));
  });
</script>

<p>Timer : {$isRunning ? 'Running...' : 'Stopped'}</p>

<button on:click={() => timerService.Start()} disabled={$isRunning}>
      {$isRunning ? '⏳ Wait ..' : '🚀 Start Timer (3 secondes)'}
</button>

```

----------------------------------------------------------------

```csharp
public partial class TodoListService : ObservableObject
{
    public ObservableCollection<TodoItem> Todos { get; set; } = new ObservableCollection<TodoItem>();

    public void Add(string text) => ...
    
    public void Remove(string id) => ...
}

```

Used by React Component :

```javascript
function TodoList() {
    
    const [todoService, setTodoService] = useState(null);
    const [newTodo, setNewTodo] = useState('');
    const todos = useObservableCollection(todoService, 'Todos');
    const addTodo = async () => await todoService.Add(newTodo);
    const removeTodo = async (id) => await todoService.Remove(id);
    
    useEffect(async () => {
        const service = await window.DotnetBridge.getService('TodoList');
        setTodoService(service);
    }, []);
    
    return (
        <div>
            <div >
                <input type="text" value={newTodo} />
                <button onClick={addTodo}>
                    Add
                </button>
            </div>

            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}>
                        <span>{todo.text}</span>
                        <button onClick={() => removeTodo(todo.id)}>
                            Delete Item
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

```

# react



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

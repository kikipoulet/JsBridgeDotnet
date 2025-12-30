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

# what is currently supported 

## C# Side

#### 1. Service

```csharp


public partial class TodoListService : ObservableObject
{
    public ObservableCollection<TodoItem> Todos { get; set; } = new ObservableCollection<TodoItem>(); 

    public int Count {get;set;} = 1;

    public void Add(string text) => ...

    [ObservableProperty] private int isRunning = false;

    public event EventHandler? TimerStopped;

}
```

### 2. Initialisation du Bridge dans la webview et enregistrement du service

```csharp

        // Créer le bridge pour le WebView
        var serviceBridge = await webView.CreateServiceBridgeAsync();
        
        // Enregistrer le service
        serviceBridge.RegisterSingletonService("TodoList", new TodoListService());

        // Helper pour Naviguer vers la page HTML
        webView.NavigateToLocalPage("wwwroot", "index.html");
    

```

---

## JS Side - vanillaJS

```javascript
<script>
    async function init() {
        const todoService = await DotnetBridge.getService("TodoList");

        todoService.OnTodosChanged.subscribe((args) => { }); 

        todoservice.GetCount();
        todoservice.SetCount(x);

        todoservice.Add("item")

        todoservice.GetIsRunning();
        todoservice.SetIsRunning(x);
        todoservice.OnIsRunningChanged.subscribe((newValue, oldValue) => { });

        todoService.OnTimerStopped.subscribe(() => { });
    }
</script>
```

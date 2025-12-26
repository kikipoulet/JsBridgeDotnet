
## Côté C#

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

## Côté JavaScript

```javascript

const todoService = await DotnetBridge.getService("TodoList");


todoService.OnTodosChanged.subscribe((args) => { }); 

todoservice.GetCount();
todoservice.SetCount(x);

todoservice.Add("item")

todoservice.GetIsRunning();
todoservice.SetIsRunning(x);
todoservice.OnIsRunningChanged.subscribe((newValue, oldValue) => { });

todoService.OnTimerStopped.subscribe(() => { });


```

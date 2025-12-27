using JsBridgeDotnet.WebView2Handler;
using System.Windows;
using WpfApp1.Services;

namespace WpfApp1;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        InitializeAsync();
    }

    private async void InitializeAsync()
    {
        var serviceBridge = await webView.CreateServiceBridgeAsync();
        
        // Enregistrement de services singleton (comportement existant)
       // serviceBridge.RegisterTransientService<TodoListService>("TodoList",() => new TodoListService());
        serviceBridge.RegisterSingletonService("TodoList", new TodoListService());
     
        serviceBridge.RegisterSingletonService("Timer", new TimerService());
       // serviceBridge.RegisterTransientService<TimerService>("Timer", () => new TimerService());


        webView.NavigateToLocalPage("wwwroot", "index.html");
    }

}

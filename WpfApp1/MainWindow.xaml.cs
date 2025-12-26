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
        
        serviceBridge.RegisterSingletonService("TodoList", new TodoListService());
        serviceBridge.RegisterSingletonService("Timer", new TimerService());

        webView.NavigateToLocalPage("wwwroot", "index.html");
    }

}

using System.IO;
using JsBridgeDotnet.WebView2Handler;
using System.Windows;
using Microsoft.Web.WebView2.Core;
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
        await webView.ConfigureLocalPage("wwwroot", "svelte", "sveltedemo", "dist");
        
        var serviceBridge = await webView.CreateServiceBridgeAsync();
        
        serviceBridge.RegisterSingletonService("TodoList", new TodoListService());
        serviceBridge.RegisterSingletonService("Timer", new TimerService());
       // serviceBridge.RegisterTransientService<TodoListService>("TodoList",() => new TodoListService());
       // serviceBridge.RegisterTransientService<TimerService>("Timer", () => new TimerService());


       
       webView.Source = new Uri("https://appassets/index.html");
       
    }

}

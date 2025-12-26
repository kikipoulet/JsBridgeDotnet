using JsBridgeDotnet.Extensions;
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

        webView.NavigateToLocalPage("wwwroot", "index.html");
       
        
        var todoListService = new TodoListService();

        webView.NavigationCompleted += (sender, e) =>
        {
            serviceBridge.RegisterSingletonService("TodoList", todoListService);
        };
    }

}

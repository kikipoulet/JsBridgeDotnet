using JsBridgeDotnet.Core;
using JsBridgeDotnet.Extensions;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Microsoft.Web.WebView2.Core;
using WpfApp1.Services;

namespace WpfApp1;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    private TodoListService? _todoListService;
    private ServiceBridge? _serviceBridge;

    public MainWindow()
    {
        InitializeComponent();
        InitializeAsync();
    }

    private async void InitializeAsync()
    {
        // Initialize WebView2
        await webView.EnsureCoreWebView2Async(null);

        // Create TodoListService
        _todoListService = new TodoListService();

        // Create ServiceBridge
        _serviceBridge = await webView.CreateServiceBridgeAsync();

        // Navigate to local test page
        var htmlPath = System.IO.Path.Combine(
            System.AppDomain.CurrentDomain.BaseDirectory,
            "wwwroot", "index.html");
        webView.Source = new Uri("file:///" + htmlPath);

        // Register service AFTER page is loaded
        webView.NavigationCompleted += (sender, e) =>
        {
            _serviceBridge.RegisterService("TodoList", _todoListService);
        };
    }

}

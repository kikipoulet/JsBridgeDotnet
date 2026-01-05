using System;
using WpfApp1.Services;
using System.Windows;

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
        try
        {

            await jsBridgeWebView.ConfigureLocalPage("wwwroot", "react", "reactapp", "dist");
            await jsBridgeWebView.InitializeAsync();
            
            // jsBridgeWebView.ServiceBridge.RegisterSingletonService("TodoList", new TodoListService());
            jsBridgeWebView.ServiceBridge.RegisterSingletonService("Timer", new TimerService());
            jsBridgeWebView.ServiceBridge.RegisterTransientService<TodoListService>("TodoList", () => new TodoListService());
            // jsBridgeWebView.ServiceBridge.RegisterTransientService<TimerService>("Timer", () => new TimerService());
            
            jsBridgeWebView.Source = new Uri("https://appassets/index.html");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Erreur d'initialisation: {ex.Message}", "Erreur", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
}

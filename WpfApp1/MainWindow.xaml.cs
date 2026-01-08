using System;
using WpfApp1.Services;
using System.Windows;
using Microsoft.Extensions.DependencyInjection;

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


    public static IServiceProvider serviceProvider;

    private async void InitializeAsync()
    {
        try
        {
            await jsBridgeWebView.ConfigureLocalPage("wwwroot", "react", "reactapp", "dist");

            var services = new ServiceCollection();
            services.AddSingleton<TimerService>();
            services.AddTransient<TodoListService>();
            serviceProvider = services.BuildServiceProvider();

            await jsBridgeWebView.InitializeAsync(services, serviceProvider);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Erreur d'initialisation: {ex.Message}", "Erreur", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
}

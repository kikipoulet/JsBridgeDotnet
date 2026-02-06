using CommunityToolkit.Mvvm.ComponentModel;
using System.Timers;
using Timer = System.Timers.Timer;
using JsBridgeDotnet.Core;

namespace WpfApp1.Services;

[JsService("Timer")]
public partial class TimerService : ObservableObject
{
    [ObservableProperty] private bool isRunning = false;
    [ObservableProperty] private string input = "test";
    
    
    private Timer? _timer;
    private int _secondsRemaining;
    
    public void Start()
    {
        Console.WriteLine(Name);
        if (_timer != null)
        {
            _timer.Stop();
            _timer.Dispose();
        }
        
        IsRunning = true;
        _secondsRemaining = 10;
        
        _timer = new Timer(1000); // 1 second interval
        _timer.Elapsed += OnTimerElapsed;
        _timer.AutoReset = true;
        _timer.Start();
    }
    
    private void OnTimerElapsed(object? sender, ElapsedEventArgs e)
    {
        _secondsRemaining--;
        
        if (_secondsRemaining <= 0)
        {
            _timer?.Stop();
            _timer?.Dispose();
            _timer = null;
            
            IsRunning = false;
            OnTimerStopped();
        }
    }
    
    public event EventHandler? TimerStopped;
    
    protected virtual void OnTimerStopped()
    {
        TimerStopped?.Invoke(this, EventArgs.Empty);
    }

    [ObservableProperty] private string name = "";
    
    
    
}

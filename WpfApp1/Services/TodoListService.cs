using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace WpfApp1.Services;

public class TodoItem
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

public partial class TodoListService : ObservableObject
{
    public ObservableCollection<TodoItem> Todos { get; set; } = new ObservableCollection<TodoItem>();
    private int _nextId = 1;

    public void Add(string text)
    {
        var todo = new TodoItem
        {
            Id = _nextId.ToString(),
            Text = text
        };
        
        Todos.Add(todo);
        _nextId++;
    }
    
    public void Remove(string id)
    {
        var todo = Todos.FirstOrDefault(t => t.Id == id);
        if (todo != null)
        {
            Todos.Remove(todo);
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;

namespace WpfApp1.Services
{

    public class TodoItem
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
    }
    
    public class TodoListChangedEventArgs : EventArgs
    {
        public TodoItem[] Todos { get; set; } = Array.Empty<TodoItem>();
    }

    public partial class TodoListService : ObservableObject
    {
        [ObservableProperty] private int _itemsCount = 0;
        
        private readonly List<TodoItem> _todos;
        private int _nextId;

        public event EventHandler<TodoListChangedEventArgs>? TodoListChanged;

        public TodoListService()
        {
            _todos = new List<TodoItem>();
            _nextId = 1;
        }
        public TodoItem[] GetAll()
        {
            return _todos.ToArray();
        }

        public void Add(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Task text cannot be empty");

            var todo = new TodoItem
            {
                Id = _nextId.ToString(),
                Text = text,
                IsCompleted = false
            };

            _todos.Add(todo);
            _nextId++;
            ItemsCount = _todos.Count;
            OnTodoListChanged();
        }

        public void Remove(string id)
        {
            var todo = _todos.Find(t => t.Id == id);
            if (todo == null)
                throw new ArgumentException($"Todo with id '{id}' not found");

            _todos.Remove(todo);
            ItemsCount = _todos.Count;
            OnTodoListChanged();
        }
        
        private void OnTodoListChanged()
        {
            TodoListChanged?.Invoke(this, new TodoListChangedEventArgs
            {
                Todos = _todos.ToArray()
            });
        }
    }
}

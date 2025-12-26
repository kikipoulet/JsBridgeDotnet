using System;
using System.Collections.Generic;
using System.Linq;

namespace WpfApp1.Services
{
    /// <summary>
    /// Représente une tâche dans la liste
    /// </summary>
    public class TodoItem
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
    }

    /// <summary>
    /// Arguments d'événement pour TodoListChanged
    /// </summary>
    public class TodoListChangedEventArgs : EventArgs
    {
        public TodoItem[] Todos { get; set; } = Array.Empty<TodoItem>();
    }

    /// <summary>
    /// Service simplifié pour gérer une liste de tâches
    /// </summary>
    public class TodoListService
    {
        private readonly List<TodoItem> _todos;
        private int _nextId;

        public event EventHandler<TodoListChangedEventArgs>? TodoListChanged;

        public TodoListService()
        {
            _todos = new List<TodoItem>();
            _nextId = 1;
        }

        /// <summary>
        /// Récupère toutes les tâches
        /// </summary>
        public TodoItem[] GetAll()
        {
            return _todos.ToArray();
        }

        /// <summary>
        /// Ajoute une nouvelle tâche
        /// </summary>
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

            // Déclencher l'événement avec toute la liste mise à jour
            OnTodoListChanged();
        }

        /// <summary>
        /// Supprime une tâche
        /// </summary>
        public void Remove(string id)
        {
            var todo = _todos.Find(t => t.Id == id);
            if (todo == null)
                throw new ArgumentException($"Todo with id '{id}' not found");

            _todos.Remove(todo);

            // Déclencher l'événement avec toute la liste mise à jour
            OnTodoListChanged();
        }

        /// <summary>
        /// Notifie que la liste a changé
        /// </summary>
        private void OnTodoListChanged()
        {
            TodoListChanged?.Invoke(this, new TodoListChangedEventArgs
            {
                Todos = _todos.ToArray()
            });
        }

        /// <summary>
        /// Compte le nombre de tâches
        /// </summary>
        public int Count()
        {
            return _todos.Count;
        }

        /// <summary>
        /// Compte le nombre de tâches complétées
        /// </summary>
        public int GetCompletedCount()
        {
            return _todos.Count(t => t.IsCompleted);
        }
    }
}

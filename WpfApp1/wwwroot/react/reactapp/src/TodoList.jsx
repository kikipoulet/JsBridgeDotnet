import { useState, useEffect } from 'react';
import './dotnetbridge.js';
import { useObservableCollection } from './dotnetbridge-react.js';

function TodoList() {
  const [todoService, setTodoService] = useState(null);
  const [newTodo, setNewTodo] = useState('');
  const todos = useObservableCollection(todoService, 'Todos');

  useEffect(async () => {
    const service = await window.DotnetBridge.getService('TodoList');
    setTodoService(service);
  }, []);

  const addTodo = async () => await todoService.Add(newTodo);
  const removeTodo = async (id) => await todoService.Remove(id);

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>📋 Todo List</h1>
      
      <div style={{ margin: '20px 0' }}>
        <input type="text" value={newTodo} placeholder="Nouvelle tâche..." style={{ padding: '8px', width: '60%', marginRight: '10px' }}/>
        <button onClick={addTodo} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Ajouter
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((todo) => (
          <li key={todo.id} style={{padding: '10px', margin: '5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>{todo.text}</span>
            <button onClick={() => removeTodo(todo.id)} style={{background: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer'}}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;

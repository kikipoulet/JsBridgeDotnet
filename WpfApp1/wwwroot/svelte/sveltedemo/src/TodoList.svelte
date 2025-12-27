<script>
  import { onMount } from 'svelte';

  let todoService = null;
  let todos = [];
  let newTodo = '';

  onMount(async () => {
    todoService = await DotnetBridge.getService('TodoList');
    todoService.OnTodosChanged.subscribe(() => refreshTodos());
    await refreshTodos();
  });

  async function refreshTodos() {
    todos = await todoService.GetTodos();
  }

  async function addTodo() {
    if (newTodo.trim()) {
      await todoService.Add(newTodo);
      newTodo = '';
    }
  }

  async function removeTodo(id) {
    await todoService.Remove(id);
  }
</script>

<div style="max-width: 600px; margin: 50px auto; font-family: Arial, sans-serif;">
  <h1>📋 Todo List</h1>
  
  <div style="margin: 20px 0;">
    <input 
      bind:value={newTodo} 
      on:keypress={(e) => e.key === 'Enter' && addTodo()}
      placeholder="Nouvelle tâche..."
      style="padding: 8px; width: 60%; margin-right: 10px;"
    />
    <button on:click={addTodo} style="padding: 8px 16px; cursor: pointer;">
      Ajouter
    </button>
  </div>

  <ul style="list-style: none; padding: 0;">
    {#each todos as todo (todo.id)}
      <li style="padding: 10px; margin: 5px 0; background: #f5f5f5; display: flex; justify-content: space-between; align-items: center;">
        <span>{todo.text}</span>
        <button 
          on:click={() => removeTodo(todo.id)} 
          style="background: #ff4444; color: white; border: none; padding: 5px 10px; cursor: pointer;"
        >
          Supprimer
        </button>
      </li>
    {/each}
  </ul>

  <p style="color: #888; margin-top: 20px;">
    {todos.length} tâche{todos.length !== 1 ? 's' : ''}
  </p>
</div>

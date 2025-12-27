<script>
  import TodoList from './TodoList.svelte';
  import Timer from './Timer.svelte';

  let activeTab = 'todo';
</script>

<div style="max-width: 800px; margin: 20px auto; font-family: Arial, sans-serif;">
  <div style="display: flex; gap: 10px; margin-bottom: 20px; justify-content: center;">
    <button 
      on:click={() => activeTab = 'todo'}
      style="padding: 12px 24px; background: {activeTab === 'todo' ? '#0078d4' : '#e0e0e0'}; color: {activeTab === 'todo' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;"
    >
      📋 Todo List
    </button>
    <button 
      on:click={() => activeTab = 'timer'}
      style="padding: 12px 24px; background: {activeTab === 'timer' ? '#0078d4' : '#e0e0e0'}; color: {activeTab === 'timer' ? 'white' : '#333'}; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;"
    >
      ⏱️ Timer
    </button>
  </div>

  {#if activeTab === 'todo'}
    <TodoList />
  {:else if activeTab === 'timer'}
    <Timer />
  {/if}
</div>

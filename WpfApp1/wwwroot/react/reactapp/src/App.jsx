
import TodoList from './TodoList.jsx';
import { Surface } from '@heroui/react';
import './App.css';

function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6">
        <Surface className="max-w-4xl mx-auto rounded-3xl p-8 shadow-lg">
          <TodoList />
        </Surface>
      </main>
    </div>
  );
}

export default App;

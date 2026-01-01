import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './dotnetbridge.js';
import { useObservableCollection } from './dotnetbridge-react.js';
import { Button, Card, Input } from '@heroui/react';

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
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-2xl">
        <Card.Header>
          <Card.Title>📋 Todo List</Card.Title>
        </Card.Header>
      <Card.Content className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Nouvelle tâche..."
            className="flex-1"
            aria-label="Nouvelle tâche"
          />
          <Button variant="primary" onPress={addTodo}>
            Ajouter
          </Button>
        </div>

        <AnimatePresence mode="popLayout">
          {todos.map((todo, index) => (
            <motion.li
              key={todo.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              layout
              className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <span>{todo.text}</span>
              <Button variant="danger" onPress={() => removeTodo(todo.id)}>
                Supprimer
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </Card.Content>
      </Card>
    </div>
  );
}

export default TodoList;

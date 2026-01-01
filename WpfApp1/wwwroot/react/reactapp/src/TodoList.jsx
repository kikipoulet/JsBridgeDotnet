import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './dotnetbridge.js';
import { useObservableCollection } from './dotnetbridge-react.js';
import { Button, Input } from '@heroui/react';

function TodoList() {
  const [todoService, setTodoService] = useState(null);
  const [newTodo, setNewTodo] = useState('');
  const todos = useObservableCollection(todoService, 'Todos');

  useEffect(() => {
    const initService = async () => {
      const service = await window.DotnetBridge.getService('TodoList');
      setTodoService(service);
    };

    initService();
  }, []);

  const addTodo = async () => {
    if (newTodo.trim()) {
      await todoService.Add(newTodo);
      setNewTodo('');
    }
  };

  const removeTodo = async (id) => await todoService.Remove(id);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      height: 0,
      marginBottom: 0
    },
    visible: {
      opacity: 1,
      y: 0,
      height: 'auto',
      marginBottom: '0.75rem',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      opacity: 0,
      x: 100,
      scale: 0.95,
      height: 0,
      marginBottom: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-full p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative inline-block mb-4"
          >
            <motion.div
              animate={{
                boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)'
              }}
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white`}
            >
              <motion.span
                animate={{
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="text-5xl"
              >
                📋
              </motion.span>
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-3xl font-semibold tracking-tight mb-2 text-gray-900 dark:text-gray-100"
          >
            Todo List
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {todos.length} {todos.length === 1 ? 'tâche' : 'tâches'}
          </motion.p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex gap-3 w-full">
            <div className="flex-1 min-w-0">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nouvelle tâche..."
                aria-label="Nouvelle tâche"
                size="lg"
                className="w-full"
                classNames={{
                  input: 'text-base',
                  inputWrapper: 'w-full flex-1 transition-all duration-300 hover:shadow-lg',
                  mainWrapper: 'w-full'
                }}
              />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="flex-shrink-0"
            >
              <Button
                variant="primary"
                onPress={addTodo}
                isDisabled={!newTodo.trim()}
                size="lg"
                className={`min-w-[100px] font-medium transition-all duration-300 ${
                  !newTodo.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                }`}
              >
                Ajouter
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {todos.map((todo, index) => (
              <motion.div
                key={todo.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                transition={{ delay: index * 0.05 }}
              >
                <motion.div
                  className={`flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 
                    hover:bg-indigo-50 dark:hover:bg-indigo-950/20 
                    hover:shadow-md dark:hover:shadow-lg/10
                    transition-all duration-300 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50`}
                >
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                    className="text-gray-900 dark:text-gray-100 font-medium text-base"
                  >
                    {todo.text}
                  </motion.span>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <motion.button
                      onClick={() => removeTodo(todo.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg
                        bg-gray-200 dark:bg-gray-700
                        text-gray-600 dark:text-gray-300
                        hover:bg-red-50 hover:text-red-600
                        dark:hover:bg-red-950/20 dark:hover:text-red-400
                        transition-all duration-250 ease-out
                        focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                      aria-label="Supprimer"
                    >
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        whileHover={{ rotate: 5, strokeWidth: 2.5 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </motion.svg>
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {todos.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0, paddingTop: 0, paddingBottom: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto', paddingTop: '3rem', paddingBottom: '3rem' }}
                exit={{ opacity: 0, y: -20, height: 0, paddingTop: 0, paddingBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center overflow-hidden"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-gray-500 dark:text-gray-400 text-sm font-medium"
                >
                  Aucune tâche pour le moment
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-gray-400 dark:text-gray-500 text-xs mt-1"
                >
                  Ajoutez votre première tâche ci-dessus
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default TodoList;

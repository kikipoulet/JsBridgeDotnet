import { useState, useEffect } from 'react';
import './dotnetbridge.js';
import { useObservableProperty } from './dotnetbridge-react.js';
import { Button, Card } from '@heroui/react';
import { motion } from 'framer-motion';

function Timer() {
  const [timerService, setTimerService] = useState(null);
  const [isRunning, setIsRunning] = useState(null);

  useEffect(() => {
    const initService = async () => {
      const service = await window.DotnetBridge.getService('Timer');
      setTimerService(service);
    };

    initService();
  }, []);

  const [running, setRunning] = useObservableProperty(timerService, 'IsRunning');

  const handleStart = async () => {
    if (timerService) {
      await timerService.Start();
    }
  };


  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-2xl">
        <Card.Header>
          <Card.Title>⏱️ Timer</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className={`text-2xl font-bold ${running ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {running ? '⏳ En cours...' : '⏸️ Arrêté'}
            </p>
          </motion.div>

          <div className="flex gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="primary"
                onPress={handleStart}
                isDisabled={running}
                className="font-medium"
              >
                {running ? '⏳ Timer en cours...' : '🚀 Démarrer le Timer (3 secondes)'}
              </Button>
            </motion.div>

         
          </div>

          {running && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Le timer s'exécute en arrière-plan...
              </p>
            </motion.div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

export default Timer;

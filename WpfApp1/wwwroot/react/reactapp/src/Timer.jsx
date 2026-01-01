import { useState, useEffect } from 'react';
import './dotnetbridge.js';
import { useObservableProperty } from './dotnetbridge-react.js';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleStop = async () => {
    if (timerService) {
      await timerService.Stop();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-full p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.div variants={itemVariants} className="text-center">
          <div className="relative mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                boxShadow: running 
                  ? '0 0 60px rgba(99, 102, 241, 0.3)' 
                  : '0 0 40px rgba(0, 0, 0, 0.05)'
              }}
              transition={{ duration: 0.5 }}
              className={`relative w-48 h-48 mx-auto rounded-full flex items-center justify-center transition-all duration-500 ${
                running 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {running && (
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.4, 0.2, 0.4]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="absolute inset-0 rounded-full bg-white"
                  />
                )}
              </AnimatePresence>

              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="relative z-10"
              >
                <motion.div
                  animate={running ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ 
                    duration: 3, 
                    ease: 'linear',
                    repeat: running ? Infinity : 0
                  }}
                  className="text-5xl"
                >
                  {running ? '⏳' : '⏱️'}
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-8"
            >
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className={`text-2xl font-semibold tracking-tight mb-1 ${
                  running 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {running ? 'Timer en cours' : 'Timer prêt'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {running ? '3 secondes restantes' : 'Prêt à démarrer'}
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="flex gap-4 justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                variant={running ? 'ghost' : 'primary'}
                onPress={handleStart}
                isDisabled={running}
                className={`min-w-[140px] font-medium transition-all duration-300 ${
                  running 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-lg'
                }`}
                size="lg"
              >
                Démarrer
              </Button>
            </motion.div>
            
          </motion.div>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              {running && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                <motion.div
                  animate={{
                    opacity: [0.6, 0.8, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚡
                  </motion.span>
                  <span>Exécution en cours...</span>
                </motion.div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
          </motion.div>
      </motion.div>
    </div>
  );
}

export default Timer;

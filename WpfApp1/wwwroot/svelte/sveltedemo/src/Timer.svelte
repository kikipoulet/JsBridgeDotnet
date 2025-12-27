<script>
  import { onMount } from 'svelte';

  let timerService = null;
  let isRunningSubscription = null;
  let timerStoppedListener = null;

  // Reactive variables for the UI
  let isRunning = false;
  let showModal = false;
  let logs = [];
  let outputContainer;

  onMount(async () => {
    try {
      addLog('🔗 Connexion au TimerService...', 'info');
      timerService = await DotnetBridge.getService('Timer');
      addLog('✅ TimerService connecté', 'success');

      // Subscribe to IsRunning property changes (ObservableProperty)
      isRunningSubscription = timerService.OnIsRunningChanged.subscribe((newValue, oldValue) => {
        addLog(`📊 ObservableProperty IsRunning changée : ${oldValue} → ${newValue}`, 'info');
        isRunning = newValue;
      });

      // Initialize UI with current state
      const currentIsRunning = await timerService.GetIsRunning();
      isRunning = currentIsRunning;
      addLog(`📊 État initial : IsRunning = ${currentIsRunning}`, 'info');

      // Subscribe to TimerStopped event
      timerStoppedListener = timerService.OnTimerStopped.subscribe(() => {
        addLog('🏁 Événement OnTimerStopped déclenché !', 'success');
        addLog('⏰ Le timer de 5 secondes est terminé', 'info');
        showModal = true; // Show popup
      });

      addLog('🎉 Initialisation terminée', 'success');
    } catch (error) {
      addLog(`❌ Erreur lors de l'initialisation : ${error.message}`, 'warning');
    }

    // Cleanup on component unmount
    return () => {
      if (isRunningSubscription) {
        timerService.OnIsRunningChanged.unsubscribe(isRunningSubscription);
      }
      if (timerStoppedListener) {
        timerService.OnTimerStopped.unsubscribe(timerStoppedListener);
      }
    };
  });

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    logs = [...logs, { timestamp, message, type }];
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (outputContainer) {
        outputContainer.scrollTop = outputContainer.scrollHeight;
      }
    }, 0);
  }

  function clearLogs() {
    logs = [];
    addLog('Logs effacés', 'info');
  }

  async function startTimer() {
    try {
      addLog('🚀 Démarrage du timer...', 'info');
      await timerService.Start();
    } catch (error) {
      addLog(`❌ Erreur lors du démarrage : ${error.message}`, 'warning');
    }
  }

  function closeModal() {
    showModal = false;
  }
</script>

<div style="margin-bottom: 20px;">
  <a href="/todo" style="text-decoration: none; color: #0078d4; font-weight: bold;">
    ⬅️ Retour à la démo TodoList
  </a>
</div>

<div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
  <h1 style="color: #333; border-bottom: 2px solid #0078d4; padding-bottom: 10px;">
    ⏱️ Démo TimerService
  </h1>
  
  <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px;">
    <h3>Ce service démontre :</h3>
    <ul>
      <li><strong>ObservableProperty</strong> : <code>IsRunning</code> se met à jour automatiquement quand le timer démarre/s'arrête</li>
      <li><strong>Méthode</strong> : <code>Start()</code> lance un compte à rebours de 5 secondes</li>
      <li><strong>Événement</strong> : <code>OnTimerStopped</code> est déclenché quand le timer atteint 0</li>
    </ul>
  </div>
  
  <div style="margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px; border-left: 4px solid #0078d4;">
    <h2>État du Timer</h2>
    <p>
      <span 
        class:status-running={isRunning}
        class:status-stopped={!isRunning}
        style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; margin-right: 10px; vertical-align: middle; {isRunning ? 'background: #ff4444; box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);' : 'background: #00cc66; box-shadow: 0 0 10px rgba(0, 204, 102, 0.5);'}"
      ></span>
      <strong>État : {isRunning ? 'En cours...' : 'Arrêté'}</strong>
    </p>
    
    <button 
      on:click={startTimer}
      disabled={isRunning}
      style="background: {isRunning ? '#cccccc' : '#0078d4'}; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: {isRunning ? 'not-allowed' : 'pointer'}; font-size: 16px; margin: 5px;"
    >
      {isRunning ? '⏳ Timer en cours...' : '🚀 Démarrer le Timer (5 secondes)'}
    </button>
  </div>
  
  <div style="margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px; border-left: 4px solid #0078d4;">
    <h2>Journal des événements</h2>
    <button 
      on:click={clearLogs}
      style="background: #0078d4; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 5px;"
    >
      🧹 Effacer les logs
    </button>
    <div 
      bind:this={outputContainer}
      style="background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 10px 0; font-family: monospace; max-height: 300px; overflow-y: auto;"
    >
      {#if logs.length === 0}
        <div style="color: #0078d4; margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee;">
          En attente de démarrage...
        </div>
      {:else}
        {#each logs as log}
          <div 
            style="margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; {log.type === 'success' ? 'color: green;' : log.type === 'warning' ? 'color: #ff8800;' : 'color: #0078d4;'}"
          >
            [{log.timestamp}] {log.message}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<!-- Modal pour l'événement TimerStopped -->
{#if showModal}
  <div 
    style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 1000; justify-content: center; align-items: center; animation: fadeIn 0.3s ease-in;"
  >
    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); text-align: center; animation: slideIn 0.3s ease-out; max-width: 400px;">
      <h2 style="color: #00cc66; margin: 0 0 15px 0; font-size: 28px;">🎉 Timer Terminé !</h2>
      <p style="color: #666; font-size: 16px; margin: 0 0 25px 0;">L'événement <strong>OnTimerStopped</strong> a été reçu avec succès depuis C#</p>
      <button 
        on:click={closeModal}
        style="background: #0078d4; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px; margin: 0;"
      >
        Fermer
      </button>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .status-running {
    background: #ff4444;
    box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
  }
  
  .status-stopped {
    background: #00cc66;
    box-shadow: 0 0 10px rgba(0, 204, 102, 0.5);
  }
</style>

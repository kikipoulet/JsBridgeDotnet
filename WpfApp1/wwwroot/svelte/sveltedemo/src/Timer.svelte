<script>
  import { onMount } from 'svelte';

  let timerService = null;
  let isRunning = false;

  onMount(async () => {
      
      timerService = await DotnetBridge.getService('Timer');

      isRunning = await timerService.GetIsRunning();
      timerService.OnIsRunningChanged.subscribe((newValue, oldValue) => isRunning = newValue );
      
      timerService.OnTimerStopped.subscribe(() => console.log('Timer stopped!'));
      
  });

</script>

<p><strong>Timer : {isRunning ? 'En cours...' : 'Arrêté'}</strong>    </p>

<button on:click={() => timerService.Start()} disabled={isRunning}>
      {isRunning ? '⏳ Timer en cours...' : '🚀 Démarrer le Timer (3 secondes)'}
</button>


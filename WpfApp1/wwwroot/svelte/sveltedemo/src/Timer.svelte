<script>
  import { onMount } from 'svelte';
  import { OPtoStore } from './dotnetbridge.svelte.js';

  let timerService = null;
  let isRunning = null;

  onMount(async () => {
        
      timerService = await DotnetBridge.getService('Timer');
      
      isRunning = OPtoStore(timerService, 'IsRunning');
       
      timerService.OnTimerStopped.subscribe(() => console.log('Timer stopped!'));
  });

</script>

<p><strong>Timer : {$isRunning ? 'En cours...' : 'Arrêté'}</strong>    </p>

<button on:click={() => timerService.Start()} disabled={$isRunning}>
      {$isRunning ? '⏳ Timer en cours...' : '🚀 Démarrer le Timer (3 secondes)'}
</button>


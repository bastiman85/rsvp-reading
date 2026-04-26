<script>
  import { createEventDispatcher } from 'svelte';

  export let isPlaying = false;
  export let isPaused = false;
  export let canPlay = true;
  export let minimal = false;
  export let hasChapters = false;
  export let lastSyncedIndex = 0;
  export let lastSyncedDiff = 0;

  const dispatch = createEventDispatcher();
  let showRestartMenu = false;

  function selectRestart(type) {
    showRestartMenu = false;
    dispatch(type);
  }
</script>

<svelte:window on:click={() => showRestartMenu = false} />

<div class="controls" class:minimal>
  {#if !isPlaying}
    {#if !isPaused}
      <button
        class="control-btn play"
        on:click={() => dispatch('play')}
        disabled={!canPlay}
        title="Play (Space)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        {#if !minimal}<span>Play</span>{/if}
      </button>
    {:else}
      <button
        class="control-btn play"
        on:click={() => dispatch('resume')}
        title="Resume (Space)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        {#if !minimal}<span>Resume</span>{/if}
      </button>
    {/if}

    <button
      class="control-btn stop"
      on:click={() => dispatch('stop')}
      disabled={!isPaused}
      title="Stop (Esc)"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z"/>
      </svg>
      {#if !minimal}<span>Stop</span>{/if}
    </button>

    <div class="restart-wrapper" on:click|stopPropagation role="presentation">
      <button
        class="control-btn restart"
        class:active={showRestartMenu}
        on:click={() => showRestartMenu = !showRestartMenu}
        disabled={!canPlay}
        title="Restart"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
        {#if !minimal}<span>Restart</span>{/if}
      </button>

      {#if showRestartMenu}
        <div class="restart-menu">
          <button class="menu-item" on:click={() => selectRestart('restartAtSync')}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18z"/></svg>
            Last position
            {#if lastSyncedDiff !== 0}
              <span class="menu-item-diff" class:negative={lastSyncedDiff < 0}>
                {lastSyncedDiff > 0 ? `(+${lastSyncedDiff})` : `(${lastSyncedDiff})`}
              </span>
            {/if}
          </button>
          {#if hasChapters}
            <button class="menu-item" on:click={() => selectRestart('restartAtChapter')}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></svg>
              Chapter start
            </button>
          {/if}
          <button class="menu-item" on:click={() => selectRestart('restartAtBeginning')}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            Beginning of book
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .controls.minimal {
    gap: 0.5rem;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
    color: #fff;
  }

  .controls.minimal .control-btn {
    padding: 0.5rem;
    border-radius: 50%;
    width: 40px;
    height: 40px;
  }

  .control-btn svg {
    width: 20px;
    height: 20px;
  }

  .controls.minimal .control-btn svg {
    width: 18px;
    height: 18px;
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .control-btn.play {
    background: #ff4444;
  }

  .control-btn.play:hover:not(:disabled) {
    background: #ff6666;
  }

  .control-btn.pause {
    background: #ffaa00;
    color: #000;
  }

  .control-btn.pause:hover {
    background: #ffcc44;
  }

  .control-btn.stop,
  .control-btn.restart {
    background: #333;
  }

  .control-btn.stop:hover:not(:disabled),
  .control-btn.restart:hover:not(:disabled) {
    background: #444;
  }

  .control-btn.restart.active {
    background: #444;
  }

  .restart-wrapper {
    position: relative;
  }

  .restart-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 10px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 210px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    z-index: 100;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: transparent;
    border: none;
    border-radius: 7px;
    color: #bbb;
    font-size: 0.9rem;
    font-weight: 400;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
    width: 100%;
  }

  .menu-item svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .menu-item:hover {
    background: #2a2a2a;
    color: #fff;
  }

  .menu-item:hover svg {
    opacity: 1;
  }

  .menu-item-diff {
    margin-left: auto;
    font-size: 0.8rem;
    opacity: 0.6;
    color: #4caf50;
    padding-left: 0.5rem;
  }

  .menu-item-diff.negative {
    color: #ff7070;
  }

  @media (max-width: 600px) {
    .controls {
      gap: 0.75rem;
    }

    .control-btn {
      padding: 0.875rem 1.25rem;
      min-height: 48px; /* Touch-friendly minimum */
    }

    .control-btn span {
      display: none;
    }

    .controls.minimal .control-btn {
      width: 48px;
      height: 48px;
    }
  }
</style>

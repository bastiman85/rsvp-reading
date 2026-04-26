<script>
  import { createEventDispatcher } from 'svelte';

  export let progress = 0;
  export let currentWord = 0;
  export let totalWords = 0;
  export let wpm = 300;
  export let timeRemaining = '0:00';
  export let minimal = false;
  export let clickable = false;
  export let chapters = [];

  const dispatch = createEventDispatcher();

  $: chapterTimeRemaining = getChapterTimeRemaining(currentWord, chapters, totalWords, wpm);

  function getChapterTimeRemaining(currentIdx, chaps, total, speed) {
    if (!chaps || chaps.length === 0 || total <= 0 || speed <= 0) return null;
    // Find next chapter after current position
    const next = chaps.find(c => c.wordIndex > currentIdx);
    if (!next) return null;
    const wordsLeft = next.wordIndex - currentIdx;
    const minutes = wordsLeft / speed;
    const totalSeconds = Math.round(minutes * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return { time: `${m}:${s.toString().padStart(2, '0')}`, title: next.title };
  }

  function handleClick(event) {
    if (!clickable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    dispatch('seek', { percentage: Math.max(0, Math.min(100, percentage)) });
  }

  function handleChapterClick(event, chapter) {
    event.stopPropagation();
    if (totalWords <= 0) return;
    const percentage = (chapter.wordIndex / totalWords) * 100;
    dispatch('seek', { percentage: Math.max(0, Math.min(100, percentage)) });
  }

  function handleKeydown(event) {
    if (!clickable) return;
    const step = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      dispatch('seek', { percentage: Math.max(0, progress - step) });
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      dispatch('seek', { percentage: Math.min(100, progress + step) });
    } else if (event.key === 'Home') {
      event.preventDefault();
      dispatch('seek', { percentage: 0 });
    } else if (event.key === 'End') {
      event.preventDefault();
      dispatch('seek', { percentage: 100 });
    }
  }
</script>

<div class="progress-wrapper" class:minimal>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="progress-container"
    class:clickable
    role={clickable ? "slider" : undefined}
    tabindex={clickable ? 0 : undefined}
    aria-valuenow={clickable ? Math.round(progress) : undefined}
    aria-valuemin={clickable ? 0 : undefined}
    aria-valuemax={clickable ? 100 : undefined}
    aria-label={clickable ? "Reading progress" : undefined}
    on:click={handleClick}
    on:keydown={handleKeydown}
  >
    <div class="progress-bar" style="width: {progress}%"></div>
    {#each chapters as chapter}
      {#if totalWords > 0 && (!minimal || clickable)}
        <button
          class="chapter-marker"
          style="left: {(chapter.wordIndex / totalWords) * 100}%"
          on:click={(e) => handleChapterClick(e, chapter)}
        >
          <span class="chapter-tooltip">{chapter.title}</span>
        </button>
      {/if}
    {/each}
  </div>

  {#if !minimal}
    <div class="stats">
      <span class="stat">{currentWord} / {totalWords}</span>
      <span class="stat wpm">{wpm} WPM</span>
      <span class="stat">{timeRemaining}</span>
    </div>
  {:else if clickable && chapterTimeRemaining}
    <div class="chapter-countdown">
      {chapterTimeRemaining.time} to {chapterTimeRemaining.title}
    </div>
  {/if}
</div>

<style>
  .progress-wrapper {
    width: 100%;
  }

  .progress-container {
    height: 3px;
    background: #222;
    border-radius: 2px;
    overflow: visible;
    position: relative;
  }

  .progress-container.clickable {
    cursor: pointer;
    height: 6px;
    transition: height 0.2s ease;
  }

  .progress-container.clickable:hover,
  .progress-container.clickable:focus {
    height: 10px;
    outline: none;
  }

  .progress-container.clickable:focus-visible {
    box-shadow: 0 0 0 2px #ff4444;
  }

  .minimal .progress-container {
    height: 2px;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #ff4444, #ff6666);
    transition: width 0.1s linear;
    border-radius: 2px;
  }

  .chapter-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    background: #888;
    border: none;
    padding: 0;
    cursor: pointer;
    z-index: 2;
    overflow: visible;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .chapter-marker:hover {
    background: #fff;
    transform: translate(-50%, -50%) scale(1.5);
  }

  .chapter-tooltip {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    font: 400 0.75rem/1.4 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    padding: 0.35rem 0.7rem;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    margin-bottom: 8px;
    letter-spacing: 0.02em;
    word-spacing: 0.05em;
    width: max-content;
  }

  .chapter-marker:hover .chapter-tooltip {
    display: block;
  }

  /* On wider screens, use ticks instead of dots */
  @media (min-width: 600px) {
    .chapter-marker {
      width: 2px;
      height: 14px;
      border-radius: 1px;
    }

    .chapter-marker:hover {
      background: #fff;
      transform: translate(-50%, -50%) scaleY(1.3);
    }
  }

  .stats {
    display: flex;
    justify-content: space-between;
    margin-top: 0.75rem;
    font-size: 0.85rem;
    color: #555;
  }

  .stat {
    font-family: monospace;
  }

  .wpm {
    color: #ff4444;
  }

  .chapter-countdown {
    text-align: center;
    margin-top: 0.4rem;
    font-size: 0.75rem;
    color: #555;
    font-family: monospace;
  }

  @media (max-width: 600px) {
    .stats {
      font-size: 0.75rem;
      gap: 0.5rem;
    }
  }
</style>

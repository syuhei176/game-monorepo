import { Game } from './game';

// Polyfill for requestAnimationFrame
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  // @ts-ignore
  window.webkitRequestAnimationFrame ||
  // @ts-ignore
  window.mozRequestAnimationFrame ||
  // @ts-ignore
  window.oRequestAnimationFrame ||
  // @ts-ignore
  window.msRequestAnimationFrame ||
  function (callback) {
    console.log('Warn: old browser');
    setTimeout(callback, 100);
  };

// Start the game when the window loads
window.addEventListener('load', () => {
  new Game();
});

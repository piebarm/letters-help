'use strict';

(function () {
  // UK QWERTY layout, letters and numbers only.
  var ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  var MIN_FONT = 12;
  var MAX_FONT = 1000;

  // Taps of the same key closer together than this are treated as one tap.
  var REPEAT_DELAY_MS = 1000;

  var output = document.getElementById('message');
  var keyboard = document.getElementById('keyboard');
  var clearButton = document.getElementById('clear');
  var textEl = document.createElement('span');
  textEl.className = 'message-text';
  output.appendChild(textEl);
  var text = '';
  var lastKey = null;
  var lastTapTime = 0;

  function makeKey(label, className, action) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'key ' + className;
    button.textContent = label;
    button.dataset.action = action;
    return button;
  }

  function buildKeyboard() {
    ROWS.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'key-row';
      row.forEach(function (char) {
        var key = makeKey(char, 'char', 'char');
        key.dataset.text = char;
        rowEl.appendChild(key);
      });
      keyboard.appendChild(rowEl);
    });

    var controls = document.createElement('div');
    controls.className = 'key-row';
    var space = makeKey('Space', 'space', 'space');
    space.setAttribute('aria-label', 'Space');
    var del = makeKey('⌫', 'delete', 'delete');
    del.setAttribute('aria-label', 'Delete last letter');
    controls.appendChild(space);
    controls.appendChild(del);
    keyboard.appendChild(controls);
  }

  function addWord(word) {
    if (text.length > 0 && text.slice(-1) !== ' ') {
      text += ' ';
    }
    text += word + ' ';
  }

  // True if this tap is the same key again within REPEAT_DELAY_MS of the
  // previous tap. Measured from the previous tap (ignored or not), so a
  // shaky or held finger never adds a second letter.
  function isRepeat(key) {
    var now = Date.now();
    var repeat = key === lastKey && now - lastTapTime < REPEAT_DELAY_MS;
    lastKey = key;
    lastTapTime = now;
    return repeat;
  }

  function render() {
    textEl.textContent = text;
    output.classList.toggle('is-empty', text.trim() === '');
    fitText();
  }

  // Largest font size at which the message fits the pane without overflow.
  function fitText() {
    var content = text.trim();
    if (!content) {
      output.style.fontSize = '';
      return;
    }

    var low = MIN_FONT;
    var high = MAX_FONT;
    var best = MIN_FONT;

    while (low <= high) {
      var mid = Math.floor((low + high) / 2);
      output.style.fontSize = mid + 'px';
      if (fits()) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    output.style.fontSize = best + 'px';
  }

  function fits() {
    return textEl.offsetHeight <= output.clientHeight + 1 &&
      textEl.scrollWidth <= textEl.clientWidth + 1;
  }

  function handlePress(event) {
    var button = event.target.closest('button');
    if (!button) return;
    if (isRepeat(button.dataset.text || button.dataset.action)) return;

    if (button.classList.contains('phrase')) {
      addWord(button.dataset.text);
    } else {
      switch (button.dataset.action) {
        case 'char':
          text += button.dataset.text;
          break;
        case 'space':
          if (text.length > 0 && text.slice(-1) !== ' ') text += ' ';
          break;
        case 'delete':
          text = text.replace(/\s+$/, '');
          text = text.slice(0, -1);
          break;
        default:
          return;
      }
    }

    render();
  }

  buildKeyboard();

  document.querySelector('.keyboard-pane').addEventListener('click', handlePress);

  clearButton.addEventListener('click', function () {
    text = '';
    lastKey = null;
    render();
  });

  // Physical keyboard support, handy if one is connected.
  document.addEventListener('keydown', function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^[a-z0-9 ]$/i.test(event.key) || event.key === 'Backspace') {
      event.preventDefault();
      if (isRepeat(event.key.toUpperCase())) return;
    }
    if (/^[a-z0-9]$/i.test(event.key)) {
      text += event.key.toUpperCase();
    } else if (event.key === ' ') {
      if (text.length > 0 && text.slice(-1) !== ' ') text += ' ';
    } else if (event.key === 'Backspace') {
      text = text.replace(/\s+$/, '').slice(0, -1);
    } else {
      return;
    }
    event.preventDefault();
    render();
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(fitText).observe(output);
  } else {
    window.addEventListener('resize', fitText);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitText);
  }

  render();
})();

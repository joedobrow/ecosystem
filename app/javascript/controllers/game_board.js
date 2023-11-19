// --- GLOBAL --

let gameState = {
  units: {
    dinos: [],
    ferns: [],
    diseased_ferns: [],
    eggs: []
  },
  epoch: 0,
  game_over: false
};
let DIRECTIONS = [
  { x: 0, y: -1 },  // Up
  { x: 0, y: 1 },   // Down
  { x: -1, y: 0 },  // Left
  { x: 1, y: 0 }    // Right
];

let epoch = 0; 
let timer;
let isRunning = false;

// --- Customize me ---

let ROWS = 6;
let COLS = 10;
let DINO_HEALTH = 11;
let DINO_BABY_HEALTH = 4;
let DINO_REPRODUCE_HEALTH = 5;
let FERN_HEALTH = 10;
let EGG_HEALTH = 3;
let FERN_SPAWNRATE = 0.02;

let EPOCH_SPEED = 1000;

// --- Draw Units ---

function drawUnit(name, x, y, id) {
  if (name == 'dino') {
    drawDino(x, y, id);
  } else if (name == 'fern') {
    drawFern(x, y);
  } else if (name == 'diseased_fern') {
    drawDiseasedFern(x, y);
  } else if (name == 'egg') {
    drawEgg(x, y);
  } else {
    console.log('bad draw unit name: ' + name);
  }
}

function drawDino(x, y, id) {
  var cell = $("#cell" + x + "-" + y);

  var dinoDiv = $('<div></div>')
    .addClass('dinoDiv')
    .attr('id', 'dino-' + id);

  var dinoImage = $('<img>')
    .attr('src', imagePaths.dino1)
    .css({
      width: '60%',
      height: '60%',
      position: 'absolute',
      transition: 'top 1s ease-in-out'
    })
    .addClass('dino');

  dinoDiv.append(dinoImage);
  cell.append(dinoDiv);
}

function drawFern(x, y) {
  var cell = $("#cell" + x + "-" + y);

  var fernImage = $('<img>')
    .attr('src', imagePaths.fern)
    .css({
      width: '60%',
      height: '60%'
    })
    .addClass('fern');

  cell.append(fernImage);
}

function drawDiseasedFern(x, y) {
  var cell = $("#cell" + x + "-" + y);

  var fernImage = $('<img>')
    .attr('src', imagePaths.diseased_fern)
    .css({
      width: '60%',
      height: '60%'
    })
    .addClass('diseased_fern');

  cell.append(fernImage);
}

function drawEgg(x, y) {
  // Use jQuery to select the cell by its id
  var cell = $("#cell" + x + "-" + y);

  // Create the egg image and set its properties with jQuery
  var eggImage = $('<img>')
    .attr('src', imagePaths.egg)
    .css({
      width: '60%',
      height: '60%'
    })
    .addClass('egg');

  // Append the image to the cell
  cell.append(eggImage);
}

// --- Create Main Game Grid ---

function createGrid(rows, cols) {
  var container = $("#grid-container");
  container.css({
    'grid-template-columns': `repeat(${cols}, 1fr)`,
    'grid-template-rows': `repeat(${rows}, 1fr)`
  });

  for (let i = 0; i < rows * cols; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    var gridItem = $('<div>')
      .addClass('grid-item')
      .attr('id', 'cell' + x + '-' + y);
    container.append(gridItem);
  }
}

// --- Update Game Every Epoch ---

function updateGame() {
  clearUnits();

  $.ajax({
    url: '/game/new_epoch',
    type: 'GET',
    success: function(data) {
      gameState = data.game_state;
      setEpoch();
      if (gameState.game_over) {
        let startButton = document.getElementById("start-button");
        let pauseButton = document.getElementById("pause-button");
        pauseButton.classList.add("button-disabled");
        startButton.classList.add("button-disabled");
        clearInterval(timer);
        isRunning = false;
        alert('Game Over in ' + gameState.epoch + ' epochs.')
      } else {
        reDrawUnits(gameState.epoch);
      }
    },
    error: function(error) {
      console.log('Error:', error);
    }
  });
}

function reDrawUnits(epoch) {
  drawDinos(epoch);
  drawFerns();
  drawDiseasedFerns();
  drawEggs();
}

function drawDinos(epoch) {
  if (epoch == 0) {
    gameState.units.dinos.forEach(dino => {
      drawUnit('dino', dino.x, dino.y, dino.id);
    });
  } else {
    gameState.units.dinos.forEach(dino => {
      if (dino.health <= 0) {
        killDino(dino.id)
      } else if ($('#dino-' + dino.id).length == 0) {
        drawUnit('dino', dino.x, dino.y, dino.id);
      } else {
        moveDino(dino.id, dino.x, dino.y, dino.og_x, dino.og_y)
      }
    });
  }
}

function drawFerns() {
  gameState.units.ferns.forEach(fern => {
    drawUnit('fern', fern.x, fern.y);
  });
}

function drawDiseasedFerns() {
  gameState.units.diseased_ferns.forEach(fern => {
    drawUnit('diseased_fern', fern.x, fern.y);
  });
}

function drawEggs() {
  gameState.units.eggs.forEach(egg => {
    drawUnit('egg', egg.x, egg.y);
  });
}

function moveDino(id, x, y, og_x, og_y) {
  const dinoElement = $('#dino-' + id);
  const newCell = $('#cell' + x + '-' + y);
  const oldCell = $('#cell' + og_x + '-' + og_y)
  

  const newPosX = newCell.position().left - oldCell.position().left;
  const newPosY = newCell.position().top - oldCell.position().top;

  dinoElement.css('transform', `translate(${newPosX}px, ${newPosY}px)`);
}

function killDino(id) {
  const div = $('#dino-' + id)
  if (div) {
    div.remove();
  }
}
  
function setEpoch() {
  $('#epoch-number').text(gameState.epoch);
}

// -- Clear Units ---

function clearUnits() {
  clearFerns();
  // clearDinos(); -- testing out skipping this in order to use animations
  clearDiseasedFerns();
  clearEggs();
}

function clearDinos() {
  const dinoImages = document.querySelectorAll('img.dino');
  const dinoDivs = document.querySelectorAll('div.dinoDiv');
  dinoImages.forEach(img => {
    img.remove();
  });
  dinoDivs.forEach(div => {
    div.remove();
  });
}

function clearFerns() {
  const fernImages = document.querySelectorAll('img.fern');
  fernImages.forEach(img => {
    img.remove();
  });
}

function clearDiseasedFerns() {
  const fernImages = document.querySelectorAll('img.diseased_fern');
  fernImages.forEach(img => {
    img.remove();
  });
}

function clearEggs() {
  const eggImages = document.querySelectorAll('img.egg');
  eggImages.forEach(img => {
    img.remove();
  });
}

// --- Start / Pause / + / - Button stuff

document.addEventListener("DOMContentLoaded", function() {
  let startButton = document.getElementById("start-button");
  let pauseButton = document.getElementById("pause-button");
  let plusButton = document.getElementById("faster");
  let minusButton = document.getElementById("slower");

  if (startButton != null && pauseButton != null && plusButton != null && minusButton != null) {
    startButton.addEventListener("click", function() {
      if (!isRunning) {
        isRunning = true;
        startButton.classList.add("button-disabled");
        pauseButton.classList.remove("button-disabled");
        timer = setInterval(function() {
          updateGame(); 
        }, EPOCH_SPEED);
      }
    });

    pauseButton.addEventListener("click", function() {
      pauseButton.classList.add("button-disabled");
      startButton.classList.remove("button-disabled");
      clearInterval(timer); // Clear the interval when "Pause" is clicked
      isRunning = false;
    });

    plusButton.addEventListener("click", function() {
      EPOCH_SPEED -= 200;
      clearInterval(timer);
       timer = setInterval(function() {
        updateGame();
      }, EPOCH_SPEED);
    });

    minusButton.addEventListener("click", function() {
      EPOCH_SPEED += 200;
      clearInterval(timer);
      timer = setInterval(function() {
        updateGame();
      }, EPOCH_SPEED);
    });
  }

  setTimeout(function() {
    createGrid(ROWS, COLS);
    $.ajax({
        url: '/game/first_epoch',
        type: 'GET',
        success: function(data) {
          gameState = data.game_state; 
          reDrawUnits(gameState.epoch);
          setEpoch();

          console.log('Game initialized')
        },
        error: function(error) {
          console.log('Error:', error);
        }
      });
  }, 200);
}); 

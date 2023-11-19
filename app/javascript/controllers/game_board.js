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
    drawFern(x, y, id);
  } else if (name == 'diseased_fern') {
    drawDiseasedFern(x, y, id);
  } else if (name == 'egg') {
    drawEgg(x, y, id);
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

function drawFern(x, y, id) {
  var cell = $("#cell" + x + "-" + y);

  var fernImage = $('<img>')
    .attr('src', imagePaths.fern)
    .attr('id', 'fern-' + id)
    .css({
      width: '60%',
      height: '60%'
    })
    .addClass('fern');

  cell.append(fernImage);
}

function drawDiseasedFern(x, y, id) {
  var cell = $("#cell" + x + "-" + y);

  var fernImage = $('<img>')
    .attr('src', imagePaths.diseased_fern)
    .attr('id', 'diseased_fern-' + id)
    .css({
      width: '60%',
      height: '60%'
    })
    .addClass('diseased_fern');

  cell.append(fernImage);
}

function drawEgg(x, y, id) {
  // Use jQuery to select the cell by its id
  var cell = $("#cell" + x + "-" + y);

  // Create the egg image and set its properties with jQuery
  var eggImage = $('<img>')
    .attr('src', imagePaths.egg)
    .attr('id', 'egg-' + id)
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
        drawUnits(gameState.epoch);
      }
    },
    error: function(error) {
      console.log('Error:', error);
    }
  });
}

function drawUnits(epoch) {
  drawDinos(epoch);
  drawFerns(epoch);
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
        killUnit(dino.id, 'dino')
      } else if ($('#dino-' + dino.id).length == 0) {
        drawUnit('dino', dino.x, dino.y, dino.id);
      } else {
        moveDino(dino.id, dino.x, dino.y, dino.og_x, dino.og_y)
      }
    });
  }
}

function drawFerns(epoch) {
  if (epoch == 0) {
    gameState.units.ferns.forEach(fern => {
      drawUnit('fern', fern.x, fern.y, fern.id);
    });
  } else {
    gameState.units.ferns.forEach(fern => {
      if (fern.health <= 0) {
        killUnit(fern.id, 'fern')
      } else if ($('#fern-' + fern.id).length == 0) {
        drawUnit('fern', fern.x, fern.y, fern.id)
      }
    });
  }
}

function drawDiseasedFerns() {
  gameState.units.diseased_ferns.forEach(fern => {
    if (fern.health <= 0) {
      killUnit(fern.id, 'diseased_fern')
    } else if ($('#diseased_fern-' + fern.id).length == 0) {
      drawUnit('diseased_fern', fern.x, fern.y, fern.id);
    }
  });
}

function drawEggs() {
  gameState.units.eggs.forEach(egg => {
    if (egg.health <= 0) {
      killUnit(egg.id, 'egg')
    } else if ($('#egg-' + egg.id).length == 0) {
      drawUnit('egg', egg.x, egg.y, egg.id);
    }
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

function killUnit(id, name) {
  const div = $('#' + name + '-' + id) 
  if (div) {
    div.remove();
  } 
} 

function setEpoch() {
  $('#epoch-number').text(gameState.epoch);
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
          drawUnits(gameState.epoch);
          setEpoch();

          console.log('Game initialized')
        },
        error: function(error) {
          console.log('Error:', error);
        }
      });
  }, 200);
}); 

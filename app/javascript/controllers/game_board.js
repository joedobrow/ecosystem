// --- GLOBAL --

let gameState = {
  dinos: [],
  ferns: [],
  diseased_ferns: [],
  eggs: [],
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

function drawUnit(name, x, y) {
  if (name == 'dino') {
    drawDino(x, y);
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

function drawDino(x, y) {
  const cell = document.getElementById("cell" + x + "-" + y);

  const dinoDiv = document.createElement('div');
  dinoDiv.className = 'dinoDiv';

  const dinoImage = new Image();;
  dinoImage.src = imagePaths.dino1;
  dinoImage.style.width = "60%";
  dinoImage.style.height = "60%";
  dinoImage.style.position = 'absolute';
  dinoImage.className = 'dino'
  dinoImage.style.transition = 'top 1s ease-in-out';

  dinoDiv.appendChild(dinoImage);
  cell.appendChild(dinoDiv);
}

function drawFern(x, y) {
  const cell = document.getElementById("cell" + x + "-" + y);
  const fernImage = document.createElement('img');
  fernImage.src = imagePaths.fern;
  fernImage.style.width = "60%";
  fernImage.style.height = "60%";
  fernImage.className = 'fern'
  cell.appendChild(fernImage);
}

function drawDiseasedFern(x, y) {
  const cell = document.getElementById("cell" + x + "-" + y);
  const fernImage = document.createElement('img');
  fernImage.src = imagePaths.diseased_fern;
  fernImage.style.width = "60%";
  fernImage.style.height = "60%";
  fernImage.className = 'diseased_fern'
  cell.appendChild(fernImage);
}
function drawEgg(x, y) {
  const cell = document.getElementById("cell" + x + "-" + y);
  const eggImage = document.createElement('img');
  eggImage.src = imagePaths.egg;
  eggImage.style.width = "60%";
  eggImage.style.height = "60%";
  eggImage.className = 'egg'
  cell.appendChild(eggImage);
}

// --- Create Main Game Grid ---

function createGrid(rows, cols) {
  const container = document.getElementById("grid-container");
  container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let i = 0; i < rows * cols; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    const gridItem = document.createElement("div");
    gridItem.className = "grid-item";
    gridItem.id = "cell" + x + "-" + y;
    container.appendChild(gridItem);
  }

  const gridContainer = document.getElementById('grid-container');
}

// --- Update Game Every Epoch ---

function updateGame() {
  clearUnits();

  $.ajax({
    url: '/game/new_epoch',
    type: 'GET',
    success: function(data) {
      console.log(data);
      gameState = data.game_state;
    },
    error: function(error) {
      console.log('Error:', error);
    }
  });
  reDrawUnits();
}

function reDrawUnits() {
  console.log(gameState.dinos)

  gameState.dinos.forEach(dino => {
    drawUnit('dino', dino.x, dino.y);
  });

  gameState.ferns.forEach(fern => {
    drawUnit('fern', fern.x, fern.y);
  });

  gameState.diseased_ferns.forEach(diseasedFern => {
    drawUnit('diseased_fern', diseasedFern.x, diseasedFern.y);
  });

  gameState.eggs.forEach(egg => {
    drawUnit('egg', egg.x, egg.y);
  });
}

function drawDinos() {
  gameState.dinos.forEach(dino => {
    drawUnit('dino', dino.x, dino.y);
  });
}

function drawFerns() {
  gameState.ferns.forEach(fern => {
    drawUnit('fern', fern.x, fern.y);
  });
}
function drawDiseasedFerns() {
  gameState.diseased_ferns.forEach(fern => {
    drawUnit('diseased_fern', fern.x, fern.y);
  });
}
function drawEggs() {
  gameState.eggs.forEach(egg => {
    drawUnit('egg', egg.x, egg.y);
  });
}

// -- Clear Units ---

function clearUnits() {
  clearFerns();
  clearDinos();
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
  }, 200);
}); 

document.addEventListener("DOMContentLoaded", function() {
  $.ajax({
    url: '/game/start',
    type: 'GET',
    success: function() {
      console.log('Game initialized')
    },
    error: function(error) {
      console.log('Error:', error);
    }
  });
})


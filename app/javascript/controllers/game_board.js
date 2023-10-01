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

// When the page is fully loaded
$(document).ready(function() {
  // Fetch the form using AJAX
  $.ajax({
    url: '/game/form',
    type: 'GET',
    success: function(response) {
      // Append the form to the body
      $("body").append('<div id="dialog">' + response + '</div>');

      // Open the dialog
      $("#dialog").dialog({
        modal: true,
        buttons: {
          "Submit": function() {
            // Handle form submission here
          },
          "Cancel": function() {
            $(this).dialog("close");
          }
        }
      });
    }
  });
});

// --- Create Units ---

function createUnit(name, x, y) {
  $.ajax({
    url: '/game/create_unit',
    type: 'POST',
    data: { name: name, x: x, y: y },
    success: function(response) {
    },
    error: function(response) {
      console.log('Error:', response);
    }
  });
}

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
  
  for (let i = 0; i < rows * cols; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    const cell = document.getElementById("cell" + x + "-" + y);
    
    if (Math.random() < 0.10) {
      createUnit('dino', x, y);
    } else if (Math.random() < 0.2) {
      createUnit('fern', x, y);
    }
    
    gridContainer.appendChild(cell);
  }
}

// --- Update Game Every Epoch ---

function updateGame() {
  console.log('New epoch: ' + epoch);
  console.log(gameState);

  checkEndOfGame();

  // update gameState first, ordering matters!
  moveDinosRandomly();
  dinosEatFerns();
  dinosEatDiseasedFerns();
  hungryDinosDie();
  hatchEggs();
  poopEggs();
  decayFerns()
  checkForDiseasedFerns();
  spawnFerns();
  if (epoch % 5 == 0) { // adjust fern spawnrate every 5 epochs
    adjustFernSpawnRate();
  }
  
  // Then draw
  clearUnits();
  drawUnits();

  updateEpoch();

}

function updateEpoch() {
  epoch++;
  document.getElementById("epoch-number").innerText = epoch;
}

// --- Every Epoch Functions

function spawnFerns() {
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      // Check if the cell is empty
      const isCellEmpty = !gameState.dinos.some(dino => dino.x === x && dino.y === y) &&
                          !gameState.ferns.some(fern => fern.x === x && fern.y === y) &&
                          !gameState.diseased_ferns.some(fern => fern.x === x && fern.y === y) &&
                          !gameState.eggs.some(egg => egg.x === x && egg.y === y);
      
      if (isCellEmpty) {
        if (Math.random() < FERN_SPAWNRATE) {
          const newFern = { x: x, y: y, health: FERN_HEALTH };
          gameState.ferns.push(newFern);
        }
      }
    }
  }
}

function moveDinosRandomly() {
  let delay = 0;
  for (let i = 0; i < gameState.dinos.length; i++) {
    setTimeout(() => { // Needed for god knows what reason
      moveDinoRandomly(gameState.dinos[i], ROWS, COLS);
    }, delay);
    delay += 20;
  };
}

// Move randomly, prioritizing squares with ferns, and not trying to move off of the map
function moveDinoRandomly(dino, rows, cols) {
  if (dino != null) {
    // Filter directions that are within board boundaries
    const legalDirections = DIRECTIONS.filter(dir => {
      let newX = dino.x + dir.x;
      let newY = dino.y + dir.y;
      return newX >= 0 && newX < cols && newY >= 0 && newY < rows;
    });

    // Find legal directions with ferns
    const directionsWithFerns = legalDirections.filter(dir => {
      let newX = dino.x + dir.x;
      let newY = dino.y + dir.y;
      return gameState.ferns.some(fern => fern.x === newX && fern.y === newY);
    });

    // Choose direction: prefer ones with ferns, otherwise random legal direction
    const availableDirections = directionsWithFerns.length > 0 ? directionsWithFerns : legalDirections;
    const randomDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];

    let newX = dino.x + randomDirection.x;
    let newY = dino.y + randomDirection.y;

    const dinoImage = document.querySelector(`#cell${dino.x}-${dino.y} .dino`);
    if (dinoImage != null) {
      const dinoDiv = dinoImage.parentNode;
      const newCell = document.getElementById(`cell${newX}-${newY}`);
  
      // Move dino
      var topValue = dinoDiv.style.top.replace("px", "");
      var leftValue = dinoDiv.style.left.replace("px", "");
      var newTopValue = Number(topValue) + (newY - dino.y) * newCell.clientHeight;
      var newLeftValue = Number(leftValue) + (newX - dino.x) * newCell.clientWidth;
      dinoDiv.style.transform = `translate(${newLeftValue}px, ${newTopValue}px)`;

      dino.x = newX;
      dino.y = newY;

      dino.health = dino.health - 1;
    }
  }
}

function dinosEatFerns() {
  gameState.dinos.forEach(dino => {
    gameState.ferns = gameState.ferns.filter(fern => {
      if (fern.x === dino.x && fern.y === dino.y) {
        dino.health = 5;
        return false;
      }
      return true;
    });
  });
}

function dinosEatDiseasedFerns() {
  gameState.dinos.forEach(dino => {
    gameState.diseased_ferns = gameState.diseased_ferns.filter(fern => {
      if (fern.x === dino.x && fern.y === dino.y) {
        dino.health = dino.health - 1; // stomach ache
        return false;
      }
      return true;
    });
  });
}

function hatchEggs() {
  const newEggs = [];
  gameState.eggs.forEach(egg => {
    egg.health -= 1;
    if (egg.health <= 0) {
      console.log('baby born at: ' + egg.x + '-' + egg.y);
      createBabyDino(egg.x, egg.y);
    } else {
      newEggs.push(egg);
    }
  });
  gameState.eggs = newEggs;
}

function adjustFernSpawnRate() {
  FERN_SPAWNRATE = gameState.ferns.length / (ROWS * COLS * 4)
  console.log("adjusting fern spawnrate to: " + FERN_SPAWNRATE);
}


function hungryDinosDie() {
  gameState.dinos = gameState.dinos.filter(dino => dino.health > 0);
}

function checkForDiseasedFerns() {
  let foundFerns = [];

  // Loop through the board but stop 2 cells before the edge
  for (let y = 0; y <= ROWS - 3; y++) {
    for (let x = 0; x <= COLS - 3; x++) {
      
      foundFerns.length = 0;

      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          let fern = gameState.ferns.find(f => f.x === x + dx && f.y === y + dy);
          if (fern) {
            foundFerns.push(fern);
          }
        }
      }

      // If we found 9 ferns in the 3x3 grid, mark them as diseased
      if (foundFerns.length === 9) {
        foundFerns.forEach(fern => {
          gameState.diseased_ferns.push(fern);
          gameState.ferns = gameState.ferns.filter(f => f !== fern);
          drawUnit('diseased_fern', fern.x, fern.y);
        });
      }
    }
  }
}

// Ferns that are next to a diseased fern lose 3 health/epoch, and if they die turn into diseased. Otherwise they just lose 1 health and disappear if dead.
function decayFerns() {
  gameState.ferns.forEach(fern => {
    let isAdjacentToDiseased = false;

    DIRECTIONS.forEach(dir => {
      let adjX = fern.x + dir.x;
      let adjY = fern.y + dir.y;

      if (gameState.diseased_ferns.some(df => df.x === adjX && df.y === adjY)) {
        isAdjacentToDiseased = true;
      }
    });

    if (isAdjacentToDiseased) {
      fern.health -= 3;

      if (fern.health <= 0) {
        gameState.ferns = gameState.ferns.filter(f => f !== fern);
        gameState.diseased_ferns.push({ x: fern.x, y: fern.y });  // Create a diseased fern
      }
    } else {
      fern.health -= 1;
      if (fern.health <= 0) {
        gameState.ferns = gameState.ferns.filter(f => f !== fern);
      }
    }
  });
}

// If 2 HEALTHY dinos meet in the same spot, make an egg
function poopEggs() {
  const dinoPositions = new Map();
  const eggPositions = new Set();
  const existingEggPositions = new Set();

  const dinos = gameState.dinos;
  const eggs = gameState.eggs;

  for (let egg of eggs) {
    existingEggPositions.add(egg.x + '-' + egg.y);
  }

  for (let dino of dinos) {
    const position = dino.x + '-' + dino.y;
    if (dinoPositions.has(position)) {
      if (dino.health > DINO_REPRODUCE_HEALTH && dinoPositions.get(position) > DINO_REPRODUCE_HEALTH) {
        eggPositions.add(position);
      }
    } else {
      dinoPositions.set(position, dino.health);
    }
  }

  for (let position of eggPositions) {
    if (!existingEggPositions.has(position)) {
      const [x, y] = position.split('-').map(coord => parseInt(coord, 10));
      createUnit('egg', x, y);
    }
  }
}

function checkEndOfGame() {
  if (gameState.ferns.length === 0 && gameState.dinos.length === 0) {
    console.log('Game Over');
    alert('Game Over in ' + epoch + 'Epochs.');
    isRunning = false;
    startButton.classList.add("button-disabled");
    pauseButton.classList.add("button-disabled");
    clearInterval(timer); // Clear the interval when "Pause" is clicked
    return true;
  }
  return false;
}

function drawUnits() {
  $.ajax({
    url: '/game/get_game_state',
    type: 'GET',
    success: function(response) {
      const newGameState = response.gameState;

      clearUnits();

      newGameState.dinos.forEach(dino => {
        drawUnit('dino', dino.x, dino.y);
      });

      newGameState.ferns.forEach(fern => {
        drawUnit('fern', fern.x, fern.y);
      });

      newGameState.diseased_ferns.forEach(diseasedFern => {
        drawUnit('diseased_fern', diseasedFern.x, diseasedFern.y);
      });

      newGameState.eggs.forEach(egg => {
        drawUnit('egg', egg.x, egg.y);
      });
    },
    error: function(response) {
      console.log('Error:', response);
    }
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


class GameController < ApplicationController

  DINO_HEALTH = 11
  DINO_BABY_HEALTH = 4
  DINO_REPRODUCE_HEALTH = 5;
  FERN_HEALTH = 10;
  EGG_HEALTH = 3;
  FERN_SPAWNRATE = 0.02;

  before_action :initialize_game_state, only: [:start]

  def start
  end

  def create_unit
    name = params[:name]
    x = params[:x].to_i
    y = params[:y].to_i
    
    case name
    when 'dino'
      create_dino(x, y)
    when 'fern'
      create_fern(x, y)
    when 'diseased_fern'
      create_diseased_fern(x, y)
    when 'egg'
      create_egg(x, y)
    else
      render json: { error: "bad new unit name: #{name}" }, status: 400
      return
    end
  end

  private

  def initialize_game_state
    @game_state = {
      dinos: [],
      ferns: [],
      diseased_ferns: [],
      eggs: []
    }
  end

  def new_epoch
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

    if (epoch % 5 == 0) {
    adjustFernSpawnRate();
    }

    clearUnits();
    drawUnits();

    @epoch = @epoch + 1
    
    render json: { gameState: @game_state }
  }

  def initialize_units 

  def create_dino(x, y)
    @game_state[:dinos].push({ x: x, y: y, health: DINO_HEALTH })
  end

  def create_baby_dino(x, y)
    @game_state[:dinos].push({ x: x, y: y, health: DINO_BABY_HEALTH })
  end

  def create_fern(x, y)
    @game_state[:ferns].push({ x: x, y: y, health: FERN_HEALTH })
  end

  def create_diseased_fern(x, y)
    @game_state[:diseased_ferns].push({ x: x, y: y})
  end

  def create_egg(x, y)
    @game_state[:eggs].push({ x: x, y: y})
  end
  
end

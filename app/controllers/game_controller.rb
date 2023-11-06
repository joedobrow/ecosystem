class GameController < ApplicationController

  before_action :initialize_game_state, only: [:start]

  def start
  end

  def new_epoch
    @game_state = session[:game_state].deep_symbolize_keys
    Rails.logger.debug(@game_state)
    update_epoch
    session[:game_state] = @game_state
  end

  private

  def initialize_game_state

    session[:dino_health] = 11
    session[:dino_baby_health] = 4
    session[:dino_reproduce_health] = 5
    session[:fern_health] = 10
    session[:egg_health] = 3
    session[:fern_spawnrate] = 0.02

    session[:board_height] = 6
    session[:board_width] = 9

    session[:epoch] = 0

    @game_state = {
      dinos: [],
      ferns: [],
      diseased_ferns: [],
      eggs: []
    }

    @starting_unit_weights = {
      dino: 1,
      fern: 2,
      nil: 7
    }

    generate_board

    session[:game_state] = @game_state
  end

  def generate_board
    probabilities = []
    probabilities += [:dino] * @starting_unit_weights[:dino]
    probabilities += [:fern] * @starting_unit_weights[:fern]
    probabilities += [:nil] * @starting_unit_weights[:nil]

    (0...session[:board_width]).each do |x|
      (0...session[:board_height]).each do |y|
        unit = probabilities.sample
        create_unit(unit, x, y) unless unit.nil?
      end
    end
  end
    

  def update_epoch
    check_end_of_game

    # ordering matters!
    move_dinos_randomly
    dinos_eat_ferns
    hungry_dinos_die
    hatch_eggs
    poop_eggs
    decay_ferns
    check_for_diseased_ferns
    spawn_ferns

    if session[:epoch] % 5 == 0 
      adjust_fern_spawnrate
    end

    session[:epoch] += 1
    
    render json: { game_state: @game_state }
  end

  def create_unit(name, x, y)
    case name
    when :dino
      create_dino(x, y)
    when :fern
      create_fern(x, y)
    when :diseased_fern
      create_diseased_fern(x, y)
    when :egg
      create_egg(x, y)
    end
  end

  def create_dino(x, y)
    @game_state[:dinos].push({ x: x, y: y, health: session[:dino_health] })
  end

  def create_baby_dino(x, y)
    @game_state[:dinos].push({ x: x, y: y, health: session[:dino_baby_health] })
  end

  def create_fern(x, y)
    @game_state[:ferns].push({ x: x, y: y, health: session[:fern_health] })
  end

  def create_diseased_fern(x, y)
    @game_state[:diseased_ferns].push({ x: x, y: y})
  end

  def create_egg(x, y)
    @game_state[:eggs].push({ x: x, y: y, health: session[:egg_health] })
  end

  def move_dino_randomly(dino)
Rails.logger.debug(session[:board_height])
    directions = []
    if dino[:y] < (session[:board_height] - 1)
      directions << :up
    end
    if dino[:y] > 0
      directions << :down
    end
    if dino[:x] < (session[:board_width] - 1)
      directions << :right
    end
    if dino[:x] > 0
      directions << :left
    end
    direction = directions.sample
  
    case direction
    when :up
      dino[:y] += 1
    when :down
      dino[:y] -= 1
    when :left
      dino[:x] -= 1
    when :right
      dino[:x] += 1
    end
  end

  def move_dinos_randomly
    @game_state[:dinos].each do |dino|
      move_dino_randomly(dino)
    end
  end

  def check_end_of_game
    @game_state[:dinos].empty? && @game_state[:ferns].empty? && @game_state[:eggs].empty?
  end

  def dinos_eat_ferns
    ferns_to_delete = []
    dinos_to_delete = []
    diseased_ferns_to_delete = []
    @game_state[:dinos].each_with_index do |dino, dinoIndex|
      # Eating health ferns
      @game_state[:ferns].each_with_index do |fern, index|
        if fern[:x] == dino[:x] && fern[:y] == dino[:y]
          ferns_to_delete << index
        end
      end
   
      # Eating diseased ferns
      @game_state[:diseased_ferns].each_with_index do |fern, index|
        if fern[:x] == dino[:x] && fern[:y] == dino[:y]
          diseased_ferns_to_delete << index
          if (dino[:health] < 3)
            dinos_to_delete << index
          else
            dino[:health] -= 2
          end
        end
      end
    end

    ferns_to_delete.reverse_each { |index| @game_state[:ferns].delete_at(index) }
    dinos_to_delete.reverse_each { |index| @game_state[:dinos].delete_at(index) }
    diseased_ferns_to_delete.reverse_each { |index| @game_state[:diseased_ferns].delete_at(index) }
  end

  def hungry_dinos_die
    dinos_to_delete = []
    @game_state[:dinos].each_with_index do |dino, index|
      if (dino[:health] <= 0)
        dinos_to_delete << index
      end
    end
    dinos_to_delete.reverse_each { |index| @game_state[:dinos].delete_at(index) }
  end

  def hatch_eggs
    eggs_to_delete = []
    @game_state[:eggs].each_with_index do |egg, index|
      if egg[:health] > 0
        egg[:health] -= 1
      else
        eggs_to_delete << index
        create_unit(:dino, egg[:x], egg[:y])
      end
    end
    eggs_to_delete.reverse_each { |index| @game_state[:eggs].delete_at(index) }
  end
        

  def poop_eggs
    @game_state[:dinos].combination(2).each do |dino1, dino2|
      # If there's 2 healthy dinos in the same spot
      if dino1[:x] == dino2[:x] && dino1[:y] == dino2[:y] && dino1[:health] > session[:dino_reproduce_health] && dino2[:health] > session[:dino_reproduce_health]
        # But not an egg already
        unless @game_state[:eggs].any? { |egg| egg[:x] == dino1[:x] && egg[:y] == dino1[:y] }
          # make a new egg
          create_unit(:egg, dino1[:x], dino1[:y])
        end
      end
    end
  end

  def decay_ferns
    ferns_to_delete = []
    @game_state[:ferns].each_with_index do |fern, index|
      if fern[:health] > 0
        fern[:health] -= 1
      else
        ferns_to_delete << index
      end
    end
    ferns_to_delete.reverse_each { |index| @game_state[:ferns].delete_at(index) }
  end

  def check_for_diseased_ferns
    for i in 1..(session[:board_width] - 2)
      for j in 1..(session[:board_height] - 2)
        if !check_coordinate_for_empty_fern_spots(i, j)
          make_coordinate_diseased_ferns(i, j)
        end
      end
    end
  end

  def check_coordinate_for_empty_fern_spots(i, j)
    has_empty = false
    for ii in (i - 1)..(i + 1)
      for jj in (j - 1)..(j + 1)
        if !@game_state[:ferns].any? { |fern| fern[:x] == ii && fern[:y] == jj }
          has_empty = true
        end
      end
    end
    has_empty 
  end

  def make_coordinate_diseased_ferns(i, j)
    for ii in (i - 1)..(i + 1)
      for jj in (j - 1)..(j + 1)
        @game_state[:ferns].delete_if { |fern| fern[:x] == ii && fern[:y] == jj }
        create_unit(:diseased_fern, ii, jj)
      end
    end
  end

  def spawn_ferns
    for i in 0..session[:board_width]
      for j in 0..session[:board_height]
        if check_empty(i, j) && rand < session[:fern_spawnrate]
          create_unit(:fern, i, j)
        end
      end
    end
  end

  def check_empty(i, j)
    @game_state.any? do |_, array|
      array.any? { |el| el[:x] == i && el[:y] == j }
    end
  end

  def adjust_fern_spawnrate
    session[:fern_spawnrate] = @game_state[:ferns].length / (session[:board_width] * session[:board_height])
  end
end

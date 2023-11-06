Rails.application.routes.draw do
  get 'game/start', to: 'game#start'
  get 'game', to: 'game#start'
  get 'game/new_epoch', to: 'game#new_epoch'

  get 'home/index', to: 'home#index'
  get 'home', to: 'home#index'

  get '/', to: 'home#index'

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end

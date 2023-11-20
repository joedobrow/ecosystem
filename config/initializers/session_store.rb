# config/initializers/session_store.rb
Rails.application.config.session_store :redit_store, key: '_ecosystem_game_session'
  servers: [
    {
      url: ENV['REDIS_URL'],
      namespace: "session"
    },
  ],
  expire_after: 120.minutes # Expire cookie
}

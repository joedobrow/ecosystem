# config/initializers/session_store.rb
Rails.application.config.session_store :redis_store, {
  servers: [
    {
      url: ENV['REDIS_URL'],
      namespace: "session"
    },
  ],
  expire_after: 120.minutes # Expire cookie
}

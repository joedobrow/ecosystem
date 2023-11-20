# config/initializers/session_store.rb
if Rails.env.production?
  Rails.application.config.session_store :redis_store,
    servers: [
      {
        url: ENV['REDISCLOUD_URL'],
        namespace: "session"
      },
    ],
    expire_after: 120.minutes,
    key: "_ecosystem_game_session",
    threadsafe: false,
    secure: true
else 
  Rails.application.config.session_store :redis_store,
    servers: [
      {
        url: 'redis://localhost:6379',
        namespace: 'session'
      },
    ],
    expire_after: 120.minutes
end

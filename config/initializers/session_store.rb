Rails.application.config.session_store :redis_store, {
  servers: [
    {
      host: "localhost", # Redis server address
      port: 6379, # Redis server port
      db: 0, # Redis database to use
      namespace: "session" # namespace for the keys
    },
  ],
  expire_after: 120.minutes # Expire cookie
}


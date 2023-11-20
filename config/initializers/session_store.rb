# config/initializers/session_store.rb
Rails.application.config.session_store :redis_store, {
  servers: [
    {
      url: ENV['redis://default:hmsl1ZzFx8Ac9tqjZSPbvmvsodfgOehM@redis-16905.c246.us-east-1-4.ec2.cloud.redislabs.com:16905'],
      namespace: "session"
    },
  ],
  expire_after: 120.minutes # Expire cookie
}

require('dotenv').config()
const { createClient } = require("redis");
const hash = require("object-hash");

// Initialize the Redis client variable
let redisClient = undefined;

// Initialize the Redis client with connection handling
async function initializeRedisClient() {
  const redisURL = process.env.REDIS_URI;
  if (redisURL) {
    redisClient = createClient({ url: redisURL });

    // Error handling for Redis client connection
    redisClient.on("error", (e) => {
      console.error("Failed to create the Redis client:", e);
    });

    try {
      await redisClient.connect();
      console.log("Connected to Redis successfully!");
    } catch (e) {
      console.error("Connection to Redis failed with error:", e);
      redisClient = undefined; // Ensure redisClient is not used if connection fails
    }
  }
}

// Function to create a cache key based on the request
function requestToKey(req) {
  const reqDataToHash = {
    query: req.query,
    body: req.body,
  };
  return `${req.path}@${hash.sha1(reqDataToHash)}`; // Generate a unique key for the request
}

// Check if Redis client is connected and functional
function isRedisWorking() {
  return !!redisClient?.isOpen; // Return true if Redis is connected
}

// Write data to Redis cache
async function writeData(key, data, options = { EX: 21600 }) {
  if (isRedisWorking()) {
    try {
      await redisClient.set(key, JSON.stringify(data), options); // Always store data as string
    } catch (e) {
      console.error(`Failed to cache data for key=${key}`, e);
    }
  }
}

// Read data from Redis cache
async function readData(key) {
  if (isRedisWorking()) {
    try {
      const cachedValue = await redisClient.get(key);
      return cachedValue ? JSON.parse(cachedValue) : null; // Return parsed JSON
    } catch (e) {
      console.error(`Failed to read data for key=${key}`, e);
    }
  }
  return null;
}

// Middleware to handle Redis caching
function redisCachingMiddleware(options = { EX: 21600 }) {
  return async (req, res, next) => {
    if (isRedisWorking()) {
      const key = requestToKey(req); // Create unique key for the request
      const cachedValue = await readData(key); // Read from cache

      if (cachedValue) {
        console.log(`Cache hit for key: ${key}`);
        return res.json(cachedValue); // Serve from cache
      } else {
        const oldSend = res.send;
        res.send = async function (data) {
          res.send = oldSend;

          if (res.statusCode.toString().startsWith("2")) { // Cache only successful responses
            await writeData(key, data, options);
          }

          return res.send(data); // Send response
        };
        next(); // Proceed to next middleware or route handler
      }
    } else {
      next(); // Proceed if Redis is not working
    }
  };
}

module.exports = { initializeRedisClient, redisCachingMiddleware };

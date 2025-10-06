# Use official Node.js LTS image as the base
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN yarn install --production
# RUN yarn build

COPY . .
# Expose the application's port (change if needed)
EXPOSE 4000

# Start the application
CMD ["node", "dist/main.js"]

# Use official Node.js LTS image as the base
FROM node:24-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install

COPY . .
RUN yarn build

FROM node:24-alpine as production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules


# Expose the application's port (change if needed)
EXPOSE 4000

# Start the application
CMD ["node", "dist/main.js"]

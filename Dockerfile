# Use official Node.js LTS image as the base
FROM --platform=linux/amd64 node:24-alpine as build

# Set working directory
WORKDIR /app

# Kích hoạt Corepack trước khi copy files
RUN corepack enable

# Copy package files AND Yarn configuration files
COPY package*.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./ 
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --immutable

# Copy source code AFTER installing dependencies
COPY . .

# Build the application
RUN yarn build

FROM --platform=linux/amd64 node:24-alpine as production

WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Expose the application's port
EXPOSE 4000

# Start the application
CMD ["node", "dist/main.js"]
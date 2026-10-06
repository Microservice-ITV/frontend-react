FROM node:20-alpine

WORKDIR /app

# Copy dependency files and install dependencies
COPY ./src/package*.json ./
RUN npm install

# Copy application source
COPY ./src ./

# Copy the repository-root public assets (e.g. logo.svg) into the app's public dir
COPY ./public ./public

# Copy entrypoint script
COPY docker/node/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 5173

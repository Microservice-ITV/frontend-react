FROM node:20-alpine

WORKDIR /app

# Copy dependency files and install dependencies
COPY ./src/package*.json ./
RUN npm install

# Copy application source
COPY ./src ./

# Copy entrypoint script
COPY docker/node/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 5173

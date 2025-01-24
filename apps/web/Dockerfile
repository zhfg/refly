# Nginx stage
FROM nginx:alpine

# Install envsubst and bash for environment variable substitution
RUN apk add --no-cache bash

# Copy nginx configuration
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files
WORKDIR /usr/share/nginx/html
COPY ./dist .

# Create config.js template
RUN echo "window.ENV = { \
  API_URL: '${API_URL:-http://localhost:5800}', \
  COLLAB_URL: '${COLLAB_URL:-http://localhost:5801}' \
};" > config.template.js

# Create entrypoint script
RUN echo '#!/bin/bash\n\
envsubst < config.template.js > config.js\n\
exec nginx -g "daemon off;"' > /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start Nginx with our entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]

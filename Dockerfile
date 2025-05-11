FROM node:18

# Create app directory
WORKDIR /app

# Copy Node.js app
COPY . .

# Install dependencies
RUN npm install

# Install nginx
RUN apt-get update && apt-get install -y nginx

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 10000

# Start both NGINX and Node.js using a script
CMD bash -c "node index.js & nginx -g 'daemon off;'"

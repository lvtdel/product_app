FROM node:18

# Create app directory
WORKDIR /app

# Copy Node.js app
COPY . .

# Install dependencies
RUN npm install



# Expose port 80 (NGINX) and 3000 (app, optional)
EXPOSE 3000

# Start both NGINX and Node.js using a script
CMD bash -c "node index.js"

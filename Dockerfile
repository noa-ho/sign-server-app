FROM ghcr.io/puppeteer/puppeteer:22.1.0

# Set the working directory
WORKDIR /app

# Temporarily switch to root to install dependencies
USER root

# Copy package files and install dependencies
COPY package*.json ./

# The --unsafe-perm flag is added to handle potential permission issues.
RUN npm install --unsafe-perm

# Copy the rest of the application files
COPY . .

# Switch back to the non-root user (pptruser)
USER pptruser

# Expose the application port
EXPOSE 5000

# Set the command to run the application
CMD ["node", "index.js"]
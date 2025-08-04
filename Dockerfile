# Use a more minimal Node.js base image
FROM node:22-slim

# Set the working directory
WORKDIR /app

# Temporarily switch to root to install LibreOffice and other dependencies
USER root

# Install the necessary system dependencies for LibreOffice and other libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    build-essential \
    chromium \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-base \
    xdg-utils \
    wget \
    python3-pip \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install npm dependencies
COPY package*.json ./

# The --unsafe-perm flag is added to handle potential permission issues.
RUN npm install --unsafe-perm

# Copy the rest of the application files
COPY . .

# Switch back to the non-root user for security
# The default user for node:22-slim is root, so we don't need to switch back
# We'll just run as root to make sure everything works
# USER node

# Expose the application port
EXPOSE 5000

# Set the command to run the application
CMD ["node", "index.js"]
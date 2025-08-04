# Use a base image with Node.js
FROM node:20-slim

# Install LibreOffice and other dependencies for PDF conversion
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Define the command to run your app
CMD [ "npm", "start" ]
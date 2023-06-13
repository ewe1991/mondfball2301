# Use the official Node.js 16 image from Docker Hub
FROM node:16

# Create a new user to run our application
RUN useradd -m myuser

# Switch to this new user
USER myuser

# Set the working directory to the new user's home directory
WORKDIR /home/myuser

# Copy package.json and package-lock.json (if available) into the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application into the working directory
COPY . .

# Run the build script
RUN npm run build

# Make the server's port available to the outside
EXPOSE 3000

# Start the server
CMD [ "npm", "start" ]

# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy your application files into the container
COPY . /app

# Install any necessary dependencies here (if required)
RUN npm install

# Start the application
CMD ["node", "SnDserver2.js"]


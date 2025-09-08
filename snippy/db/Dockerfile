# Use official MySQL image
FROM mysql:8.0

# Set working directory (optional)
WORKDIR /usr/src/app

# Copy initialization script
COPY init.sh /docker-entrypoint-initdb.d

# Expose MySQL default port
EXPOSE 3306

# No need to switch user; the official MySQL image handles permissions internally
# The entrypoint will automatically execute /docker-entrypoint-initdb.d/init.sh

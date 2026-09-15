# Use official MySQL image
FROM mysql:8.0

# Set working directory (optional)
WORKDIR /usr/src/app

# Copy initialization script
COPY init.sh /docker-entrypoint-initdb.d

# Expose MySQL default port
EXPOSE 3306

# The official image must start as root. Its entrypoint fixes datadir
# permissions then drops to the mysql user. A Dockerfile USER breaks boot
# and healthchecks (Aikido missing-user autofix).

# The entrypoint will automatically execute /docker-entrypoint-initdb.d/init.sh

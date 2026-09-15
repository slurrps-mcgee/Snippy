# Use official MySQL image
FROM mysql:8.0

# Set working directory (optional)
WORKDIR /usr/src/app

# Copy initialization script
COPY init.sh /docker-entrypoint-initdb.d

# Expose MySQL default port
EXPOSE 3306

# Create non-root user and set ownership
RUN useradd -U -u 1000 appuser && chown -R 1000:1000 /usr/src/app
USER 1000

# The entrypoint will automatically execute /docker-entrypoint-initdb.d/init.sh

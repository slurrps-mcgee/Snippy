FROM minio/mc:latest

# Copy init script
COPY minio-init.sh /minio-init.sh

# Ensure correct permissions & line endings
RUN chmod +x /minio-init.sh

ENTRYPOINT ["/minio-init.sh"]

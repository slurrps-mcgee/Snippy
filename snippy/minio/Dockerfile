FROM minio/mc:latest

# Copy init script
COPY minio-init.sh /minio-init.sh

# Ensure correct permissions & line endings
RUN chmod +x /minio-init.sh \
    && chown 1000:1000 /minio-init.sh

# mc writes client config under $HOME
ENV HOME=/tmp

USER 1000

ENTRYPOINT ["/minio-init.sh"]

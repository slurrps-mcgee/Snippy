# minio/mc:latest is gone from Docker Hub (MinIO stopped publishing
# community images). Chainguard builds a public mc client from source.
FROM cgr.dev/chainguard/minio-client:latest

COPY --chmod=755 minio-init.sh /minio-init.sh

# mc writes client config under $HOME
ENV HOME=/tmp

ENTRYPOINT ["/minio-init.sh"]

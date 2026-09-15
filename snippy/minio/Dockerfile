# Chainguard minio-client is distroless (no /bin/sh), so RUN and the
# init script cannot execute there. Copy mc onto Alpine instead.
FROM cgr.dev/chainguard/minio-client:latest AS mc

FROM alpine:3.21

RUN apk add --no-cache ca-certificates \
    && adduser -D -u 1000 -h /tmp mcuser

COPY --from=mc /usr/bin/mc /usr/local/bin/mc
COPY minio-init.sh /minio-init.sh

RUN chmod +x /usr/local/bin/mc /minio-init.sh \
    && chown 1000:1000 /usr/local/bin/mc /minio-init.sh

USER 1000
ENV HOME=/tmp

ENTRYPOINT ["/minio-init.sh"]

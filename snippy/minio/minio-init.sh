#!/bin/bash
set -e

echo "⏳ Waiting for MinIO to be available..."

# Wait until MinIO is ready
until mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" 2>/dev/null; do
  sleep 2
done

echo "✅ MinIO is up and reachable."

# Defaults
MINIO_BUCKET="${MINIO_BUCKET:-uploads}"
MINIO_APP_USER="${MINIO_APP_USER:-appuser}"
MINIO_APP_PASSWORD="${MINIO_APP_PASSWORD:-apppassword123}"
MINIO_BUCKET_POLICY="${MINIO_BUCKET_POLICY:-private}"

echo "Bucket: $MINIO_BUCKET"
echo "App user: $MINIO_APP_USER"
echo "Bucket policy: $MINIO_BUCKET_POLICY"

# Create bucket if missing
mc mb --ignore-existing local/$MINIO_BUCKET

# Optional: make bucket public read **before attaching user policies**
if [ "$MINIO_BUCKET_POLICY" = "public" ]; then
  echo "Setting bucket $MINIO_BUCKET to public read"
  mc anonymous set download local/$MINIO_BUCKET
fi

# Create app user if missing
if ! mc admin user info local "$MINIO_APP_USER" > /dev/null 2>&1; then
  echo "Creating app user $MINIO_APP_USER"
  mc admin user add local "$MINIO_APP_USER" "$MINIO_APP_PASSWORD"
else
  echo "App user $MINIO_APP_USER already exists"
fi

# Create per-user policy
cat > /tmp/${MINIO_BUCKET}-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${MINIO_BUCKET}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::${MINIO_BUCKET}/*"
      ]
    }
  ]
}
EOF

# Check if policy exists first
if ! mc admin policy info local ${MINIO_BUCKET}-policy > /dev/null 2>&1; then
  mc admin policy create local ${MINIO_BUCKET}-policy /tmp/${MINIO_BUCKET}-policy.json
  sleep 1
fi

# Attach policy to app user
mc admin policy attach local ${MINIO_BUCKET}-policy --user "$MINIO_APP_USER"

echo "✅ MinIO initialization complete."

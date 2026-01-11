#!/bin/bash
set -e

DB_NAME="nextjs-conf-db"
ENV_FILE=".env.local"

echo "Setting up Turso database..."

# Check if turso CLI is installed
if ! command -v turso &> /dev/null; then
  echo "Turso CLI not found. Installing..."
  brew install tursodatabase/tap/turso
fi

# Check if logged in
if ! turso auth whoami &> /dev/null; then
  echo "Please log in to Turso:"
  turso auth login
fi

# Create database (ignore error if exists)
echo "Creating database '$DB_NAME'..."
turso db create "$DB_NAME" 2>/dev/null || echo "Database already exists, continuing..."

# Get credentials
echo "Fetching credentials..."
DB_URL=$(turso db show "$DB_NAME" --url)
DB_TOKEN=$(turso db tokens create "$DB_NAME")

# Write to .env.local
echo "Writing to $ENV_FILE..."

# Remove old Turso vars if they exist
if [ -f "$ENV_FILE" ]; then
  grep -v "^TURSO_" "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
fi

# Append new vars
cat >> "$ENV_FILE" << EOF
TURSO_DATABASE_URL=$DB_URL
TURSO_AUTH_TOKEN=$DB_TOKEN
EOF

echo ""
echo "Done! Turso database configured."
echo "Next steps:"
echo "  pnpm db:push   # Apply schema"
echo "  pnpm db:seed   # Seed data"
echo "  pnpm dev       # Start app"

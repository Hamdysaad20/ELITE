#!/bin/bash

# Quick Vercel deployment - One command to rule them all!
# Usage: ./vercel-deploy.sh

echo "🚀 ELITE Coffee - Vercel One-Click Deploy"
echo "=========================================="
echo ""

# Ensure we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Must be on 'main' branch to deploy"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Uncommitted changes detected"
    echo "Please commit your changes before deploying"
    git status
    exit 1
fi

echo "✅ Branch: main"
echo "✅ No uncommitted changes"
echo ""

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🚀 Deploying to Vercel..."
echo "(Make sure you've already linked the project with: vercel link --yes)"
echo ""

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🌐 Visit: https://www.officieleliteeg.com"

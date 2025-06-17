#!/bin/bash

# Quick GitHub connection script
# Usage: ./connect-github.sh yourusername

if [ -z "$1" ]; then
    echo "Usage: $0 <github-username>"
    echo "Example: $0 johndoe"
    exit 1
fi

USERNAME=$1
REPO_NAME="sprint-retrospective"

echo "🔗 Connecting to GitHub repository..."
echo "Repository: https://github.com/$USERNAME/$REPO_NAME"
echo ""

# Add remote
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully connected to GitHub!"
    echo ""
    echo "🌐 Next: Enable GitHub Pages"
    echo "1. Go to: https://github.com/$USERNAME/$REPO_NAME/settings/pages"
    echo "2. Under 'Source', select 'Deploy from a branch'"
    echo "3. Select branch: 'main' and folder: '/ (root)'"
    echo "4. Click 'Save'"
    echo ""
    echo "🎉 Your app will be live at:"
    echo "   https://$USERNAME.github.io/$REPO_NAME"
    echo ""
    echo "⏰ Note: It may take a few minutes for the site to become available."
else
    echo "❌ Failed to push. Make sure:"
    echo "   - The repository exists on GitHub"
    echo "   - You have push access"
    echo "   - Your GitHub credentials are configured"
fi

#!/bin/bash

# Sprint Retrospective App - GitHub Pages Deployment
echo "🚀 GitHub Pages Deployment for Sprint Retrospective App"
echo "======================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Make sure you're in the project directory."
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "✅ Git repository initialized"
echo "✅ Files committed"
echo ""

# Check if remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ GitHub remote already configured"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Remote: $REMOTE_URL"
else
    echo "⚠️  No GitHub remote configured yet"
    echo ""
    echo "📝 Next steps:"
    echo "1. Create a repository on GitHub (https://github.com/new)"
    echo "2. Name it: sprint-retrospective"
    echo "3. Make it PUBLIC (required for free GitHub Pages)"
    echo "4. DON'T initialize with README"
    echo ""
    echo "5. Then run these commands:"
    echo "   git remote add origin https://github.com/YOURUSERNAME/sprint-retrospective.git"
    echo "   git push -u origin main"
    echo ""
    exit 0
fi

echo ""
echo "🚀 Ready to deploy!"
echo ""
read -p "Push to GitHub? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "🌐 Enable GitHub Pages:"
        echo "1. Go to your repository on GitHub"
        echo "2. Click 'Settings' tab"
        echo "3. Scroll to 'Pages' section"
        echo "4. Under 'Source', select 'Deploy from a branch'"
        echo "5. Select branch: 'main' and folder: '/ (root)'"
        echo "6. Click 'Save'"
        echo ""
        echo "🎉 Your app will be live at:"
        REPO_URL=$(git remote get-url origin)
        USERNAME=$(echo $REPO_URL | sed 's/.*github\.com[:/]\([^/]*\).*/\1/')
        REPO_NAME=$(echo $REPO_URL | sed 's/.*\/\([^.]*\)\.git/\1/')
        echo "   https://$USERNAME.github.io/$REPO_NAME"
    else
        echo "❌ Failed to push to GitHub. Check your credentials and try again."
    fi
else
    echo "⏸️  Deployment cancelled."
fi

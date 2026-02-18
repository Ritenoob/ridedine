# GitHub Actions Workflows

## deploy-pages.yml

This workflow automatically deploys the RideNDine frontend to GitHub Pages whenever code is pushed to the `main` branch.

### Trigger Events

- **Push to `main` branch**: Automatically deploys on every push
- **Manual workflow dispatch**: Can be manually triggered from the Actions tab

### What It Does

1. Checks out the repository code
2. Configures GitHub Pages settings
3. Uploads the `/docs` directory as a Pages artifact
4. Deploys the artifact to GitHub Pages

### Requirements

For this workflow to work, you must:

1. **Enable GitHub Pages** in repository settings:
   - Go to: Settings → Pages
   - Source: GitHub Actions (this is automatically selected when using this workflow)
   
2. **Grant workflow permissions**:
   - Settings → Actions → General → Workflow permissions
   - Enable "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests" (optional)

### Deployment URL

After deployment, your app will be available at:
```
https://[username].github.io/[repository-name]/
```

For example: `https://seancfafinlay.github.io/ridendine-demo/`

### Viewing Deployment Status

- Go to the "Actions" tab in your repository
- Click on the latest workflow run
- Check the "deploy" job for deployment status and URL

### Deployment Time

- Typical deployment time: 1-2 minutes
- First deployment may take longer

### Troubleshooting

**Issue: Workflow fails with "permission denied"**
- Solution: Check that workflow has write permissions in Settings → Actions

**Issue: "404 - There isn't a GitHub Pages site here"**
- Solution: Wait a few minutes for DNS propagation, or check Pages settings

**Issue: Assets not loading (404 on CSS/JS)**
- Solution: Verify that `/docs` directory contains all necessary files
- Check that paths in index.html use relative paths (e.g., `./styles.css` not `/styles.css`)

### Manual Deployment

To manually trigger deployment:
1. Go to Actions tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"

### Disabling Auto-Deployment

To disable automatic deployment on push:
1. Comment out or remove the `push:` trigger in the workflow file
2. Keep only `workflow_dispatch:` for manual deployments

```yaml
on:
  # push:
  #   branches:
  #     - main
  workflow_dispatch:
```

### Additional Notes

- The workflow uses the official GitHub Pages actions from `actions/`
- Deployment is atomic (all files deployed at once, no partial updates)
- Old deployments are automatically replaced
- Deployment history is available in the Actions tab

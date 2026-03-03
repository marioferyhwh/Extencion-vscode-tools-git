# Publishing VS Code Extension

## Prerequisites
Install the VS Code Extension Manager globally:
```bash
npm install -g @vscode/vsce
vsce --version
```

## Package and Publish

1. **Package the extension:**
```bash
vsce package
```

2. **Publish to VS Code Marketplace:**
```bash
vsce publish
```

## Additional Commands

- `vsce publish patch` - Increment patch version
- `vsce publish minor` - Increment minor version
- `vsce publish major` - Increment major version
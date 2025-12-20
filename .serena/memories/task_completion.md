# Task Completion Checklist

When completing a task, ensure the following:

## Before Submitting

### 1. Type Check
Run TypeScript compilation to check for type errors:
```bash
pnpm exec tsc --noEmit
```

### 2. Build Verification
Ensure the project builds successfully:
```bash
pnpm build
```

### 3. Manual Testing
Since there are no automated tests configured:
- Load extension in Chrome (`build/chrome-mv3-dev` or `build/chrome-mv3-prod`)
- Test affected functionality manually
- Check browser console for errors

## Code Quality Checks
- [ ] No TypeScript errors
- [ ] Follows existing code style (see code_style.md)
- [ ] Uses proper type annotations
- [ ] UI changes match dark theme styling
- [ ] Chrome extension permissions are appropriate

## Common Issues to Watch
- Ensure async operations in background scripts handle errors
- Test with both dev and prod builds
- Verify Chrome storage operations work correctly
- Check that Plasmo messaging handlers export correctly

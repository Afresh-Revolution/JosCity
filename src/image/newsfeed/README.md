# NewsFeed Images

## Image Naming Convention

When you upload images for the newsfeed, please name them as follows:

### Stories/Avatars:
- `story-1.jpg` / `story-1.png`
- `story-2.jpg` / `story-2.png`
- `story-3.jpg` / `story-3.png`
- `story-4.jpg` / `story-4.png`

Or use descriptive names:
- `avatar-blessing.jpg`
- `avatar-joseph.jpg`
- `avatar-david.jpg`
- etc.

### Post Images:
- `post-1.jpg` / `post-1.png`
- `post-2.jpg` / `post-2.png`

Or use descriptive names:
- `post-blessing-profile.jpg`
- `post-joseph-profile.jpg`
- etc.

### Suggested Friends:
- `friend-1.jpg`
- `friend-2.jpg`
- etc.

## Usage

After uploading images, update the image paths in:
- `src/pages/NewsFeed.tsx` - Update the posts, stories, and friends arrays with the correct image paths

Example:
```typescript
avatar: '../image/newsfeed/avatar-blessing.jpg'
image: '../image/newsfeed/post-blessing-profile.jpg'
```


const db = require('../config/database');

// ----------------------------
// Add a comment to a post
// ----------------------------
exports.commentOnPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { comment, text } = req.body;
    const commentText = (comment || text || '').trim();
    const userId = req.user.user_id;

    if (!commentText) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    // Check post existence
    const post = await db.query(
      'SELECT post_id, user_id FROM posts WHERE post_id = $1',
      [postId]
    );
    if (!post.rows.length) return res.status(404).json({ error: 'Post not found' });

    // Check user approval
    const user = await db.query(
      'SELECT account_status FROM users WHERE user_id = $1',
      [userId]
    );
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
    if (user.rows[0].account_status !== 'approved' && user.rows[0].account_status !== null) {
      return res.status(403).json({ error: 'Only approved users can comment' });
    }

    // Insert comment
    const result = await db.query(
      `INSERT INTO post_comments (post_id, user_id, comment, parent_comment_id, created_at)
       VALUES ($1, $2, $3, NULL, NOW()) RETURNING id`,
      [postId, userId, commentText]
    );
    const commentId = result.rows[0].id;

    // Handle mentions
    await handleCommentMentions(commentId, commentText, userId, postId);

    // Notify post owner (if not commenting on own post)
    if (post.rows[0].user_id !== userId) {
      await db.query(
        `INSERT INTO notifications (to_user_id, from_user_id, action, node_type, node_id, time)
         VALUES ($1, $2, 'commented on your post', 'post', $3, NOW())`,
        [post.rows[0].user_id, userId, postId]
      );
    }

    const completeComment = await getCompleteComment(commentId);
    res.json({ success: true, message: 'Comment added', data: completeComment });

  } catch (error) {
    console.error('Comment on post error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// ----------------------------
// Reply to a comment
// ----------------------------
exports.replyToComment = async (req, res) => {
  try {
    const { id: parentCommentId } = req.params;
    const { comment, text } = req.body;
    const replyText = (comment || text || '').trim();
    const userId = req.user.user_id;

    if (!replyText) {
      return res.status(400).json({ error: 'Reply cannot be empty' });
    }

    // Check parent comment
    const parent = await db.query(
      'SELECT id, post_id, user_id FROM post_comments WHERE id = $1',
      [parentCommentId]
    );
    if (!parent.rows.length) return res.status(404).json({ error: 'Parent comment not found' });

    const postId = parent.rows[0].post_id;

    // Insert reply
    const result = await db.query(
      `INSERT INTO post_comments (post_id, user_id, comment, parent_comment_id, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [postId, userId, replyText, parentCommentId]
    );
    const replyId = result.rows[0].id;

    // Handle mentions
    await handleCommentMentions(replyId, replyText, userId, postId);

    // Notify parent comment owner (if not replying to self)
    if (parent.rows[0].user_id !== userId) {
      await db.query(
        `INSERT INTO notifications (to_user_id, from_user_id, action, node_type, node_id, time)
         VALUES ($1, $2, 'replied to your comment', 'comment', $3, NOW())`,
        [parent.rows[0].user_id, userId, parentCommentId]
      );
    }

    const completeReply = await getCompleteComment(replyId);
    res.json({ success: true, message: 'Reply added', data: completeReply });

  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
};

// ----------------------------
// Fetch comments with replies
// ----------------------------
exports.getPostComments = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Only show comments for existing, non-deleted posts; exclude soft-deleted comments
    const commentsRes = await db.query(
      `SELECT pc.*, u.user_firstname, u.user_lastname, u.user_picture, u.user_verified
       FROM post_comments pc
       LEFT JOIN users u ON pc.user_id = u.user_id
       INNER JOIN posts p ON p.post_id = pc.post_id AND (p.is_hidden = FALSE OR p.is_hidden IS NULL)
       WHERE pc.post_id = $1 AND pc.parent_comment_id IS NULL AND pc.deleted_at IS NULL
       ORDER BY pc.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    const totalRes = await db.query(
      `SELECT COUNT(*) as count FROM post_comments pc
       INNER JOIN posts p ON p.post_id = pc.post_id AND (p.is_hidden = FALSE OR p.is_hidden IS NULL)
       WHERE pc.post_id = $1 AND pc.parent_comment_id IS NULL AND pc.deleted_at IS NULL`,
      [postId]
    );

    const commentsWithReplies = await Promise.all(
      commentsRes.rows.map(async (comment) => {
        const repliesRes = await db.query(
          `SELECT pc.*, u.user_firstname, u.user_lastname, u.user_picture, u.user_verified
           FROM post_comments pc
           LEFT JOIN users u ON pc.user_id = u.user_id
           WHERE pc.parent_comment_id = $1 AND pc.deleted_at IS NULL
           ORDER BY pc.created_at ASC
           LIMIT 5`,
          [comment.id]
        );

        return {
          ...comment,
          time_ago: getTimeAgo(comment.created_at),
          author: {
            id: comment.user_id,
            name: `${comment.user_firstname} ${comment.user_lastname}`,
            picture: comment.user_picture,
            verified: comment.user_verified === '1'
          },
          replies: repliesRes.rows.map(reply => ({
            ...reply,
            time_ago: getTimeAgo(reply.created_at),
            author: {
              id: reply.user_id,
              name: `${reply.user_firstname} ${reply.user_lastname}`,
              picture: reply.user_picture,
              verified: reply.user_verified === '1'
            }
          }))
        };
      })
    );

    res.json({
      success: true,
      data: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalRes.rows[0].count),
        totalPages: Math.ceil(totalRes.rows[0].count / limit)
      }
    });

  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// ----------------------------
// Delete comment (soft delete: only post owner or comment owner can hide)
// ----------------------------
exports.deleteComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.user.user_id;

    const comment = await db.query(
      'SELECT pc.user_id, pc.post_id, p.user_id AS post_owner_id FROM post_comments pc LEFT JOIN posts p ON p.post_id = pc.post_id WHERE pc.id = $1 AND pc.deleted_at IS NULL',
      [commentId]
    );
    if (!comment.rows.length) return res.status(404).json({ error: 'Comment not found' });

    const { user_id: commentOwnerId, post_owner_id: postOwnerId } = comment.rows[0];
    const isCommentOwner = commentOwnerId === userId;
    const isPostOwner = postOwnerId != null && postOwnerId === userId;
    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ error: 'Only the comment author or post owner can delete this comment' });
    }

    await db.query(
      'UPDATE post_comments SET deleted_at = NOW(), deleted_by_user_id = $1 WHERE id = $2',
      [userId, commentId]
    );

    res.json({ success: true, message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// ----------------------------
// Mentions handler
// ----------------------------
const handleCommentMentions = async (commentId, text, userId, postId) => {
  if (!text) return;

  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const userRes = await db.query('SELECT user_id FROM users WHERE user_name = $1', [username]);
    if (userRes.rows.length > 0) {
      const mentionedUserId = userRes.rows[0].user_id;

      // Create mention record (if table exists)
      await db.query(
        `INSERT INTO comments_mentions (comment_id, user_id) VALUES ($1, $2)`,
        [commentId, mentionedUserId]
      );

      // Create notification
      await db.query(
        `INSERT INTO notifications (to_user_id, from_user_id, action, node_type, node_id, time)
         VALUES ($1, $2, 'mentioned you in a comment', 'comment', $3, NOW())`,
        [mentionedUserId, userId, commentId]
      );
    }
  }
};

// ----------------------------
// Fetch single comment with author info
// ----------------------------
const getCompleteComment = async (commentId) => {
  const res = await db.query(
    `SELECT pc.*, u.user_firstname, u.user_lastname, u.user_picture, u.user_verified
     FROM post_comments pc
     LEFT JOIN users u ON pc.user_id = u.user_id
     WHERE pc.id = $1`,
    [commentId]
  );

  if (!res.rows.length) return null;

  const comment = res.rows[0];
  return {
    ...comment,
    time_ago: getTimeAgo(comment.created_at),
    author: {
      id: comment.user_id,
      name: `${comment.user_firstname} ${comment.user_lastname}`,
      picture: comment.user_picture,
      verified: comment.user_verified === '1'
    }
  };
};

// ----------------------------
// Helper: time ago
// ----------------------------
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
};
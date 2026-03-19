// const db = require('../config/database');

// exports.sharePost = async (req, res) => {
//   try {
//     const { id: postId } = req.params;
//     const { text, privacy = 'public' } = req.body;
//     const userId = req.user.user_id;

//     // Check if post exists
//     const originalPost = await db.query(
//       'SELECT post_id, user_id, text, post_type FROM posts WHERE post_id = $1',
//       [postId]
//     );

//     if (originalPost.rows.length === 0) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     // Create shared post
//     const shareResult = await db.query(
//       `INSERT INTO posts (user_id, user_type, text, post_type, privacy, original_post_id, time)
//        VALUES ($1, 'user', $2, 'share', $3, $4, NOW()) 
//        RETURNING post_id`,
//       [userId, text, privacy, postId]
//     );

//     const sharedPostId = shareResult.rows[0].post_id;

//     // Update share count on original post
//     await db.query(
//       'UPDATE posts SET shares_count = shares_count + 1 WHERE post_id = $1',
//       [postId]
//     );

//     // Create notification for original post owner (if not sharing own post)
//     if (originalPost.rows[0].user_id !== userId) {
//       await db.query(
//         `INSERT INTO notifications (to_user_id, from_user_id, action, node_type, node_id, time)
//          VALUES ($1, $2, $3, $4, $5, NOW())`,
//         [originalPost.rows[0].user_id, userId, 'shared your post', 'post', postId]
//       );
//     }

//     // Get the complete shared post
//     const completeSharedPost = await getCompleteSharedPost(sharedPostId, userId);

//     res.json({
//       success: true,
//       message: 'Post shared successfully',
//       data: completeSharedPost
//     });

//   } catch (error) {
//     console.error('Share post error:', error);
//     res.status(500).json({ error: 'Failed to share post' });
//   }
// };

// exports.getPostShares = async (req, res) => {
//   try {
//     const { id: postId } = req.params;
//     const { page = 1, limit = 20 } = req.query;
//     const offset = (page - 1) * limit;

//     const shares = await db.query(`
//       SELECT p.*,
//             u.user_firstname, u.user_lastname, u.user_picture, u.user_verified,
//              -- Original post info
//              op.user_id as original_user_id,
//              ou.user_firstname as original_user_firstname,
//              ou.user_lastname as original_user_lastname,
//              ou.user_picture as original_user_picture,
//              op.text as original_text,
//              op.post_type as original_post_type
//       FROM posts p
//       JOIN users u ON p.user_id = u.user_id
//       JOIN posts op ON p.original_post_id = op.post_id
//       JOIN users ou ON op.user_id = ou.user_id
//       WHERE p.original_post_id = $1 AND p.post_type = 'share'
//       ORDER BY p.post_id DESC
//       LIMIT $2 OFFSET $3
//     `, [postId, limit, offset]);

//     const total = await db.query(
//       'SELECT COUNT(*) as count FROM posts WHERE original_post_id = $1 AND post_type = $2',
//       [postId, 'share']
//     );

//     const formattedShares = shares.rows.map(share => ({
//       ...share,
//       time_ago: getTimeAgo(share.time),
//       author: {
//         id: share.user_id,
//         name: `${share.user_firstname} ${share.user_lastname}`,
//         picture: share.user_picture,
//         verified: share.user_verified === '1'
//       },
//       original_post: {
//         id: share.original_post_id,
//         author: {
//           id: share.original_user_id,
//           name: `${share.original_user_firstname} ${share.original_user_lastname}`,
//           picture: share.original_user_picture
//         },
//         text: share.original_text,
//         post_type: share.original_post_type
//       }
//     }));

//     res.json({
//       success: true,
//       data: formattedShares,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: parseInt(total.rows[0].count),
//         totalPages: Math.ceil(total.rows[0].count / limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get post shares error:', error);
//     res.status(500).json({ error: 'Failed to fetch post shares' });
//   }
// };

// const getCompleteSharedPost = async (sharedPostId, userId) => {
//   const sharedPost = await db.query(`
//     SELECT p.*,
//            u.user_firstname, u.user_lastname, u.user_picture, u.user_verified,
//            op.post_id as original_post_id, op.text as original_text, op.post_type as original_post_type,
//            op.user_id as original_user_id, 
//            ou.user_firstname as original_user_firstname,
//            ou.user_lastname as original_user_lastname,
//            ou.user_picture as original_user_picture
//     FROM posts p
//     JOIN users u ON p.user_id = u.user_id
//     JOIN posts op ON p.original_post_id = op.post_id
//     JOIN users ou ON op.user_id = ou.user_id
//     WHERE p.post_id = $1
//   `, [sharedPostId]);

//   if (sharedPost.rows.length === 0) return null;

//   const post = sharedPost.rows[0];
  
//   // Format similar to regular post but with original post info
//   const feedController = require('./feedController');
//   const formattedPost = await feedController.formatPost(post, userId);
  
//   formattedPost.original_post = {
//     id: post.original_post_id,
//     text: post.original_text,
//     post_type: post.original_post_type,
//     author: {
//       id: post.original_user_id,
//       name: `${post.original_user_firstname} ${post.original_user_lastname}`,
//       picture: post.original_user_picture
//     }
//   };

//   return formattedPost;
// };

// const getTimeAgo = (timestamp) => {
//   const now = new Date();
//   const postTime = new Date(timestamp);
//   const diffInSeconds = Math.floor((now - postTime) / 1000);

//   if (diffInSeconds < 60) return 'just now';
//   if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
//   if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
//   if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
//   return `${Math.floor(diffInSeconds / 604800)}w`;
// };
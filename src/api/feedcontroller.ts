// const db = require('../config/database');

// /**
//  * Get news feed
//  */
// exports.getNewsFeed = async (req, res) => {
//   try {
//     if (!req.user || !req.user.user_id) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }

//     const { page = 1, limit = 10, type = 'all' } = req.query;
//     const offset = (page - 1) * limit;
//     const userId = req.user.user_id;

//     // Get posts using simple algorithm
//     const posts = await getPosts(userId, type, limit, offset);

//     // Format posts for frontend
//     const formattedPosts = await Promise.all(
//       posts.map(post => formatPost(post, userId))
//     );

//     res.json({
//       success: true,
//       data: formattedPosts,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         hasMore: posts.length === parseInt(limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get news feed error:', error.message);
//     return res.json({
//       success: true,
//       data: [],
//       pagination: { page: 1, limit: 10, hasMore: false }
//     });
//   }
// };

// // ------------------------
// // Fetch posts from DB
// // ------------------------
// const getPosts = async (userId, type, limit, offset) => {
//   try {
//     const result = await db.query(
//       `SELECT p.*, 
//               u.user_firstname, u.user_lastname, u.user_picture, u.user_verified
//        FROM posts p
//        LEFT JOIN users u ON p.user_id = u.user_id
//        WHERE p.is_hidden = FALSE
//        ORDER BY p.created_at DESC
//        LIMIT $1 OFFSET $2`,
//       [limit, offset]
//     );
//     return result.rows;
//   } catch (err) {
//     console.error('Posts query failed:', err.message);
//     return [];
//   }
// };

// // ------------------------
// // Format Post for Frontend
// // ------------------------
// const formatPost = async (post, userId) => {
//   const formatted = { ...post };

//   // Convert Postgres array string to JS array
//   formatted.media_urls = post.media_urls || [];
//   if (typeof formatted.media_urls === 'string') {
//     formatted.media_urls = formatted.media_urls.replace(/{|}/g, '').split(',');
//   }

//   formatted.media_types = post.media_types || [];
//   if (typeof formatted.media_types === 'string') {
//     formatted.media_types = formatted.media_types.replace(/{|}/g, '').split(',');
//   }

//   // Author
//   if (post.user_type === 'user') {
//     formatted.author = {
//       id: post.user_id,
//       name: `${post.user_firstname} ${post.user_lastname}`,
//       picture: post.user_picture,
//       verified: Boolean(post.user_verified),
//       type: 'user'
//     };
//   } else {
//     formatted.author = {
//       id: post.user_id,
//       name: post.page_title,
//       username: post.page_name,
//       picture: post.page_picture,
//       verified: Boolean(post.page_verified),
//       type: 'page'
//     };
//   }

//   // Media
//   formatted.media = (formatted.media_urls || []).map((url, idx) => ({
//     url,
//     type: formatted.media_types?.[idx] || 'unknown'
//   }));

//   // Reactions count
//   formatted.reactions_count = post.reactions_count || 0;
//   formatted.user_reacted = post.user_reacted || false;

//   // Latest 2 comments preview
//   formatted.comments_preview = await getCommentsPreview(post.post_id);

//   // Time ago
//   formatted.time_ago = getTimeAgo(post.created_at);

//   return formatted;
// };


// // ------------------------
// // Get Comments Preview
// // ------------------------
// const getCommentsPreview = async (postId) => {
//   try {
//     const comments = await db.query(
//       `SELECT pc.*, u.user_firstname, u.user_lastname, u.user_picture, u.user_verified
//        FROM post_comments pc
//        LEFT JOIN users u ON pc.user_id = u.user_id
//        WHERE pc.post_id = $1 AND pc.deleted_at IS NULL
//        ORDER BY pc.created_at DESC
//        LIMIT 2`,
//       [postId]
//     );

//     return comments.rows.map(c => ({
//       id: c.id,
//       comment: c.comment,
//       time_ago: getTimeAgo(c.created_at),
//       author: {
//         name: `${c.user_firstname} ${c.user_lastname}`,
//         picture: c.user_picture,
//         verified: c.user_verified === '1'
//       }
//     }));
//   } catch (err) {
//     console.error('Comments preview fetch failed:', err.message);
//     return [];
//   }
// };

// // ------------------------
// // Time Ago Helper
// // ------------------------
// const getTimeAgo = (timestamp) => {
//   const now = new Date();
//   const postTime = new Date(timestamp);
//   const diff = Math.floor((now - postTime) / 1000);

//   if (diff < 60) return 'just now';
//   if (diff < 3600) return `${Math.floor(diff / 60)}m`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
//   if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
//   if (diff < 2592000) return `${Math.floor(diff / 604800)}w`;
//   return `${Math.floor(diff / 2592000)}mo`;
// };
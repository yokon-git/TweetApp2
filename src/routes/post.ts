import express from "express";
import {body, validationResult} from "express-validator";
import {formatDate} from "@/lib/convert_date";
import {Post} from "@/models/post";
import {Like} from "@/models/like";
import {ensureAuthUser} from "@/middlewares/authentication";
import {ensureOwnerOfPost} from "@/middlewares/current_user";
export const postRouter = express.Router();

/** "/get_posts"のget_を削除 */
postRouter.get("/posts", ensureAuthUser, async (req, res) => {
  const posts = await Post.all();
  const postsWithUser = await Promise.all(
    posts.map(async post => {
      const user = await post.user();
      return {
        ...post,
        user,
      };
    })
  );
  res.render("posts/index", {
    posts: postsWithUser,
  });
});

/** "/new_post"を"/posts/new"へ変更 */
postRouter.get("/posts/new", ensureAuthUser, (req, res) => {
  res.render("posts/new", {
    post: {
      content: "",
    },
    errors: [],
  });
});

/** "/get_post"を"/posts"へ変更 */
postRouter.get("/posts/:postId", ensureAuthUser, async (req, res, next) => {
  const {postId} = req.params;
  const post = await Post.find(Number(postId));
  if (!post || !post.id)
    return next(new Error("Invalid error: The post or post.id is undefined."));
  const user = await post.user();
  const currentUserId = req.authentication?.currentUserId;
  if (currentUserId === undefined) {
    // `ensureAuthUser` enforces `currentUserId` is not undefined.
    // This must not happen.
    return next(new Error("Invalid error: currentUserId is undefined."));
  }
  const likeCount = await post.hasLikedCount();
  const hasLiked = await Like.isExistByUser(currentUserId, post.id);
  res.render("posts/show", {
    post,
    postCreatedAt: post.createdAt ? formatDate(post.createdAt) : "",
    user,
    likeCount,
    hasLiked,
  });
});

/** "/create_posts"を"/posts"へ変更 */
postRouter.post(
  "/posts",
  ensureAuthUser,
  body("content", "Content can't be blank").notEmpty(),
  async (req, res, next) => {
    const {content} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("posts/new", {
        post: {
          content,
        },
        errors: errors.array(),
      });
    }

    const currentUserId = req.authentication?.currentUserId;
    if (currentUserId === undefined) {
      // `ensureAuthUser` enforces `currentUserId` is not undefined.
      // This must not happen.
      return next(new Error("Invalid error: currentUserId is undefined."));
    }
    const post = new Post(content, currentUserId);
    await post.save();
    req.dialogMessage?.setMessage("Post successfully created");
    res.redirect("/posts");/** get_部分を削除 */
  }
);

/** "/edit_post/:postId" --> "/posts/:postId/edit" */
postRouter.get(
  "/posts/:postId/edit",
  ensureAuthUser,
  ensureOwnerOfPost,
  async (req, res) => {
    res.render("posts/edit", {
      errors: [],
    });
  }
);

/** postからpatchへ変更 */
postRouter.patch(
  /** "/update_post/:postId" --> "/posts/:postId" */
  "/posts/:postId",
  ensureAuthUser,
  ensureOwnerOfPost,
  body("content", "Content can't be blank").notEmpty(),
  async (req, res) => {
    const {content} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("posts/edit", {
        post: {
          content,
        },
        errors: errors.array(),
      });
    }
    const post = res.locals.post;
    post.content = content;
    await post.update();
    req.dialogMessage?.setMessage("Post successfully edited");
    res.redirect("/posts");/** get_部分を削除 */
  }
);

/** postからdeleteへ変更 */
postRouter.delete(
  /** "/delete_post/:postId" --> "/posts/:postId" */
  "/posts/:postId",
  ensureAuthUser,
  ensureOwnerOfPost,
  async (req, res) => {
    const post = res.locals.post;
    await post.delete();
    req.dialogMessage?.setMessage("Post successfully deleted");
    res.redirect("/posts");/** get_部分を削除 */
  }
);

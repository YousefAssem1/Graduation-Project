import "express-async-errors"; 
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import flash from "express-flash";
import multer from "multer";
import path from "path";
import e from "connect-flash";
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import connectPgSimple  from "connect-pg-simple";
import fs from "fs";


env.config();

const app = express();
const port = 3000;
const saltRounds = 10;
const pgSession = connectPgSimple(session);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 3000000 }, // 3MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload a JPEG, JPG, PNG, or GIF file."));
    }
  },
}).single("profileimage");

const blogImageStorage = multer.diskStorage({
  destination: "./public/uploads/blog_images/",
  filename: (req, file, cb) => {
    cb(null, `blog-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadBlogImage = multer({
  storage: blogImageStorage,
  limits: { fileSize: 3000000 }, // 3MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload a JPEG, JPG, PNG, or GIF file."));
    }
  }
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Changed to false
    store: new pgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: 'user_sessions'
    }),
    cookie: { 
      secure: false,
      maxAge: 15 * 60 * 1000
    }
  })
);

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USERNAME, // your email
    pass: process.env.EMAIL_PASSWORD // your app password (for Gmail)
  }
});

// Add authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login?message=Please+login+to+continue');
};

const verificationcodes = new Map();

const verificationCodes = {};

// Update your reset-password endpoint
app.use(passport.initialize());

app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();
app.use(flash());

app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    const table = req.user.role === 'admin' ? 'admin' : 'users';
    const idColumn = req.user.role === 'admin' ? 'admin_id' : 'id';
    
    db.query(
      `SELECT COUNT(*) FROM user_sessions 
       WHERE sess -> 'passport' -> 'user' ->> 'id' = $1 
       AND sid != $2`,
      [req.user.id.toString(), req.sessionID]
    ).then(result => {
      if (result.rows[0].count > 0) {
        req.logout((err) => {
          if (err) console.error(err);
          req.session.destroy(() => {
            const redirect = req.user.role === 'admin' 
              ? '/admin-login' 
              : '/login';
            res.redirect(`${redirect}?error=Session+invalidated`);
          });
        });
      } else {
        next();
      }
    });
  } else {
    next();
  }
});

// Configure Multer for file uploads
const contentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/student_content/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const contentUpload = multer({ 
  storage: contentStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('application/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const fileNamer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.fieldname === 'subjectFile' 
      ? './public/uploads/documents/' // Lowercase 'uploads'
      : './public/uploads/images/';    // Lowercase 'uploads'
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Multer configuration without file filter
const handleUploads = multer({
  storage: fileNamer,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 1GB limit
    files: 10
  }
}).fields([ 
  { name: 'subjectFile', maxCount: 9 },
  { name: 'subjectImage', maxCount: 1 }
]);

const professorStorage = multer.diskStorage({
  destination: './public/uploads/professors/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `professor-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadProfessor = multer({
  storage: professorStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, JPG, PNG)'));
    }
  }
}).single('professorImage');

// Update upload directories to lowercase
const uploadDirs = ['./public/uploads/documents', './public/uploads/images','./public/uploads/professors'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const researchStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/research/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `research-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadResearch = multer({
  storage: researchStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'public/uploads/projects/';
    if (file.fieldname === 'projectImages') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'projectFiles') {
      uploadPath += 'documents/';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProject = multer({
  storage: projectStorage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'projectImages') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only images are allowed'), false);
      }
    } else if (file.fieldname === 'projectFiles') {
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/zip'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only PDF, DOC, DOCX and ZIP files are allowed'), false);
      }
    }
    cb(null, true);
  }
}).fields([
  { name: 'projectImages', maxCount: 5 },
  { name: 'projectFiles', maxCount: 5 }
]);
const institutionStorage = multer.diskStorage({
  destination: './public/uploads/institutions/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `institution-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadInstitution = multer({
  storage: institutionStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, JPG, PNG)'), false);
    }
  }
}).single('institutionImage');

//home page route
app.get("/", (req, res) => {
  res.render("home-page");
});

//login page route
app.get("/login", (req, res) => 
  {res.render("login-page");

});

//registration page route
app.get("/registration", (req, res) => {
  res.render("registration-page");
}
);

app.all("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Internal Server Error");
    }
    
    // Destroy session completely
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).send("Internal Server Error");
      }
      
      // Clear the session cookie
      res.clearCookie('connect.sid');
      
      res.redirect('/');
    });
  });
});

//student page route
app.get("/student-page",ensureAuthenticated, (req, res) => {
  if (req.user.role !== 'student') {
    return res.redirect("/login");
  }
  const first_name = req.user.first_name;
  const last_name = req.user.last_name;
  const profileimage = req.user.profileimage;
  const userData = {
    fname: first_name,
    lname: last_name,
    profileimage: profileimage
  };
  res.render("student-page", { userData });
}
);

//professor page route
app.get("/professor-page", ensureAuthenticated,(req, res) => {
  if (req.user.role !== 'professor') {
    return res.redirect("/login");
  }
  const first_name = req.user.first_name;
  const last_name = req.user.last_name;
  const profileimage = req.user.profileimage;
  const userData = {
    fname: first_name,
    lname: last_name,
    profileimage: profileimage
  };
  res.render("professor-page", { userData });
}
);

//professor research page route
app.get("/professor-research",ensureAuthenticated, async(req, res) => {
    try {
      const result = await db.query("SELECT * FROM professor_research WHERE email = $1", [req.user.email]);
      const first_name = req.user.first_name;
      const profileimage = req.user.profileimage;
      const role = req.user.role;

      const userData = {
        fname: first_name,
        profileimage: profileimage,
        role: role,
        result: result.rows, // Pass the research data to the template
      }; 
      res.render("professor-research", { userData });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

// Delete research route
app.delete("/professor-research/delete/:id", ensureAuthenticated, async (req, res) => {
    try {
        const researchId = req.params.id;
        
        // Verify ownership before deletion
        const research = await db.query(
            "SELECT * FROM professor_research WHERE id = $1 AND email = $2",
            [researchId, req.user.email]
        );

        if (research.rows.length === 0) {
            return res.status(404).json({ error: "Research not found or unauthorized" });
        }

        // Delete from database
        await db.query("DELETE FROM professor_research WHERE id = $1", [researchId]);

        // Delete file from filesystem (assuming path is stored)
        const filePath = research.rows[0].path;
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
        });

        res.status(200).json({ message: "Research deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// University selection page
app.get("/professor-communicate", ensureAuthenticated, async (req, res) => {
  try {
    // Fetch universities from the database
    const { rows: universities } = await db.query('SELECT * FROM university;');
    
    const userData = {
      fname: req.user.first_name,
      profileimage: req.user.profileimage,
      role: req.user.role,
      purpose: req.query.purpose
    };
    
    // Pass universities data to the template
    res.render("uni-page", { userData, universities });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//blogs user profile page
app.get("/publication-profile",ensureAuthenticated, async (req, res) => {
  try {
      // Get query parameters
      const { email, col_name, uni_code } = req.query;
      
      // Validate required parameters
      if (!email || !col_name || !uni_code) {
          return res.status(400).send("Missing required parameters");
      }

      // Fetch professor data
      const professor = await db.query(
          "SELECT * FROM professor WHERE professor_email = $1 AND college_name = $2 AND university_code = $3", 
          [email, col_name, uni_code]
      );

      // Check if professor exists
      if (!professor.rows.length) {
          return res.status(404).send("Professor not found");
      }

      // Prepare response data
      const responseData = {
          userData: {
              fname: req.user.first_name,
              profileimage: req.user.profileimage,
              role: req.user.role
          },
          professor: professor.rows[0]
      };

      // Render the template with data
      res.render("publication-profile", responseData);

  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
  }
});

// College selection page
app.get("/colleges-page", ensureAuthenticated,async (req, res) => {
  try {
    const uniCode = req.query.uni_code;
    const purpose = req.query.purpose; // Get from query
    
    const result = await db.query("SELECT * FROM college WHERE university_code = $1", [uniCode]);
    
    const userData = {
      fname: req.user.first_name,
      profileimage: req.user.profileimage,
      role: req.user.role,
      result: result.rows,
      purpose: purpose // Pass through again
    };
    
    res.render("colleges-page", { 
      userData, 
      noResults: result.rows.length === 0 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// blog page route
app.get("/blogs", ensureAuthenticated,async (req, res) => {
  console.log("Query Parameters:", req.query);
  const role = req.user.role;
  
  try {
    const purpose = req.query.purpose;
    
    // Base user data
    const userData = {
      id: req.user.id,
      fname: req.user.first_name,
      lname: req.user.last_name,
      profileimage: req.user.profileimage,
      role: role,
      uniCode: req.query.uni_code || 'ahu',
      collegename: req.query.col_name || 'Information technology',
      email: req.user.email,
      purpose: purpose
    };

    // Student-specific data structure
    const userdata = {
      id: req.user.id,
      fname: req.user.first_name,
      lname: req.user.last_name,
      profileimage: req.user.profileimage,
      role: role,
      uniCode: 'ahu',
      collegename: 'Information technology',
      currentUserId: req.user.id 
    };

    // Fetch blogs based on university and college (for both roles)
    const [blogs, defaultBlogs, professors] = await Promise.all([
      db.query(
        `SELECT b.*, u.id as user_id FROM blogs b
         JOIN users u ON b.user_email = u.email
         WHERE b.university_code = $1 AND b.college_name = $2 AND b.user_role = $3
         ORDER BY b.timestamp_ DESC`,
        [userData.uniCode, userData.collegename, role]
      ),
      db.query(
        `SELECT b.*, u.id as user_id FROM blogs b
         JOIN users u ON b.user_email = u.email
         WHERE b.university_code = $1 AND b.college_name = $2 AND b.user_role = $3
         ORDER BY b.timestamp_ DESC`,
        ['ahu', 'Information technology', role]
      ),
      role === 'professor' ? 
        db.query(
          "SELECT * FROM professor WHERE university_code = $1 AND college_name = $2",
          [userData.uniCode, userData.collegename]
        ) : 
        Promise.resolve({ rows: [] })
    ]);

    // Prepare response data
    userData.blogs = blogs.rows;
    userdata.blogs = defaultBlogs.rows;
    userData.professor = professors.rows;

    // Log student blogs if needed
    if (role === 'student') {
      console.log("Student Blogs:", userdata.blogs);
    }

    // Render appropriate view based on role and purpose
    if (role === 'professor') {
      res.render(
        purpose === 'publication' ? "publication-page" : "professor-blog", 
        { userData }
      );
    } else {
      res.render("student-blogs", { userdata });
    }

  } catch (err) {
    console.error("Blogs route error:", err);
    res.status(500).send("Server Error");
  }
});

//comment route
app.get("/comments/:blogId",ensureAuthenticated, async (req, res) => {
  try {
    const { blogId } = req.params;
    const result = await db.query(
      `WITH RECURSIVE comment_tree AS (
          SELECT 
              c.*,
              u.first_name as user_fname,
              u.last_name as user_lname,
              u.profileimage as user_image,
              u.id as user_id,
              CONCAT('/professor-profile-preview?email=', u.email) as user_profile,
              0 as level
          FROM comments c
          JOIN users u ON c.user_email = u.email
          WHERE c.blog_id = $1 AND c.parent_comment_id IS NULL

          UNION ALL

          SELECT 
              c.*,
              u.first_name as user_fname,
              u.last_name as user_lname,
              u.profileimage as user_image,
              u.id as user_id, 
              CONCAT('/professor-profile-preview?email=', u.email) as user_profile,
              ct.level + 1
          FROM comments c
          JOIN comment_tree ct ON c.parent_comment_id = ct.comment_id
          JOIN users u ON c.user_email = u.email
      )
      SELECT * FROM comment_tree ORDER BY level, timestamp_`,
      [blogId]
    );

    res.json({ success: true, comments: result.rows });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// DELETE comment route
app.delete('/comments/:id',ensureAuthenticated,async (req, res) => {
  try {
      const commentId = req.params.id;

      const comment = await db.query(
          `DELETE FROM comments 
          WHERE comment_id = $1 `,
          [commentId]
      );
      res.json({
          success: true,
          message: 'Comment deleted successfully'
      });

  } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
          success: false,
          message: 'Server error while deleting comment'
      });
  }
});

// add a new comment to a blog
app.post("/comments", ensureAuthenticated, async (req, res) => {
  try {
      const { blog_id, parent_comment_id, comment_text } = req.body;
      const user = req.user;

      if (!user) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const result = await db.query(
          `INSERT INTO comments (
              blog_id, parent_comment_id, user_email, 
              user_fname, user_lname, user_image, 
              user_profile, comment_text
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
              blog_id,
              parent_comment_id || null,
              user.email,
              user.first_name,
              user.last_name,
              user.profileimage,
              `/professor-profile-preview?email=${user.email}`,
              comment_text
          ]
      );

      res.json({ success: true, comment: result.rows[0] });
  } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Report blog route
app.post('/report-blog/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    await db.query(
      'UPDATE blogs SET is_reported = true WHERE blog_id = $1',
      [blogId]
    );
    res.json({ success: true, message: 'Thanks for helping improve our community! 🎉' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error reporting content' });
  }
});

// Report comment route
app.post('/report-comment/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    await db.query(
      'UPDATE comments SET is_reported = true WHERE comment_id = $1',
      [commentId]
    );
    res.json({ success: true, message: 'Thank you for keeping our community safe! 👍' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error reporting content' });
  }
});

//user profile route
app.get("/user-profile", ensureAuthenticated , async(req, res) => {
  const userId = req.query.user_id; // Get user ID from query parameters
  console.log("User ID:", userId); // Log the user ID for debugging 
  const result = await db.query("select email from users where id = $1", [userId]);
  res.redirect(`/professor-profile-preview?email=${result.rows[0].email}`);
});

//admin middleware
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.redirect("/admin-login?error=Admin+access+required");
};

//admin page route
app.get("/admin-page", isAdmin, (req, res) => {
  const first_name = req.user.name;
  const email = req.user.email;
  const admin_id = req.user.id;

  const userData = {
    fname: first_name,
    email: email,
    admin_id: admin_id,
  };
  res.render("admin-page", { userData });
});

//route for the dropdown menu
app.get("/get-colleges", async (req, res) => {
    const { universityCode } = req.query;
    const colleges = await db.query(
        'SELECT college_name FROM college WHERE university_code = $1', 
        [universityCode]
    );
    res.json(colleges.rows);
});

//admin page2 route
app.get("/admin-page2", isAdmin,async (req, res) => {
  const first_name = req.user.name;
  const email = req.user.email;
  const admin_id = req.user.id;
  const professors = await db.query('SELECT professor_email, professor_name FROM professor');
  const university = await db.query('SELECT university_code,university_name FROM university');
  const college = await db.query('SELECT DISTINCT college_name FROM college');

  const userData = {
    fname: first_name,
    email: email,
    admin_id: admin_id,
  };
  res.render("admin-page2", { userData , professors: professors.rows, university: university.rows, college: college.rows});
});

//admin page3 route
app.get("/admin-page3", isAdmin,async (req, res) => {
  const first_name = req.user.name;
  const email = req.user.email;
  const admin_id = req.user.id;
  const Email = await db.query('SELECT email FROM users');

  const userData = {
    fname: first_name,
    email: email,
    admin_id: admin_id,
  };
  res.render("admin-page3", { userData , Email: Email.rows});
});

//admin login page route
app.post("/login_admin",
  passport.authenticate('admin-local', {
    failureRedirect: '/admin-login?error=Invalid+credentials',
    failureFlash: true
  }),
  async (req, res) => {
    try {
      // Check for existing sessions
      const result = await db.query(
        `SELECT COUNT(*) FROM user_sessions 
         WHERE sess -> 'passport' -> 'user' ->> 'id' = $1 
         AND sid != $2`,
        [req.user.id, req.sessionID]
      );

      if (result.rows[0].count > 0) {
        req.logout((err) => {
          if (err) console.error("Logout error:", err);
          return res.redirect('/admin-login?error=Already+logged+in+elsewhere');
        });
      } else {
        req.session.save(() => {
          res.redirect("/admin-page");
        });
      }
    } catch (err) {
      console.error("Session check error:", err);
      res.redirect('/admin-login?error=Internal+error');
    }
  }
);

// Add college or university route (PostgreSQL version)
app.post('/institutions', async (req, res) => {
  uploadInstitution(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { institutionType, facultyName, universityCode } = req.body;
      const imagePath = req.file ? req.file.path.replace(/\\/g, '/').replace('public/', '') : null;

      // Validate required fields
      const missingFields = [];
      if (!institutionType) missingFields.push('institutionType');
      if (!facultyName) missingFields.push('facultyName');
      if (!universityCode) missingFields.push('universityCode');
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      if (institutionType === 'University') {
        // Check if university code exists
        const universityResult = await db.query(
          'SELECT university_code FROM university WHERE university_code = $1',
          [universityCode]
        );

        if (universityResult.rows.length > 0) {
          return res.status(409).json({ error: 'University code already exists' });
        }

        // Insert new university
        await db.query(
          'INSERT INTO university (university_code, university_name, university_image) VALUES ($1, $2, $3)',
          [universityCode, facultyName, imagePath]
        );

        return res.status(201).json({ 
          message: 'University added successfully',
          data: { universityCode, facultyName, imagePath }
        });

      } else if (institutionType === 'College') {
        // Verify parent university exists
        const universityResult = await db.query(
          'SELECT university_name FROM university WHERE university_code = $1',
          [universityCode]
        );

        if (universityResult.rows.length === 0) {
          return res.status(404).json({ error: 'Parent university not found' });
        }

        // Check for existing college
        const collegeResult = await db.query(
          'SELECT college_name FROM college WHERE university_code = $1 AND college_name = $2',
          [universityCode, facultyName]
        );

        if (collegeResult.rows.length > 0) {
          return res.status(409).json({ error: 'College already exists in this university' });
        }

        // Insert new college
        await db.query(
          'INSERT INTO college (university_code, college_name, college_image) VALUES ($1, $2, $3)',
          [universityCode, facultyName, imagePath ]
        );

        return res.status(201).json({ 
          message: 'College added successfully',
          data: { universityCode, facultyName, imagePath }
        });
      }

      return res.status(400).json({ error: 'Invalid institution type' });

    } catch (error) {
      console.error('Database Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
});

// Get reported blogs
app.get('/api/reported-blogs', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT blog_id, blog_title, blog_content, blog_image, user_fname, user_lname, user_image, timestamp_ FROM blogs WHERE is_reported = true'
    );
    console.log('Reported blogs:', result.rows); // Add this line
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

//admin invite route 
const adminInvites = new Map(); // email => { code, expiresAt }
app.post("/send-admin-invite", async (req, res) => {
  const { email } = req.body;

  // Check if email is valid
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email" });
  }

  try {
    const result = await db.query("SELECT * FROM admin WHERE admin_email = $1", [email]);
    if (result.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered as admin" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    adminInvites.set(email, { code, expiresAt });

    const link = `http://localhost:3000/admin-registration?email=${encodeURIComponent(email)}`;
const registrationLink = "http://localhost:3000/admin-regestration";
const loginLink = "http://localhost:3000/admin-login";

const message = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
    <h2 style="color: #2c3e50;">🎉 Thanks for your interest!</h2>
    <p style="font-size: 16px; color: #333;">
      We've reviewed your request and would like to invite you to register as an admin.
    </p>
    <p style="font-size: 16px; color: #333;">
      Please click the link below to complete your admin registration:
    </p>
    <p style="text-align: center; margin: 20px 0;">
      <a href="${link}" style="display: inline-block; padding: 12px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
        Complete Registration
      </a>
    </p>
    <p style="font-size: 16px; color: #333;">
      Your verification code is:
      <strong style="font-size: 18px; color: #e74c3c;">${code}</strong>
    </p>
    <p style="font-size: 14px; color: #777;">
      This code will expire in <strong>10 minutes</strong>.
    </p>
    <hr style="margin: 30px 0;">
    <p style="font-size: 14px; color: #555;">
      After completing your registration, you can log in anytime by visiting:<br>
      <a href="${loginLink}" style="color: #3498db;">${loginLink}</a> <br>
      or simply click ctrl + shift + A in the home page<br>
      to access the admin Login Page.
    </p>
    <p style="font-size: 14px; color: #999; margin-top: 20px;">
      If you received this email by mistake or don't know why you got it, you can safely ignore it.
    </p>
  </div>
`;
    await transporter.sendMail({
      to: email,
      subject: "Admin Registration Invitation",
      html: message,
      from: process.env.EMAIL_USERNAME
    });

    res.json({ success: true });

  } catch (error) {
    console.error("Error in send-admin-invite:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Verify admin code route
app.post("/verify-admin-code", (req, res) => {
    const { email, code } = req.body;
    const invite = adminInvites.get(email);

    if (!invite) {
        return res.status(400).json({ 
            success: false, 
            message: "No verification request found" 
        });
    }

    if (Date.now() > invite.expiresAt) {
        adminInvites.delete(email);
        return res.status(400).json({ 
          
            success: false, 
            message: "Verification code has expired" 
        });
    }

    if (invite.code !== code) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid verification code" 
        });
    }

    res.json({ success: true });
});

//admin registration route
app.get("/admin-registration", (req, res) => {
 res.render("admin-registration");
});

//admin create account route
app.post("/create-admin", async (req, res) => {
const { name, email, password } = req.body;

  // 1) Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email address." });
  }

  try {
    // 3) Hash password
    const hashed = await bcrypt.hash(password, saltRounds);
    // 5) Insert into admin table
    const insert = await db.query(
      `INSERT INTO admin (admin_name, admin_email, admin_password)
       VALUES ($1, $2, $3)
       RETURNING admin_id, admin_name, admin_email`,
      [ name, email, hashed ]
    );

     res.json({ 
      success: true,
      redirectUrl: "/admin-login" 
    });


  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal server error"); // Send HTML error
  }
});

//admin login route
app.get("/admin-login", (req, res) => {
  res.render("admin-login");
});

// Get all universities
app.get('/api/universities', async (req, res) => {
  try {
    const result = await db.query('SELECT university_code, university_name, university_image FROM university');
    const universities = result.rows.map(row => ({
      id: row.university_code,
      title: row.university_name,
      image: row.university_image,
      description: '' // Add description field if needed in your database
    }));
    res.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all colleges
app.get('/api/colleges', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.university_code, c.college_name, c.college_image, u.university_name 
      FROM college c
      JOIN university u ON c.university_code = u.university_code
    `);
    
    const colleges = result.rows.map(row => ({
      id: row.college_name,
      university_code: row.university_code, // Add this line
      title: row.college_name,
      image: row.college_image,
      description: `Part of ${row.university_name}`
    }));

    res.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//delete university endpoint
app.delete('/api/universities/:university_code', async (req, res) => {
    try {
        // First delete associated colleges
        await db.query(
            'DELETE FROM college WHERE university_code = $1',
            [req.params.university_code]
        );

        // Then delete the university
        const result = await db.query(
            'DELETE FROM university WHERE university_code = $1',
            [req.params.university_code]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'University not found' });
        }
        
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting university:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// College DELETE endpoint
app.delete('/api/universities/:university_code/colleges/:college_name', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM college WHERE university_code = $1 AND college_name = $2 RETURNING *',
            [req.params.university_code, req.params.college_name]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'College not found' });
        }
        
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting college:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//get all professors for deletion
app.get('/api/professors', async (req, res) => {
    try {
        const professors = await db.query('SELECT * FROM professor');
        res.json(professors.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete professor endpoint
app.delete('/api/universities/:university_code/colleges/:college_name/professors/:professor_email', async (req, res) => {
    try {
        const { university_code, college_name, professor_email } = req.params;
        await db.query(
            'DELETE FROM professor WHERE university_code = $1 AND college_name = $2 AND professor_email = $3',
            [university_code, college_name, professor_email]
        );
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get reported comments
app.get('/api/reported-comments', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, b.blog_title 
      FROM comments c
      JOIN blogs b ON c.blog_id = b.blog_id
      WHERE c.is_reported = true
      ORDER BY c.timestamp_ DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resolve report endpoint
app.put('/api/resolve-report/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const { action } = req.body;
  console.log(`Received request: type=${type}, id=${id}, action=${action}`);

  try {
    if (type === 'blog') {
      console.log(`Processing blog ${id}, action: ${action}`);
      if (action === 'accept') {
        const updateRes = await db.query(
          'UPDATE blogs SET is_reported = false WHERE blog_id = $1 RETURNING *', 
          [id]
        );
      } else {
        const deleteRes = await db.query(
          'DELETE FROM blogs WHERE blog_id = $1 RETURNING *', 
          [id]
        );
        console.log(`Deleted ${deleteRes.rowCount} blog(s)`);
      }
    } else if (type === 'comment') {
      console.log(`Processing comment ${id}, action: ${action}`);
      if (action === 'accept') {
        const updateRes = await db.query(
          'UPDATE comments SET is_reported = false WHERE comment_id = $1 RETURNING *', 
          [id]
        );
        console.log(`Updated ${updateRes.rowCount} comment(s)`);
      } else {
        const deleteRes = await db.query(
          'DELETE FROM comments WHERE comment_id = $1 RETURNING *', 
          [id]
        );
        console.log(`Deleted ${deleteRes.rowCount} comment(s)`);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT route to update a comment
app.put('/comments/:commentId',ensureAuthenticated,  async (req, res) => {
  try {
      const { commentId } = req.params;
      const { comment_text } = req.body;

      if (!comment_text || comment_text.trim() === '') {
          return res.status(400).json({ success: false, message: 'Comment text is required' });
      }
      
      // Update comment and mark as edited
      const result = await db.query(
          `UPDATE comments 
          SET comment_text = $1, 
              timestamp_ = NOW(),
              is_edited = TRUE 
          WHERE comment_id = $2 
          RETURNING *`,
          [comment_text.trim(), commentId]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Comment not found' });
      }

      res.json({ 
          success: true, 
          comment: result.rows[0],
          message: 'Comment updated successfully'
      });

  } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Server error updating comment',
          error: error.message
      });
  }
});

//professor profile preview route
app.get("/professor-profile-preview", ensureAuthenticated, async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).send("Missing email parameter");

    const professor = await db.query(
      "SELECT * FROM users WHERE email = $1", 
      [email]
    );

    if (professor.rows.length === 0) {
      return res.status(404).send("Professor not found");
    }

    const userData = {
      result: {
        fname: professor.rows[0].first_name,
        lname: professor.rows[0].last_name,
        profileimage: professor.rows[0].profileimage,
        email: professor.rows[0].email,
        discription: professor.rows[0].discription, // Note: fixed typo from "discription" to "description"
        city: professor.rows[0].city,
        country: professor.rows[0].country,
        instagram: professor.rows[0].instagram,
        facebook: professor.rows[0].facebook,
        whatsapp: professor.rows[0].whatsapp
      }
    };

    // Data for the navbar (current user)
    const data = {
      fname: req.user.first_name,
      lname: req.user.last_name,
      profileimage: req.user.profileimage,
      role: req.user.role || 'guest'
    };

    res.render("professor-profile-preview", { userData, data });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).send("Server error");
  }
});

//professor save blog route
app.post("/save-blog", uploadBlogImage.single('blog_image'),ensureAuthenticated, async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.blog_title || !req.body.blog_content) {
      return res.status(400).json({ 
        success: false,
        message: "Blog title and content are required"
      });
    }

    const { blog_title, blog_content } = req.body;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized"
      });
    }

    // Determine the image path if a file was uploaded
    let blogImagePath = null;
    if (req.file) {
      blogImagePath = '/uploads/blog_images/' + req.file.filename;
    }

    const profileUrl = `/professor-profile-preview?email=${user.email}`;
    
    const result = await db.query(
      `INSERT INTO blogs (
        user_email, user_fname, user_lname, user_image,
        blog_title, blog_content, blog_image, user_role,
        university_code, college_name, user_profile
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        user.email,
        user.first_name,
        user.last_name,
        user.profileimage,
        blog_title,
        blog_content,
        blogImagePath,
        user.role,
        user.role === 'professor' ? req.body.uni_code : 'ahu',
        user.role === 'professor' ? req.body.col_name : 'Information technology',
        profileUrl
      ]
    );

    res.json({ 
      success: true, 
      blog: result.rows[0] 
    });

  } catch (error) {
    console.error("Save blog error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal server error"
    });
  }
});

// Delete blog post route
app.delete('/blogs/:id', ensureAuthenticated, async (req, res) => {
  try {
      const blogId = req.params.id;
      // First verify the post exists and belongs to the user
      const blog = await db.query(
          'delete FROM blogs WHERE blog_id = $1 ',
          [blogId]
      );
      res.json({
          success: true,
          message: 'Blog post deleted successfully'
      });

  } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({
          success: false,
          message: 'Server error while deleting blog post'
      });
  }
});

//profile page route
app.get("/profile-page",ensureAuthenticated, (req, res) => {
  const first_name = req.user.first_name;
  const last_name = req.user.last_name;
  const country = req.user.country;
  const city = req.user.city;
  const specialization = req.user.specialization; //college
  const major = req.user.major;
  const email = req.user.email;
  const discription = req.user.discription;
  const profileimage = req.user.profileimage;
  const whatsapp = req.user.whatsapp;
  const facebook = req.user.facebook; 
  const instagram = req.user.instagram;
  const role = req.user.role;
  const degree = req.user.dregee;
  const university_name = req.user.university_name;
   const userData = {
    fname: first_name,
    lname: last_name,
    country: country,
    city: city,
    specialization: specialization,
    major: major,
    email: email, 
    discription: discription,
    profileimage: profileimage,
    whatsapp: whatsapp,
    facebook: facebook,
    instagram: instagram,
    role: role,
    degree: degree,
    university_name: university_name

  };
  if (role === 'professor') {
  res.render("professor-profile", { userData });
  }
  else{
  res.render("profile-page", { userData });
}}
);

//edit profile page route
app.get("/edit-profile", ensureAuthenticated, (req, res) => {
  const first_name = req.user.first_name;
  const last_name = req.user.last_name;
  const country = req.user.country;
  const city = req.user.city;
  const specialization = req.user.specialization; //college
  const major = req.user.major;
  const email = req.user.email;
  const discription = req.user.discription;
  const profileimage = req.user.profileimage;
  const role = req.user.role;

  const userData = {
    fname: first_name,
    lname: last_name,
    country: country,
    city: city,
    college: specialization,
    major: major,
    email: email, 
    discription: discription,
    profileimage: profileimage
  };
  if (role === 'professor') {
    res.render("professor-edit-profile", { userData });
  } else {
    res.render("edit-profile", { userData });
  }
}
);

//upload project route
app.post('/upload-project', ensureAuthenticated, (req, res) => {
  const admin_id = req.user.id;
  uploadProject(req, res, async (err) => {
    try {
      if (err) throw err;

      const { projectTitle, projectYear, projectSemester, projectDescription } = req.body;

      // Validate required fields
      if (!projectTitle || !projectYear || !projectSemester) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Process uploaded files
      const imagePaths = req.files['projectImages']?.map(file => 
        file.path.replace(/\\/g, '/').replace('public/', '/')
      ) || [];
      
      const docPaths = req.files['projectFiles']?.map(file => 
        file.path.replace(/\\/g, '/').replace('public/', '/')
      ) || [];

      // Database insertion
      const query = `
        INSERT INTO graduation_project 
        (year_, semester, tittle, brief, image, path_, added_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await db.query(query, [
        projectYear,
        projectSemester,
        projectTitle,
        projectDescription,
        imagePaths.join(','),
        docPaths.join(','),
        admin_id
      ]);

      res.json({ success: true });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to upload project' 
      });
    }
  });
});

//major plan page route
app.get("/major-plan", ensureAuthenticated, (req, res) => {
  const first_name = req.user.first_name;
  const profileimage = req.user.profileimage;
  const major = req.user.major;
  const role = req.user.role;
  const id = req.user.id;
  const userData = {
    fname: first_name,
    profileimage: profileimage,
    role: role,
    major: major,
    id : id
  };
  if (major === "Computer Science") {
    res.render("major-cs", { userData });
  } 
  else if (major === "Computer Information Systems") {
    res.render("major-mis", { userData });
  } 
  else if (major === "Software Engineering") {  
    res.render("major-sw", { userData });
  }
  else if (major === "Data Science and Artificial Intelligence") {  
    res.render("major-ai", { userData });
  }
  else {  
    res.status(404).send("Major not found");
  }
}
);

//courses page route
app.get('/api/courses', async (req, res) => {
    try {
        // Add type parameter extraction
        const { year, major = 'all', search, type } = req.query;

        // Validate year (existing code)
        if (!year || isNaN(year) || year < 1 || year > 4) {
            return res.status(400).json({ error: 'Valid year (1-4) is required' });
        }

        // Validate type (new code)
        const validTypes = ['primary_reference', 'video', 'summary'];
        const resourceType = validTypes.includes(type) ? type : null;

        // Existing search preparation
        let searchParam = null;
        if (search && search.trim() !== '') {
            searchParam = `%${search.trim().toLowerCase()}%`;
        }

        // Modified query with resource_type filter
        const queryText = `
            SELECT 
                id, subject, subject_brief, 
                file_path, image_path, year, 
                majors, resource_type
            FROM educational_resources
            WHERE 
                year = $1 AND
                (majors @> ARRAY[$2::VARCHAR] OR $2 = 'all') AND
                (LOWER(subject) LIKE $3 OR 
                 LOWER(subject_brief) LIKE $3 OR 
                 $3 IS NULL) AND
                (resource_type = $4 OR $4 IS NULL)  -- New filter
        `;

        // Add resourceType to query parameters
        const result = await db.query(queryText, [
            parseInt(year),
            major,
            searchParam,
            resourceType  // New parameter
        ]);

        // Existing response handling
        const courses = result.rows.map(course => ({
            ...course,
            image_path: course.image_path ? course.image_path.replace(/\\/g, '/') : null
        }));
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//primary references page route
app.get("/primary-references-page", ensureAuthenticated, (req, res) => {
  const first_name = req.user.first_name;
  const major = req.user.major;
  const profileimage = req.user.profileimage;
  const role = req.user.role;

  const userData = {
    fname: first_name,
    major: major,
    profileimage: profileimage,
    role: role,
   
  };
  res.render("Primary-references-page", { userData });
}
);

//getting all the users
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT email, first_name, last_name FROM users'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ban a user
app.post('/ban', async (req, res) => {
  const { email, ban_reason } = req.body;
  const ban_by = req.user.id; // Get admin's email from session

  try {
    await db.query(
      'INSERT INTO Ban_users (email, ban_reason, ban_by) VALUES ($1, $2, $3)',
      [email, ban_reason, ban_by]
    );
    await db.query(
      'delete FROM users WHERE email = $1',
      [email]);
    res.json({ message: 'User banned successfully' });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'User already banned' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all subjects route
app.get('/api/subjects', async (req, res) => {
    try {
        const result = await db.query('SELECT DISTINCT subject FROM educational_resources');
        const subjects = result.rows.map(row => row.subject);
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

//get resources by subject route
app.get('/resources/:subject', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, subject, 
       subject_brief AS "subjectBrief",
       file_path AS "filePath",
       resource_type AS "resourceType",
       image_path AS "imagePath"
       FROM educational_resources 
       WHERE subject = $1`,
      [req.params.subject]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No resources found' });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Resource fetch error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

//delete resource route
app.delete('/resources/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM educational_resources WHERE id = $1', [req.params.id]);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

//full subject content route
app.post('/add-subject',handleUploads,
  async (req, res) => {
    try {
      const documents = req.files['subjectFile'];
      const images = req.files['subjectImage'];
     
      // Validate required files
      const { subjectFile, subjectImage } = req.files;
      if (!subjectFile || !subjectImage) {
        return res.status(400).json({ 
          error: 'Both document and image files are required'
        });
      }
      const filePath = subjectFile[0].path.replace(/\\/g, '/').split('public/')[1];
      const imagePath = subjectImage[0].path.replace(/\\/g, '/').split('public/')[1];

      const majors = JSON.parse(req.body.majors); // Array from checkboxes
      const allowedMajors = [
        'computer-science',
        'software-engineering',
        'computer-information-systems',
        'artificial-intelligence'
      ];
      // Process form data
      const { 
        subjectTitle: subject,
        subjectYear: year,
        subjectDescription: subject_brief,
        contentType: resource_type // Add content type from form
      } = req.body;
      // Validate required fields
      if (!subject || !year || !majors || !subject_brief) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      const dbEntry = {
        subject,
        subject_brief,
        year: parseInt(year),
        majors: `{${majors.map(m => `"${m}"`).join(',')}}`, // Proper array formatting
        file_path: filePath,
        image_path: imagePath,
        resource_type: resource_type,
        added_by: req.user.id
      };
      dbEntry.resource_type = resource_type; // Add content type
        // Prepare database values
      // Database insertion
      const query = `
        INSERT INTO educational_resources (
          subject, subject_brief, year, majors,
          file_path, image_path, resource_type, added_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;

      const result = await db.query(query, Object.values(dbEntry));
      res.status(201).json({
        message: 'Subject created successfully',
        subjectId: result.rows[0].id
      });

    } catch (error) {
      console.error('Subject creation error:', error);
      const statusCode = error.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message || 'Internal server error'
      });
    }
  }
);

//only content upload route
app.post('/api/add-content', contentUpload.single('contentFile'), async (req, res) => {
  try {
    const { subject, contentType, description } = req.body;
    const file = req.file;
    if (!subject || !contentType || !description || !file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const allowedTypes = ['primary_reference', 'summary', 'video'];
 
    // Map frontend content types to database values
   
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
  

    const filePath = `/uploads/student_content/${file.filename}`;

    await db.query(
      `UPDATE educational_resources 
       SET subject_brief = $2, 
           file_path = $3, 
           added_by = $5 
       WHERE subject = $1 
       AND resource_type = $4`,
      [subject, description, filePath, contentType, req.user.id]
    );

    res.json({ success: true, message: 'Content added successfully' });

  } catch (error) {
    console.error('Error adding content:', error);
    res.status(500).json({ 
      error: error.message || 'Server error during content upload' 
    });
  }
});

//video page route
app.get("/video-page",ensureAuthenticated,  (req, res) => {
  const first_name = req.user.first_name;
  const major = req.user.major;
  const profileimage = req.user.profileimage;
  const role = req.user.role;
  
  const userData = {
    fname: first_name,
    major: major,
    profileimage: profileimage,
    role: role,
   
  };
  res.render("video-page", { userData });
}
);

// GET single blog endpoint (corrected)
app.get('/blogs/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM blogs WHERE blog_id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const blog = result.rows[0];
    res.json({
      blog_title: blog.blog_title,
      blog_content: blog.blog_content,
      blog_image: blog.blog_image,
      user_id: blog.user_id
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// professor research upload page route
app.get("/professor-research-upload", ensureAuthenticated, (req, res) => {
  const first_name = req.user.first_name;
  const profileimage = req.user.profileimage;
  const role = req.user.role;
  const email = req.user.email;
  const userData = {
    fname: first_name,
    profileimage: profileimage,
    role: role,
    email: email
  };
  res.render("professor-research-upload", { userData });
});

// professor research upload endpoint
app.post(
  "/professor-research-upload",ensureAuthenticated,uploadResearch.single('file'),async (req, res) => {
    try {
      const { title, status } = req.body;
      const email = req.user.email;

      // Validate required fields
      if (!title || !status || !req.file) {
        return res.status(400).send('Title, status, and file are required');
      }

      // Construct file path (relative to public directory)
      const filePath = `/uploads/research/${req.file.filename}`;

      // Insert into database
      await db.query(
        `INSERT INTO professor_research 
          (email, status, title, path)
         VALUES ($1, $2, $3, $4)`,
        [email, status, title, filePath] // Assuming 'brief' is optional
      );

      res.redirect('/professor-research'); // Redirect to research list page

    } catch (error) {
      console.error('Error uploading research:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

// PUT update blog endpoint (corrected)
app.put('/blogs/:id', uploadBlogImage.single('blog_image'), async (req, res) => {
  try {
    const blogId = req.params.id;
    const userEmail = req.user.email;

    // Verify blog ownership
    const checkResult = await db.query(
      'SELECT * FROM blogs WHERE blog_id = $1 AND user_email = $2',
      [blogId, userEmail]
    );

    if (checkResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Build updates
    const updates = {
      blog_title: req.body.blog_title,
      blog_content: req.body.blog_content
    };

    // Handle image updates
    if (req.file) {
      updates.blog_image = '/uploads/blog_images/' + req.file.filename;
    } else if (req.body.remove_image === 'true') {
      updates.blog_image = null;
    }

    // Perform update
    const updateResult = await db.query(
      `UPDATE blogs SET
        blog_title = $1,
        blog_content = $2,
        blog_image = $3
      WHERE blog_id = $4
      RETURNING *`,
      [
        updates.blog_title,
        updates.blog_content,
        updates.blog_image,
        blogId
      ]
    );

    res.json({ success: true, blog: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Faculty Member Route
app.post('/add-faculty', ensureAuthenticated, (req, res) => {
  uploadProfessor(req, res, async (err) => {
    try {
      // Check admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      // Handle Multer errors
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Validate required fields
      const {
        universityCode,
        collegeName,
        professorName,
        professorEmail,
        professorMajor,
        researchInterest,
        academicDegree
      } = req.body;

      if (!universityCode || !collegeName || !professorName || 
          !professorEmail || !professorMajor || !researchInterest) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professorEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if image was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'Professor image is required' });
      }

      // Insert into database
      const result = await db.query(
        `INSERT INTO professor (
          university_code, college_name, professor_name,
          professor_email, professor_image, professor_major,
          professor_research_interest, professor_degree, added_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          universityCode,
          collegeName,
          professorName,
          professorEmail,
          `/uploads/professors/${req.file.filename}`,
          professorMajor,
          researchInterest,
          academicDegree || null,
          req.user.id
        ]
      );

      res.json({
    success: true,
    message: 'Faculty member added successfully'
      });

    } catch (error) {
      console.error('Add faculty error:', error);
      
      // Handle database errors
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Email already exists' });
      }
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ error: 'Invalid university or college' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get single professor by email
app.get('/professors/:email', ensureAuthenticated, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM professor WHERE professor_email = $1', [req.params.email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching professor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update faculty endpoint
app.put('/update-faculty/:originalEmail', ensureAuthenticated, (req, res) => {
  uploadProfessor(req, res, async (err) => {
    try {
      // Authorization check
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      // Handle Multer errors
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const { originalEmail } = req.params;
      const { 
        professorName, 
        professorEmail, 
        professorMajor, 
        researchInterest, 
        academicDegree,
        universityCode, 
      } = req.body;

      // Validation
     if (!professorName || !professorEmail || !professorMajor || !researchInterest || !universityCode) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professorEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const updateFields = [
        'professor_name = $1',
        'professor_email = $2',
        'university_code = $3', // Add university_code
        'professor_major = $4',
        'professor_research_interest = $5',
        'professor_degree = $6'
      ];

      const values = [
        professorName,
        professorEmail,
        universityCode, // Add universityCode value
        professorMajor,
        researchInterest,
        academicDegree || null
      ];
      // Add image update if exists
      if (req.file) {
        updateFields.push('professor_image = $7');
        values.push(`/uploads/professors/${req.file.filename}`);
      }

      // Add WHERE clause parameter
      values.push(originalEmail);

      const query = `
        UPDATE professor
        SET ${updateFields.join(', ')}
        WHERE professor_email = $${values.length}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Professor not found' });
      }

      res.json({ 
        success: true, 
        message: 'Faculty member updated successfully',
        updatedEmail: result.rows[0].professor_email
      });

    } catch (error) {
      console.error('Update faculty error:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get all graduation projects
app.get('/api/graduation-projects', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT 
                id,
                year_,
                CASE 
                    WHEN semester = 'year1' THEN 'First Semester'
                    WHEN semester = 'year2' THEN 'Second Semester'
                    ELSE semester
                END AS semester,
                tittle as title,
                brief,
                image,
                path_,
                added_by
            FROM graduation_project
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//delete graduation project
app.delete('/api/graduation-projects/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { rowCount } = await db.query(
            'DELETE FROM graduation_project WHERE id = $1',
            [id]
        );
        
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//summary page route
app.get("/summary-page",ensureAuthenticated,  (req, res) => {
  const first_name = req.user.first_name;
  const major = req.user.major;
  const profileimage = req.user.profileimage;
  const role = req.user.role;
  
  const userData = {
    fname: first_name,
    major: major,
    profileimage: profileimage,
    role: role,
   
  };
  res.render("summary-page", { userData });
}
);

//after login route
app.get("/after_login", ensureAuthenticated, (req, res) => {
  const first_name = req.user.first_name;
  const major = req.user.major;
  const profileimage = req.user.profileimage;
  const role = req.user.role;
  
  const userData = {
    fname: first_name,
    major: major,
    profileimage: profileimage,
    role: role,
   
  };
  res.render("after_login", { userData });
}
);

//time-line route
app.get("/time-line", ensureAuthenticated, (req, res) => {
  const first_name = req.user.first_name;
  const major = req.user.major;
  const profileimage = req.user.profileimage;
  const role = req.user.role;
  
  const userData = {
    fname: first_name,
    major: major,
    profileimage: profileimage,
    role: role,
   
  };
  res.render("time-line", { userData });
}
);

//student projects route
app.get("/student-projects",ensureAuthenticated,  async (req, res) => {
  try {
    const year = req.query.year_;
    const first_name = req.user.first_name;
    const profileimage = req.user.profileimage;

    // Query projects for the selected year
    const result = await db.query("SELECT * FROM graduation_project WHERE year_ = $1", [year]);
    
    const userData = {
      fname: first_name,
      profileimage: profileimage,
      result: result.rows,
      role: req.user.role,
      selectedYear: year // Pass the selected year to the frontend
    };
    console.log("Requested year:", year);
    console.log("Found projects:", result.rows);  
    res.render("student-projects", { userData });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
}
);

//password page route
app.get('/password-page', (req, res) => {
  // Get the email from query parameters or session
  const email = req.query.email || req.session.email;
  
  if (!email) {
    return res.status(400).send('Email is required');
  }

  // Render the page with the email variable
  res.render('password-page', { email: email });
});

//forget password page route
app.get("/forget-password",  (req, res) => {
  let enteredemail = req.query.email || ''; // Get from query parameter
  res.render("forget-password", { enteredemail });
});

//reset password route  
app.post("/reset-password",  async (req, res) => {
  try {
    const { email } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (result.rows.length > 0) {
      // Generate a random 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the code with the email (expire after 10 minutes)
      verificationCodes[email] = {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      };
      
      // Send email with the verification code
      await sendVerificationEmail(email, verificationCode);
      
      // Return success response
      res.json({
        exists: true,
        email: email,
        messageSent: true
      });
    } else {
      res.json({
        exists: false,
        email: email
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Server error",
      exists: false
    });
  }
});

// Function to send verification email
async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4e51fd;">Password Reset Verification</h2>
        <p>We received a request to reset your password. Enter the following verification code to continue:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Add this endpoint to verify the code
app.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  
  if (!verificationCodes[email]) {
    return res.json({ valid: false, message: "verification code is incorrect" });
  }
  
  const storedData = verificationCodes[email];
  
  // Check if code has expired
  if (Date.now() > storedData.expiresAt) {
    delete verificationCodes[email]; // Clean up expired code
    return res.json({ valid: false, message: "Verification code expired" });
  }
  
  // Check if code matches
  if (storedData.code === code) {
    // Code is valid - generate a token for the reset page
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Store the token (in a real app, store in database with expiration)
    verificationCodes[email].resetToken = resetToken;
    
    return res.json({ 
      valid: true, 
      resetToken: resetToken,
      // Change this to your existing reset password page
      redirectUrl: `/password-page?token=${resetToken}&email=${encodeURIComponent(email)}`
    });
  } else {
    return res.json({ valid: false, message: "Invalid verification code" });
  }
});

//password confirmation route
app.post("/password-confirm", async (req, res) => {
  const { password } = req.body; // Changed from newPassword to password
  const email = req.query.email;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
    delete verificationCodes[email];
    res.redirect("/login");
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Error updating password" });
  }
});

//edit profile route for students
app.post("/edit-profile", ensureAuthenticated, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err); // Log the error
      res.render("edit-profile", { 
        userData: req.user, 
        error: err.message // Display the error message to the user
      });
    } else {
      console.log("Uploaded File:", req.file); // Log the uploaded file
      const { fname, lname, email, country, city, college, major, discription, whatsapp, facebook, instagram } = req.body;
      const profileimage = req.file ? `/uploads/${req.file.filename}` : req.user.profileimage;

      try {
        const result = await db.query(
          "UPDATE users SET first_name = $1, last_name = $2, email = $3, country = $4, city = $5, major = $6, discription = $7, profileimage = $8, whatsapp=$9, facebook=$10, instagram=$11 WHERE id = $12 RETURNING *",
          [fname, lname, email, country, city, major, discription, profileimage, whatsapp, facebook, instagram, req.user.id]
        );

        // Update the req.user object with the new data
        req.user = result.rows[0];

        // Re-serialize the user in the session
        req.login(req.user, (err) => {
          if (err) {
            console.error("Error re-serializing user:", err);
            return res.status(500).send("Internal Server Error");
          }
          res.redirect("/profile-page");
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Internal Server Error");
      }
    }
  });
}
);

// Edit profile route for professors
app.post("/edit-profile-professor", ensureAuthenticated, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err);
      return res.render("edit-profile", {
        userData: req.user,
        error: err.message
      });
    }

    const {
      fname,
      lname,
      email,
      country,
      city,
      college,
      major,
      discription,
      whatsapp,
      facebook,
      instagram,
      university: universityCode, // this is the code from <select>
      degree
    } = req.body;

    const profileimage = req.file ? `/uploads/${req.file.filename}` : req.user.profileimage;

    try {
      // 🔍 Get university name from code
      const uniResult = await db.query(
        "SELECT university_name FROM university WHERE university_code = $1",
        [universityCode]
      );

      if (uniResult.rows.length === 0) {
        return res.status(400).send("Invalid university code");
      }

      const universityName = uniResult.rows[0].university_name;

      // ✅ Continue with profile update
      const result = await db.query(
        `UPDATE users
         SET first_name = $1, last_name = $2, email = $3, country = $4,
             city = $5, major = $6, discription = $7, profileimage = $8,
             whatsapp = $9, facebook = $10, instagram = $11, dregee = $12,
             university_name = $13, Specialization = $14
         WHERE id = $15 RETURNING *`,
        [
          fname,
          lname,
          email,
          country,
          city,
          major,
          discription,
          profileimage,
          whatsapp,
          facebook,
          instagram,
          degree,
          universityName, // ✅ use the name instead of the code
          college,
          req.user.id
        ]
      );

      req.user = result.rows[0];

      req.login(req.user, (err) => {
        if (err) {
          console.error("Error re-serializing user:", err);
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/profile-page");
      });

    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

// Student login route with single-session check
app.post("/login_student", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      
      return res.redirect("/login?message=Invalid+credentials");
    }

    try {
      const { rows: existing } = await db.query(
        `SELECT sid 
         FROM user_sessions 
         WHERE sess -> 'passport' -> 'user' ->> 'id' = $1`,
        [user.id.toString()]
      );

      if (existing.length > 0) {
        return res.redirect("/login?message=Already+logged+in+elsewhere");
      }

      req.logIn(user, async (err) => {
        if (err) return next(err);

        await db.query(
          `DELETE FROM user_sessions 
           WHERE sess -> 'passport' -> 'user' ->> 'id' = $1 
           AND sid != $2`,
          [user.id.toString(), req.sessionID]
        );

        const role = user.role;
        if (role === "student") {
          return res.redirect("/after_login");
        } else {
          req.logout((e) => {
            if (e) console.error(e);
            return res.redirect("/login?message=Unauthorized+access");
          });
        }
      });
    } catch (dbErr) {
      console.error("DB error checking sessions:", dbErr);
      return res.status(500).send("Internal Server Error");
    }
  })(req, res, next);
});

// Professor login route with single-session enforcement
app.post("/login_prof", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.redirect("/login?message=Invalid+credentials");
    }

    try {
      const { rows: existing } = await db.query(
        `SELECT sid 
         FROM user_sessions 
         WHERE sess -> 'passport' -> 'user' ->> 'id' = $1`,
        [user.id.toString()]
      );

      if (existing.length > 0) {
        return res.redirect("/login?message=Already+logged+in+elsewhere");
      }

      // 2. ما في جلسة سابقة ⇒ نسمح بالدخول
      req.logIn(user, async (err) => {
        if (err) return next(err);

        await db.query(
          `DELETE FROM user_sessions 
           WHERE sess -> 'passport' -> 'user' ->> 'id' = $1 
           AND sid != $2`,
          [user.id.toString(), req.sessionID]
        );

        const role = user.role;
        if (role === 'professor') {
          return res.redirect("/after_login");
        } else {
          req.logout((e) => {
            if (e) console.error(e);
            return res.redirect("/login?message=Unauthorized+access+for+professors");
          });
        }
      });
    } catch (dbErr) {
      console.error("DB error checking sessions:", dbErr);
      return res.status(500).send("Internal Server Error");
    }
  })(req, res, next);
});

//primary-ref page route 
app.get("/educational-reference",ensureAuthenticated, async (req, res) => {
  try {
    const subject = req.query.subject;
    const type = req.query.type;
    if (!subject) {
      return res.status(400).send("Subject parameter is required");
    }
    else if (!type) { 
      return res.status(400).send("Type parameter is required");
    }

    // Fetch subject data
    const result = await db.query("SELECT * FROM educational_resources WHERE subject = $1 AND resource_type = $2", [subject,type]);
    
    if (result.rows.length === 0) {
      return res.status(404).send("Subject not found");
    }

    const course = result.rows[0];
    const profileimage = req.user.profileimage;   
    
    // Prepare user data
    const userData = {
      sub: course.subject,
      brief: course.subject_brief, 
      path_: course.file_path,
      role: req.user.role,
      fname: req.user.first_name,
      profileimage: profileimage,
    };
    
    res.render("educational-reference", { userData });
  } catch (error) {
    console.error("Error in /primary-references:", error);
    res.status(500).send("Internal Server Error");
  }
}
);

//google login route
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

//google callback route
app.get(
  "/auth/google/student-page",
  passport.authenticate("google", { failureRedirect: "/login?message=already_logged_in" }),
 
  (req, res) => {
    if (req.user.role === 'student') {
      res.redirect("/after_login");
    } else {
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/login?message=Unauthorized+access+for+students");
      });
    }
  }
);

//local strategy for login
app.post("/registration", async (req, res) => {
const { first_name, last_name, email, password, role, major, degree, university, college } = req.body;  
  try {
    // Check if email already exists
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (checkResult.rows.length > 0) {
      // Email exists - redirect to login with error message
      return res.status(400).json({ 
        error: "Email already exists. Please log in.",
        redirect: "/login?message=Email+already+exists.+Please+log+in."
      });
    }

    // Generate a 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    verificationcodes.set(email, {
      code: verificationCode,
      userData: { first_name, last_name, email, password, role, major, degree, university, college } ,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiration
    });

    // Send verification email
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4e51fd;">Account Verification</h2>
          <p>Thank you for registering! Please use the following verification code to activate your account:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${verificationCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't sign up for this account, you can safely ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      message: "Verification email sent. Please check your inbox." 
    });

  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new route for verification
app.post("/verify-email", async (req, res) => {
  const { email, code } = req.body; // Email declared here

  try {
    // Check if user already exists
    const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      verificationcodes.delete(email); 
      return res.status(200).json({ success: true, redirect: "/login" });
    }

    const storedData = verificationcodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ error: "No verification request found for this email." });
    }
    
    if (Date.now() > storedData.expiresAt) {
      verificationcodes.delete(email);
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }
    
    if (code !== storedData.code) {
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    // Destructure WITHOUT email (since it's already from req.body)
    const { first_name, last_name, password, role, major, degree, university, college } = storedData.userData;

    // Validate professor fields
    if (role === 'professor' && (!degree || !university || !college)) {
      return res.status(400).json({ error: "Missing required professor fields" });
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      try {
        let universityName = null;
        let collegeName = null;

        // Only fetch names for professors
        if (role === 'professor') {
          // Get university name
          const universityResult = await db.query(
            'SELECT university_name FROM university WHERE university_code = $1', 
            [university]
          );
          
          if (!universityResult.rows.length) {
            return res.status(400).json({ error: "Invalid university selection" });
          }
          universityName = universityResult.rows[0].university_name;

          // Get college name
          const collegeResult = await db.query(
            'SELECT college_name FROM college WHERE university_code = $1', 
            [university]
          );
          
          if (!collegeResult.rows.length) {
            return res.status(400).json({ error: "Invalid college selection" });
          }
          collegeName = collegeResult.rows[0].college_name;
        }

        // Insert user with all fields
        const result = await db.query(
          `INSERT INTO users 
          (first_name, last_name, email, password, specialization, major, role, 
           country, city, discription, profileimage, whatsapp, facebook, instagram,
           dregee, university_name) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
           RETURNING *`,
          [
            first_name, 
            last_name, 
            email, // Use email from req.body
            hash, 
            role === 'professor' ? collegeName : 'IT', 
            role === 'professor' ? null : major, 
            role,
            'Jordan', 
            'Amman',
            "Welcome to my profile! I'm excited to connect...",
            '/images/edit-profile/1.jpg', 
            'https://www.whatsapp.com/users/', 
            'https://www.facebook.com/users/',
            'https://www.instagram.com/users/', 
            role === 'professor' ? degree : 'Bachelor'+'s',
            role === 'professor' ? universityName : 'Al Hussein Bin Talal',
          ]
        );

        const user = result.rows[0];
        req.login(user, (err) => {
          if (err) {
            console.error("Error logging in user:", err);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          
          verificationcodes.delete(email);
          return res.status(200).json({ success: true, redirect: "/" });
        });

      } catch (err) {
        console.error("Database error during registration:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

  } catch (err) {
    console.error("Error during verification:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//student login route
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, cb) => {
    try {
      const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (valid) {
          return cb(null, user);
        }
      }

      return cb(null, false, { message: "User not found" });

    } catch (err) {
      console.error("Login error:", err);
      return cb(err);
    }
  })
);

//google strategy for login
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/student-page",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const email = profile.emails[0].value;
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        let user;
        if (result.rows.length === 0) {
          const firstName = profile.name?.givenName || "Unknown";
          const lastName = profile.name?.familyName || "Unknown";

          const newUser = await db.query(
            "INSERT INTO users (email, password, first_name, last_name, role, country, city, discription, specialization, major, profileimage, whatsapp, facebook, instagram) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *",
            [email, "google", firstName, lastName, 'student', 'Jordan', 'Amman',
              "Welcome to my profile!", 'IT', 'Computer Science', '/images/edit-profile/1.jpg',
              'https://www.whatsapp.com/users/', 'https://www.facebook.com/users/', 'https://www.instagram.com/users/']
          );
          user = newUser.rows[0];
        } else {
          user = result.rows[0];
        }

        // التحقق إذا عنده جلسة فعالة بالفعل
        const activeSession = await db.query(`
          SELECT * FROM user_sessions
          WHERE sess -> 'passport' -> 'user' ->> 'id' = $1
        `, [user.id.toString()]);

        if (activeSession.rows.length > 0) {
          // موجود جلسة قديمة => منع تسجيل الدخول
          return cb(null, false, { message: "You are already logged in elsewhere." });
        }

        return cb(null, user);

      } catch (err) {
        console.error("Google login error:", err);
        return cb(err);
      }
    }
  )
);

//admin login strategy
passport.use('admin-local', new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, cb) => {
    try {
      // 1. Check admin table
      const adminResult = await db.query(
        "SELECT * FROM admin WHERE admin_email = $1",
        [email]
      );
      
      if (adminResult.rows.length === 0) {
        return cb(null, false, { message: 'Invalid credentials' });
      }

      const admin = adminResult.rows[0];
      
      // 2. Compare plain text password (NO bcrypt)
      if (password !== admin.admin_password) {
        return cb(null, false, { message: 'Invalid credentials' });
      }

      // 3. Create user-like object
      const user = {
        id: admin.admin_id,
        email: admin.admin_email,
        name: admin.admin_name,
        role: 'admin',
        isAdmin: true
      };

      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));


// Handle 404 Not Found
app.use((req, res, next) => {
  const err = new Error("Page Not Found");
  err.status = 404;
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  
  if (statusCode >= 400 && statusCode < 500) {
    res.status(statusCode).render("400-error", {
      status: statusCode,
      message: err.message || "Client Error Occurred",
    });
  } else {
    console.error("Server Error:", err.stack); // Log server errors
    res.status(statusCode).render("500-error", {
      status: statusCode,
      message: err.message || "Internal Server Error",
    });
  }
});

passport.serializeUser((user, cb) => {
  cb(null, user);
}
);

passport.deserializeUser((user, cb) => {
  cb(null, user);
}
);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
}
);
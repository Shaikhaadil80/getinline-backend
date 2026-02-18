const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach Firebase user info
    req.user = decodedToken;

    // Find the user in our database by uid
    const dbUser = await User.findOne({ uid: decodedToken.uid });
    if (!dbUser) {
      // User exists in Firebase but not in our DB – they must complete profile
      // We'll allow this, but controllers that require a complete profile should check.
      req.dbUser = null;
    } else {
      req.dbUser = dbUser;
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
module.exports.admin = admin; // export admin instance
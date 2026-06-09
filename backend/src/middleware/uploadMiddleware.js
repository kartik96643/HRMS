const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter to allow only images (avatars)
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

// File filter for resumes (allows PDFs, Word docs, text files, and images)
const resumeFileFilter = (req, file, cb) => {
  const allowedMimetypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  if (allowedMimetypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only documents (PDF, DOC, DOCX, TXT) and images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadResume = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadToCloudinary = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Check if Cloudinary is configured (not using placeholders)
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

  const isResume = req.file.fieldname === 'resume';

  if (!isCloudinaryConfigured) {
    console.warn('Cloudinary not configured or using placeholders. Falling back to mock URL.');
    if (isResume) {
      req.cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.pdf';
    } else {
      req.cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png';
    }
    return next();
  }

  // Configure upload options
  const uploadOptions = {
    folder: isResume ? 'hr_management_resumes' : 'hr_management_avatars',
    resource_type: 'auto'
  };

  if (!isResume) {
    uploadOptions.transformation = [{ width: 300, height: 300, crop: 'thumb', gravity: 'face' }];
  }

  // Upload buffer to Cloudinary using upload_stream
  const uploadStream = cloudinary.uploader.upload_stream(
    uploadOptions,
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ message: `Failed to upload ${isResume ? 'resume' : 'profile image'} to Cloudinary`, error: error.message });
      }
      req.cloudinaryUrl = result.secure_url;
      next();
    }
  );

  uploadStream.end(req.file.buffer);
};

module.exports = { upload, uploadResume, uploadToCloudinary };


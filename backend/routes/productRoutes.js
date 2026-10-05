const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const err = new Error('Only image files are allowed');
      err.status = 400;
      cb(err, false);
    }
  },
});


router.get('/', getProducts);
router.get('/:id', getProductById);


router.post('/', authMiddleware, adminMiddleware, upload.single('image'), createProduct);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;

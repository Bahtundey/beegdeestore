const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../config/cloudinary');

const CLOUDINARY_FOLDER = 'ecommerce/products';


async function uploadProductImage(buffer) {
  try {
    return await uploadImage(buffer, CLOUDINARY_FOLDER);
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    const error = new Error('Image upload failed. Please try again.');
    error.status = 500;
    throw error;
  }
}


async function safeDeleteImage(publicId) {
  try {
    await deleteImage(publicId);
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
  }
}


function validateProductInput(fields) {
  const errors = [];
  const { name, description, price, category, stock } = fields;

  if (name === undefined || !String(name).trim()) errors.push('Name is required');
  if (description === undefined || !String(description).trim()) errors.push('Description is required');
  if (category === undefined || !String(category).trim()) errors.push('Category is required');

  const p = Number(price);
  if (price === undefined || price === '' || Number.isNaN(p) || p < 0) {
    errors.push('Price must be a non-negative number');
  }

  const s = Number(stock);
  if (stock === undefined || stock === '' || !Number.isInteger(s) || s < 0) {
    errors.push('Stock must be a non-negative whole number');
  }

  return errors;
}


const getProducts = async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: products });
};


const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.status(200).json({ success: true, data: product });
};


const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock } = req.body;

    const errors = validateProductInput(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }

    let image = '';
    let cloudinaryPublicId = '';

    if (req.file) {
      const result = await uploadProductImage(req.file.buffer);
      image = result.secure_url;
      cloudinaryPublicId = result.public_id;
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category: category.trim(),
      stock: Number(stock),
      image,
      cloudinaryPublicId,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};


const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, price, category, stock } = req.body;

    if (price !== undefined && price !== '' && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
    }
    if (stock !== undefined && stock !== '' && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative whole number' });
    }

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined && price !== '') product.price = Number(price);
    if (category !== undefined) product.category = category.trim();
    if (stock !== undefined && stock !== '') product.stock = Number(stock);

    if (req.file) {
      const result = await uploadProductImage(req.file.buffer);
      
      if (product.cloudinaryPublicId) {
        await safeDeleteImage(product.cloudinaryPublicId);
      }
      product.image = result.secure_url;
      product.cloudinaryPublicId = result.public_id;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};


const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.cloudinaryPublicId) {
      await safeDeleteImage(product.cloudinaryPublicId);
    }

    await product.deleteOne();

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };

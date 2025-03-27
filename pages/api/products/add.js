import dbConnect from '../../../lib/dbConnect';
import Product from '../../../models/Product';
import ProductHistory from '../../../models/ProductHistory';
import { authMiddleware } from '../../../middleware/authMiddleware';

export default async function handler(req, res) {
  await dbConnect();

  const auth = await authMiddleware(req);
  if (!auth.success) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (auth.user.email === 'demo@example.com') {
    return res.status(403).json({ 
      success: false, 
      message: 'You cannot add products in demo account. Please create a personal account to continue.' 
    });
  }

  try {
    // Create the new product
    const product = await Product.create({
      ...req.body,
      user: auth.user._id,  // Associate the product with the authenticated user
    });

    // Create the ProductHistory entry for the "add" action
    const productHistory = new ProductHistory({
      action: 'add', // Action type: add
      productName: product.name, // Name of the product added
      changes: `Product added with category: ${product.category}, price: ${product.price}, quantity: ${product.quantity}`, // Description of the action
      userId: auth.user._id, // ID of the user who added the product
    });

    // Save the product history to the database
    await productHistory.save();
    console.log('Product added successfully', productHistory);

    // Return the newly created product along with success response
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A product with this barcode already exists for this user.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
}

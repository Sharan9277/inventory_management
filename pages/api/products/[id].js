import dbConnect from '../../../lib/dbConnect';
import Product from '../../../models/Product';
import { authMiddleware } from '../../../middleware/authMiddleware';
import ProductHistory from '../../../models/ProductHistory';

export default async function handler(req, res) {
  await dbConnect();

  const auth = await authMiddleware(req);
  if (!auth.success) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const product = await Product.findOne({ _id: id, user: auth.user._id });

        if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;
    case 'PUT':
      try {
        if (auth.user.email === 'demo@example.com') {
          return res.status(403).json({ 
            success: false, 
            message: 'You cannot modify products in demo account. Please create a personal account to continue.' 
          });
        }

        const product = await Product.findOneAndUpdate(
          { _id: id, user: auth.user._id },
          req.body,
          { new: true, runValidators: true }
        );

        const productHistory = new ProductHistory({
          action: 'update',
          productName: product.name,
          changes: `Product updated with new category: ${product.category}, price: ${product.price}, quantity: ${product.quantity}`,
          userId: auth.user._id, // Assuming you have user info from authentication middleware
        });
  
        await productHistory.save();
        console.log('Product updated successfully', productHistory);

        if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;
    case 'DELETE':
      try {
        if (auth.user.email === 'demo@example.com') {
          return res.status(403).json({ 
            success: false, 
            message: 'You cannot delete products in demo account. Please create a personal account to continue.' 
          });
        }
        
        const product = await Product.findOneAndDelete({ _id: id, user: auth.user._id });

        const productHistory = new ProductHistory({
          action: 'delete',
          productName: product.name,
          changes: `Product deleted`,
          userId: auth.user._id, // Assuming you have user info from authentication middleware
        });
  
        await productHistory.save();
        console.log('Product deleted successfully', productHistory);

        if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;
    default:
      res.status(400).json({ success: false, message: 'Invalid method' });
      break;
  }
}
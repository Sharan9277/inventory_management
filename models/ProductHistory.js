import mongoose from 'mongoose';

const ProductHistorySchema = new mongoose.Schema({
    action: { 
      type: String, 
      required: true, 
      enum: ['add', 'update', 'delete'] 
    },
    productName: { 
      type: String, 
      required: true 
    },
    changes: { 
      type: String, 
      required: true 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  });
  
  export default mongoose.models.ProductHistory || mongoose.model('ProductHistory', ProductHistorySchema);
  
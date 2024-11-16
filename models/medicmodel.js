// const mongoose = require('mongoose');

// const itemSchema = new mongoose.Schema({
//   Medicine: String,
//   Availablestock: Number,
//   Time: String,
// });

// const Product = mongoose.model('Product', itemSchema);

// module.exports = Product;


const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')// imported the mongoose-paginate


const productSchema = new mongoose.Schema({
  Medicine: {
        type: String,
        required: [true, 'Medicine is required'],
        maxlength: [500, 'Medicine cannot exceed 500 characters']
    },
    Availablestock: {
        type: Number,
        required: [true, 'Availablestock is required']
    },
    addedAt: {
      type: Date,
      default: Date.now
    } ,
    createdBy: {
      type: String,
      required:[true,'Email required']
    }  
});

productSchema.plugin(mongoosePaginate);// use the plugin
const Product = mongoose.model('Product', productSchema);

module.exports = Product;

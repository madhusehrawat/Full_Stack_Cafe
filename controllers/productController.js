const Product = require("../models/Product");
const Cart = require("../models/Cart");

// GET /products
exports.getProductsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // <--- SET TO 8 PRODUCTS PER PAGE
    const search = req.query.search || "";
    const category = req.query.category || "";

    const filter = { isActive: { $ne: false } };
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;

    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    
    const items = await Product.find(filter)
      .skip((page - 1) * limit) // Skips previous page items
      .limit(limit);            // Takes only 8 items

    res.render("products", {
      items,
      search,
      category,
      currentPage: page,
      totalPages: totalPages || 1, 
      user: req.user || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.postAddProduct = async (req, res) => {
    try {
        // 1. Destructure text fields from req.body
        const { name, price, category, description, isActive } = req.body;

        // 2. Get the filename from req.file (provided by Multer)
        // If no file was uploaded, you can provide a default string
        const imagePath = req.file ? req.file.filename : 'default-food.png';

        // 3. Create the new product document
        const newProduct = new Product({
            name,
            price: Number(price),
            category,
            description,
            // Checkbox logic: returns 'on' if checked
            isActive: isActive === 'on', 
            image: imagePath // This saves "image-12345.jpg" to MongoDB
        });

        // 4. Save to Database
        await newProduct.save();

        // 5. Success! Redirect back to the dashboard
        res.redirect('/admin/dashboard?success=product-added');
        
    } catch (err) {
        console.error("Error saving product:", err);
        res.status(500).send("Failed to add product. Make sure all fields are valid.");
    }
};

// GET: Render the Add Product Form
exports.getAddProductPage = (req, res) => {
    res.render("addProduct", { user: req.user });
};
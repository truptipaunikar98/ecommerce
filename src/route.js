const express = require("express");
const router = express.Router();
const userController = require("./controller/userController");
const bannerController = require("./controller/bannerController");
const venderController = require("./controller/venderController");
const driverController = require("./controller/driverController");
const categoryController = require("./controller/categoryController");
const subCategory = require("./controller/subCategoryController");
const brandController = require("./controller/brandController");
const attributeSetController = require("./controller/attributeSetController");
const attributeController = require("./controller/attributeController");
const adminController = require("./controller/adminController");
const productController = require("./controller/productController");
const addressController = require("./controller/addressController");
const tagController = require("./controller/tagController");
const taxController = require("./controller/taxController");
const locationController = require("./controller/locationController");
const productTypeController = require("./controller/productTypeController");
const productManufactureLocationController = require("./controller/productManufactureLocationController");
const zipcodeController = require("./controller/zipcodeController");
const productRatingController = require("./controller/productRatingController");
const bookingController = require("./controller/bookingController");

router.use("/user", userController);
router.use("/driver", driverController);
router.use("/admin", adminController);
router.use("/banner", bannerController);
router.use("/vender", venderController);
router.use("/category", categoryController);
router.use("/sub-category", subCategory);
router.use("/brand", brandController);
router.use("/attribute-set", attributeSetController);
router.use("/attribute", attributeController);
router.use("/product", productController);
router.use("/address", addressController);
router.use("/tag", tagController);
router.use("/tax", taxController);
router.use("/location", locationController);
router.use("/product-type", productTypeController);
router.use("/product-manufacture-location", productManufactureLocationController);
router.use("/zipcode", zipcodeController);
router.use("/rating", productRatingController);
router.use("/booking", bookingController);


module.exports = router;
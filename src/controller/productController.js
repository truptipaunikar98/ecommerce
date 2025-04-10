const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Product = require("../model/product.Schema");
const productController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const fs = require("fs");
const path = require("path");
// productController.post(
//   "/create",
//   upload.fields([
//     { name: "productHeroImage", maxCount: 5 },
//     { name: "productGallery", maxCount: 5 },
//   ]),
//   async (req, res) => {
//     try {
//       let productHeroImage = [];
//       let productGallery = [];

//       if (req.files["productHeroImage"]) {
//         for (let file of req.files["productHeroImage"]) {
//           let result = await cloudinary.uploader.upload(file.path);
//           productHeroImage.push(result.url);
//         }
//       }

//       if (req.files["productGallery"]) {
//         for (let file of req.files["productGallery"]) {
//           let result = await cloudinary.uploader.upload(file.path);
//           productGallery.push(result.url);
//         }
//       }

//       const productData = {
//         ...req.body,
//         productHeroImage,
//         productGallery,
//       };

//       const productCreated = await Product.create(productData);
//       sendResponse(res, 200, "Success", {
//         message: "Product created successfully!",
//         data: productCreated,
//         statusCode: 200,
//       });
//     } catch (error) {
//       console.error(error);
//       sendResponse(res, 500, "Failed", {
//         message: error.message || "Internal server error",
//         statusCode: 500,
//       });
//     }
//   }
// );

productController.post("/create", async (req, res) => {
  try {
    const productData = {
      ...req.body,
    };

    const productCreated = await Product.create(productData);
    sendResponse(res, 200, "Success", {
      message: "Product created successfully!",
      data: productCreated,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});


productController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
    } = req.body;

    const query = {};
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const productList = await Product.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      .populate({
        path: "categoryId",
        select: "name description", 
      })
      .populate({
        path: "createdBy",
        select: "name", 
      });
    const totalCount = await Product.countDocuments({});
    const activeCount = await Product.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Product list retrieved successfully!",
      data: productList,
      documentCount: {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

productController.put("/update", 
  async (req, res) => {
    try {
      const id = req.body.id;
      const productData = await Product.findById(id);
      if (!productData) {
        return sendResponse(res, 404, "Failed", {
          message: "Product not found",
        });
      }
      let updateData = { ...req.body };
      const updatedProductData = await Product.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
        }
      );
      sendResponse(res, 200, "Success", {
        message: "Product updated successfully!",
        data: updatedProductData,
        statusCode: 200,
      });
      
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);

productController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    // Find the category by ID
    const productItem = await Product.findById(id);
    if (!productItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
      });
    }
    // Delete the category from the database
    await Product.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Product deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

productController.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id });
    if (product) {
      return sendResponse(res, 200, "Success", {
        message: "Product details fetched  successfully",
        data: product,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

productController.put("/update/hero-image", upload.single("productHeroImage"), async (req, res) => {
  try {
    const id = req.body.id;
    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 403
      });
    }
    let updatedData = { ...req.body };
    if (req.file) {
      
      const productHeroImage = await cloudinary.uploader.upload(req.file.path);
      updatedData.productHeroImage = productHeroImage.url;
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true, 
    });
    sendResponse(res, 200, "Success", {
      message: "Product hero image updated successfully!",
      data: updatedProduct,
      statusCode: 200
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});
productController.put("/update/add-product-gallery", upload.array("images"), async (req, res) => {
  try {
    const id = req.body.id;

    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 403,
      });
    }

    if (!req.files || req.files.length === 0) {
      return sendResponse(res, 400, "Failed", {
        message: "At least one image file is required",
        statusCode: 400,
      });
    }

    // Upload all images to Cloudinary
    const uploadedUrls = [];
    for (const file of req.files) {
      const uploadedImage = await cloudinary.uploader.upload(file.path);
      uploadedUrls.push(uploadedImage.secure_url);
    }

    // Push all URLs into productGallery
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $push: { productGallery: { $each: uploadedUrls } } },
      { new: true }
    );

    sendResponse(res, 200, "Success", {
      message: "Product gallery images added successfully!",
      data: updatedProduct,
      statusCode: 200,
    });

  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});
productController.post("/delete/product-gallery", async (req, res) => {
  try {
    const { id, index } = req.body;

    if (!id || index === undefined) {
      return sendResponse(res, 400, "Failed", {
        message: "Product ID and index are required",
        statusCode: 400,
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404,
      });
    }

    const gallery = product.productGallery;
    
    if (!gallery || index < 0 || index >= gallery.length) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid image index",
        statusCode: 400,
      });
    }

    const imageUrl = gallery[index];

    // Delete from Cloudinary if image is stored there
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
      } else {
        console.log("Image deleted from Cloudinary:", result);
      }
    });

    // Remove the image from productGallery
    gallery.splice(index, 1);
    product.productGallery = gallery;
    const updatedProduct = await product.save();

    sendResponse(res, 200, "Success", {
      message: "Gallery image deleted successfully",
      data: updatedProduct,
      statusCode: 200,
    });

  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal Server Error",
      statusCode: 500,
    });
  }
});


productController.put("/update-video", upload.single("productVideo"), async (req, res) => {
  try {
    const { id } = req.body;

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404
      });
    }

    // Initialize updatedData
    let updatedData = {};

    // Check if video file is uploaded
    if (req.file) {
      // Validate file type
      if (!req.file.mimetype.startsWith("video/")) {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        return sendResponse(res, 400, "Failed", {
          message: "Only video files are allowed",
          statusCode: 400
        });
      }

      // Upload to Cloudinary with resource_type set to "video"
      const productVideo = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video"
      });

      // Set video URL in update
      updatedData.productVideo = productVideo.url;

      // Delete local file after upload
      fs.unlinkSync(req.file.path);
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true
    });

    // Send success response
    sendResponse(res, 200, "Success", {
      message: "Product video updated successfully!",
      data: updatedProduct,
      statusCode: 200
    });

  } catch (error) {
    console.error("Update video error:", error.message);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});

module.exports = productController;

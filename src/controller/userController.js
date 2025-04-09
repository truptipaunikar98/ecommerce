const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const User = require("../model/user.Schema");
const Product = require("../model/product.Schema");
const Category = require("../model/category.Schema");
const SubCategory = require("../model/subCategory.Schema");
const userController = express.Router();
const axios = require("axios");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

userController.post("/send-otp", async (req, res) => {
  try {
    const { phone, ...otherDetails } = req.body;
    // Check if the phone number is provided
    if (!phone) {
      return sendResponse(res, 400, "Failed", {
        message: "Phone number is required.",
        statusCode: 400,
      });
    }
    // Generate OTP
    const phoneOtp = generateOTP();

    // Check if the user exists
    let user = await User.findOne({ phone });

    if (!user) {
      // Create a new user with the provided details and OTP
      user = await User.create({
        phone,
        phoneOtp,
        ...otherDetails,
      });

      // Generate JWT token for the new user
      const token = jwt.sign(
        { userId: user._id, phone: user.phone },
        process.env.JWT_KEY
      );
      // Store the token in the user object or return it in the response
      user.token = token;
      user = await User.findByIdAndUpdate(user.id, { token }, { new: true });
    } else {
      // Update the existing user's OTP
      user = await User.findByIdAndUpdate(user.id, { phoneOtp }, { new: true });
    }
    const appHash = "ems/3nG2V1H"; // Apne app ka actual hash yahan dalein

    // Properly formatted OTP message for autofill
    const otpMessage = `<#> ${phoneOtp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

    let optResponse = await axios.post(
      `https://api.authkey.io/request?authkey=${
        process.env.AUTHKEY_API_KEY
      }&mobile=${phone}&country_code=91&sid=${
        process.env.AUTHKEY_SENDER_ID
      }&company=Acediva&otp=${phoneOtp}&message=${encodeURIComponent(
        otpMessage
      )}`
    );

    if (optResponse?.status == "200") {
      return sendResponse(res, 200, "Success", {
        message: "OTP send successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Unable to send OTP",
        statusCode: 200,
      });
    }
  } catch (error) {
    console.error("Error in /send-otp:", error.message);
    // Respond with failure
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
    });
  }
});

userController.post(
  "/sign-up",
  upload.fields([{ name: "profilePic", maxCount: 1 }]),
  async (req, res) => {
    try {
      // Check if the phone number is unique
      const user = await User.findOne({ phone: req.body.phone });
      if (user) {
        return sendResponse(res, 400, "Failed", {
          message: "User is already registered.",
          statusCode: 400,
        });
      }

      // Generate OTP
      const otp = generateOTP();

      // Upload images to Cloudinary
      let profilePic;

      if (req.files["profilePic"]) {
        let image = await cloudinary.uploader.upload(
          req.files["profilePic"][0].path
        );
        profilePic = image.url;
      }

      // Create a new user with provided details
      let newUser = await User.create({
        ...req.body,
        phoneOtp: otp,
        profilePic,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser._id, phone: newUser.phone },
        process.env.JWT_KEY
      );

      // Store the token in the user object or return it in the response
      newUser.token = token;
      const updatedUser = await User.findByIdAndUpdate(
        newUser._id,
        { token },
        { new: true }
      );

      // OTP message for autofill
      const appHash = "ems/3nG2V1H"; // Replace with your actual hash
      const otpMessage = `<#> ${otp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

      let otpResponse = await axios.post(
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${req.body.phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${otp}&message=${encodeURIComponent(otpMessage)}`
      );

      if (otpResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP sent successfully",
          data: updatedUser,
          statusCode: 200,
        });
      } else {
        return sendResponse(res, 422, "Failed", {
          message: "Unable to send OTP",
          statusCode: 200,
        });
      }
    } catch (error) {
      console.error("Error in /sign-up:", error.message);
      return sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error.",
      });
    }
  }
);

userController.post("/otp-verification", async (req, res) => {
  try {
    const { phone, phoneOtp } = req.body;
    const user = await User.findOne({ phone, phoneOtp });
    if (user) {
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { isPhoneVerified: true, profileStatus: "completed" },
        { new: true }
      );
      return sendResponse(res, 200, "Success", {
        message: "Otp verified successfully",
        data: updatedUser,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Wrong OTP",
        statusCode: 422,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

userController.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone, password });
    if (user) {
      return sendResponse(res, 200, "Success", {
        message: "User logged in successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

userController.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (user) {
      const otp = generateOTP();
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { phoneOtp: otp },
        { new: true }
      );

      // OTP message for autofill
      const appHash = "ems/3nG2V1H"; // Replace with your actual hash
      const otpMessage = `<#> ${otp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

      let otpResponse = await axios.post(
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${req.body.phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${otp}&message=${encodeURIComponent(otpMessage)}`
      );

      if (otpResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP sent successfully",
          data: updatedUser,
          statusCode: 200,
        });
      } else {
        return sendResponse(res, 422, "Failed", {
          message: "Unable to send OTP",
          statusCode: 200,
        });
      }
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Phone number is not registered",
        statusCode: 422,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

userController.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id });
    if (user) {
      return sendResponse(res, 200, "Success", {
        message: "User details fetched  successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
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

userController.post("/add-to-cart/:id", async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { userId: currentUserId } = req.body;

    if (!productId || !currentUserId) {
      return sendResponse(res, 422, "Failed", {
        message: "Missing productId or userId!",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendResponse(res, 400, "Failed", {
        message: "Product not found!",
      });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    // Ensure cartItems is an array
    if (!Array.isArray(user.cartItems)) {
      user.cartItems = [];
    }

    // Check if product already exists in cart
    const cartItemIndex = user.cartItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    let updateQuery;
    let message;

    if (cartItemIndex !== -1) {
      const currentQuantity = user.cartItems[cartItemIndex].quantity;

      // Check if adding one more exceeds stock
      if (currentQuantity + 1 > product.stockQuantity) {
        return sendResponse(res, 400, "Failed", {
          message: `Only ${
            product.stockQuantity - currentQuantity
          } item(s) left in stock for this product.`,
        });
      }

      // If stock is available, increment quantity
      updateQuery = {
        $set: {
          [`cartItems.${cartItemIndex}.quantity`]: currentQuantity + 1,
        },
      };
      message = "Item quantity incremented successfully";
    } else {
      // If new product being added, make sure there's at least 1 in stock
      if (product.stockQuantity < 1) {
        return sendResponse(res, 400, "Failed", {
          message: "This product is currently out of stock.",
        });
      }

      updateQuery = {
        $push: { cartItems: { productId, quantity: 1 } },
      };
      message = "Item added successfully to cart";
    }

    await User.findByIdAndUpdate(currentUserId, updateQuery, { new: true });

    sendResponse(res, 200, "Success", { message });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.post("/remove-from-cart/:id", async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { userId: currentUserId } = req.body;

    if (!productId || !currentUserId) {
      return sendResponse(res, 422, "Failed", {
        message: "Missing productId or userId!",
      });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return sendResponse(res, 400, "Failed", { message: "User not found!" });
    }

    // Check if product exists in cart
    const cartItem = user.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return sendResponse(res, 400, "Failed", { message: "Item not in cart!" });
    }

    let updateQuery, message;

    if (cartItem.quantity > 1) {
      // Reduce quantity if more than 1
      updateQuery = {
        $set: {
          "cartItems.$[elem].quantity": cartItem.quantity - 1,
        },
      };
      message = "Item quantity decreased";

      // Update user document with array filter
      await User.findByIdAndUpdate(currentUserId, updateQuery, {
        new: true,
        arrayFilters: [{ "elem.productId": productId }],
      });
    } else {
      // Remove item from cart if quantity is 1
      updateQuery = {
        $pull: { cartItems: { productId } },
      };
      message = "Item removed from cart";

      // Update user document without array filter
      await User.findByIdAndUpdate(currentUserId, updateQuery, { new: true });
    }

    sendResponse(res, 200, "Success", { message });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return sendResponse(res, 422, "Failed", {
        message: "User ID is required!",
      });
    }

    const user = await User.findById(userId).populate({
      path: "cartItems.productId",
      populate: { path: "categoryId" },
    });

    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    let totalAmount = 0;

    const cartDetails = user.cartItems.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const priceToUse = product.discountedPrice ?? product.price;
      const itemTotal = priceToUse * quantity;

      totalAmount += itemTotal;

      return {
        _id: product._id,
        name: product.name,
        productHeroImage: product.productHeroImage,
        productGallery: product.productGallery,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId,
        price: product.price,
        discountedPrice: product.discountedPrice,
        description: product.description,
        codAvailable: product.codAvailable,
        isActive: product.isActive,
        updatedAt: product.updatedAt,
        createdAt: product.createdAt,
        quantity,
        itemTotal,
      };
    });

    sendResponse(res, 200, "Success", {
      message: "Cart items retrieved successfully",
      cartItems: cartDetails,
      totalAmount,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.post("/add-to-wishlist/:id", async (req, res) => {
  try {
    if (!req.params.id) {
      return sendResponse(res, 422, "Failed", {
        message: "Params not found!",
      });
    }

    const productId = req.params.id;
    const currentUserId = req.body.userId;

    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return sendResponse(res, 400, "Failed", {
        message: "Product not found!",
      });
    }
    const user = await User.findOne({ _id: currentUserId });
    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    let message, updateQuery;
    if (user.wishListItems.includes(productId)) {
      updateQuery = { $pull: { wishListItems: productId } };
      message = "Item removed successfully";
    } else {
      updateQuery = { $push: { wishListItems: productId } };
      message = "Item added successfully";
    }

    // Update the post document with the new array
    await User.findOneAndUpdate({ _id: currentUserId }, updateQuery);

    sendResponse(res, 200, "Success", {
      message: message,
    });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.get("/wishlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return sendResponse(res, 422, "Failed", {
        message: "User ID is required!",
      });
    }

    const user = await User.findById(userId).populate("wishListItems");

    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    sendResponse(res, 200, "Success", {
      message: "Wishlist items retrieved successfully",
      data: user.wishListItems, // Returns the list of products in the wishlist
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.put("/update", upload.single("profilePic"), async (req, res) => {
  try {
    const id = req.body.id;
    const userData = await User.findById(id);
    if (!userData) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
      });
    }
    let updatedData = { ...req.body };
    if (req.file) {
      const profilePic = await cloudinary.uploader.upload(req.file.path);
      updatedData.profilePic = profilePic.url;
    }
    const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });
    sendResponse(res, 200, "Success", {
      message: "User updated successfully!",
      data: updatedUser,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.post("/home-details",  async (req, res) => {
  try {
    const homeCategory = await Category.find({})
    const bestSellerSubCategory = await SubCategory.find({})
    const homeSubCategory = await SubCategory.find({})
    const trendingProducts = await Product.find({})
    const bestSellerProducts = await Product.find({})
    sendResponse(res, 200, "Success", {
      message: "Home page data fetched successfully!",
      data: homeCategory, bestSellerSubCategory, homeSubCategory, trendingProducts,bestSellerProducts,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

module.exports = userController;

const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const Vender = require("../model/vender.Schema");
const Product = require("../model/product.Schema");
const venderController = express.Router();
const axios = require("axios");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

venderController.post("/sign-up", upload.single("profilePic"), async (req, res) => {
  try {
    // Check if the phone number is unique
    const user = await Vender.findOne({ phone: req.body.phone });
    if (user) {
      return sendResponse(res, 400, "Failed", {
        message: "Vendor is already registered.",
        statusCode: 400,
      });
    }

    // Generate OTP
    const otp = generateOTP();

    let profilePic;

    if (req.file) {
      let profilePicData = await cloudinary.uploader.upload(
        req.file.path,
        function (err, result) {
          if (err) {
            return err;
          } else {
            return result;
          }
        }
      );
      profilePic =  profilePicData.url ;
    }

    // Create a new user with provided details
    let newVender = await Vender.create({
      ...req.body,
      phoneOtp: otp,
      profilePic :profilePic
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newVender._id, phone: newVender.phone },
      process.env.JWT_KEY
    );

    // Store the token in the user object or return it in the response
    newVender.token = token;
    const updatedVender = await Vender.findByIdAndUpdate(
      newVender._id,
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
        data: updatedVender,
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
});

venderController.post("/otp-verification", async (req, res) => {
  try {
    const { phone, phoneOtp } = req.body;
    const user = await Vender.findOne({ phone, phoneOtp });
    if (user) {
      const updatedVender = await Vender.findByIdAndUpdate(
        user._id,
        { isPhoneVerified: true,  profileStatus: req?.body?.isforgetPassword ? user?.profileStatus:  "otpVerified" },
        { new: true }
      );
      return sendResponse(res, 200, "Success", {
        message: "Otp verified successfully",
        data: updatedVender,
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

venderController.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await Vender.findOne({ phone, password });
    if (user) {
      return sendResponse(res, 200, "Success", {
        message: "Vender logged in successfully",
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

venderController.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await Vender.findOne({ phone });
    if (user) {
      const otp = generateOTP();
      const updatedVender = await Vender.findByIdAndUpdate(
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
          data: updatedVender,
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

venderController.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const vender = await Vender.findOne({ _id: id });
    if (vender) {
      return sendResponse(res, 200, "Success", {
        message: "Vender details fetched  successfully",
        data: vender,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Vender not found",
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

venderController.put(
  "/update",
  upload.fields([
    { name: "bussinessLicense", maxCount: 1 },
    { name: "storeLogo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "passBook", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const id = req.body.id;
      const venderData = await Vender.findById(id);
      if (!venderData) {
        return sendResponse(res, 404, "Failed", {
          message: "Vender not found",
        });
      }

      let updateData = { ...req.body };

      if (req.file || req.files) {
        if (req.files["bussinessLicense"]) {
          const image = await cloudinary.uploader.upload(
            req.files["bussinessLicense"][0].path
          );
          updateData = { ...updateData, bussinessLicensee: image.url };
        }

        if (req.files["storeLogo"]) {
          const image = await cloudinary.uploader.upload(
            req.files["storeLogo"][0].path
          );
          updateData = { ...updateData, storeLogo: image.url };
        }

        if (req.files["signature"]) {
          const image = await cloudinary.uploader.upload(
            req.files["signature"][0].path
          );
          updateData = { ...updateData, signature: image.url };
        }

        if (req.files["aadharCard"]) {
          const image = await cloudinary.uploader.upload(
            req.files["aadharCard"][0].path
          );
          updateData = { ...updateData, aadharCard: image.url };
        }

        if (req.files["passBook"]) {
          const image = await cloudinary.uploader.upload(
            req.files["passBook"][0].path
          );
          updateData = { ...updateData, passBook: image.url };
        }

        if (req.files["profilePic"]) {
          const image = await cloudinary.uploader.upload(
            req.files["profilePic"][0].path
          );
          updateData = { ...updateData, profilePic: image.url };
        }
      }

      const updatedUserData = await Vender.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      sendResponse(res, 200, "Success", {
        message: "Vendor updated successfully!",
        data: updatedUserData,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error.",
      });
    }
  }
);




venderController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vender = await Vender.findById(id);
    if (!vender) {
      return sendResponse(res, 404, "Failed", {
        message: "Vender not found",
      });
    }
    await Vender.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Vender deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

venderController.post("/product-list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      venderId
    } = req.body;

    const query = {createdBy: venderId};
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
        path: "categoryId", // Field to populate
        select: "name description", // Specify the fields to retrieve from the category collection
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

venderController.post("/list", async (req, res) => {
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
    if (searchKey) {
      query.$or = [
        { firstName: { $regex: searchKey, $options: "i" } },
        { lastName: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
      ];
    }

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const venderList = await Vender.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      
    const totalCount = await Vender.countDocuments({});
    const activeCount = await Vender.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Vender list retrieved successfully!",
      data: venderList,
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

module.exports = venderController;

const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const driverSchema = mongoose.Schema({
  firstName: {
    type: String,
  },
  isFirstNameApproved: {
    type: Boolean,
    default: false,
  },
  firstNameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  lastName: {
    type: String,
  },
  isLastNameApproved: {
    type: Boolean,
    default: false,
  },
  lastNameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  email: {
    type: String,
  },
  emailRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  isEmailApproved: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailOtp: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  phoneOtp: {
    type: String,
  },
  phoneRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneApproved: {
    type: Boolean,
    default: false,
  },
  isProfilePicApproved: {
    type: Boolean,
    default: false,
  },
  profilePic: {
    type: String,
  },
  profilePicRejectReason: {
    type: String,
    default: "waiting for approval",
  },

  countryCode: {
    type: String,
    default: "91",
  },
  profileStatus: {
    type: String,
    default: "incompleted",
    required: true,
    enum: ["incompleted", "completed", "approved", "rejected", "reUploaded"],
  },
  dlFrontImage: {
    type: String,
    required: true,
  },
  dlFrontImageRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  isDlFrontImageApproved: {
    type: Boolean,
    default: false,
  },
  dlBackImage: {
    type: String,
    // required: true,
  },
  dlBackImageRejectReason: {
    type: String,
    default: "waiting for approval", 
  },
  isDlBackImageApproved: {
    type: Boolean,
    default: false,
  },
  pincode: {
    type: String,
    required: true,
  },
  pincodeRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  isPincodeApproved: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    required: true,
  },
  addressRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  isAddressApproved: {
    type: Boolean,
    default: false,
  },
  lat: {
    type: String,
  },
  long: {
    type: String,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  }, 
  androidDeviceId: {
    type: String,
  },
  iosDeviceId: {
    type: String,
  },
  token: {
    type: String,
  },
  password: {
    type: String,
  },
  vehicleNumber: {
    type: String,
  },
  vehicleType: {
    type: String,
  },
  vehicleImage: {
    type: String,
  },
  isVehicleNumberApproved: {
    type: Boolean,
    default: false,
  },
  isVehicleTypeApproved: {
    type: Boolean,
    default: false,
  },
  isVehicleImageApproved: {
    type: Boolean,
    default: false,
  },
  vehicleNumberRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  vehicleTypeRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  vehicleImageRejectReason: {
    type: String,
    default: "waiting for approval",
  },


    // account details
  
    accountNumber: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    panNumber: {
      type: String,
    },
    upiId: {
      type: String,
    },
    accountHolderName: {
      type: String,
    },
    bankName: {
      type: String,
    },
    bankBranchCode: {
      type: String,
    },
    signature: {
      type: String,
    },
    adharCard: {
      type: String,
    },


// account details isApproved fields

    isAccountNumberApproved: {
      type: Boolean,
      default: false,
    },
    isIfscCodeApproved: {
      type: Boolean,
      default: false,
    },
    isPanNumberApproved: {
      type: Boolean,
      default: false,
    },
    isUpiIdApproved: {
      type: Boolean,
      default: false,
    },
    isAccountHolderNameApproved: {
      type: Boolean,
      default: false,
    },
    isBankNameApproved: {
      type: Boolean,
      default: false,
    },
    isBankBranchCodeApproved: {
      type: Boolean,
      default: false,
    },
    isSignatureApproved: {
      type: Boolean,
      default: false,
    },
    isAdharCardApproved: {
      type: Boolean,
      default: false,
    },

    // account details reject reason

    accountNumberRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    ifscCodeRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    panNumberRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    upiIdRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    accountHolderNameRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    bankNameRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    bankBranchCodeRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    signatureRejectReason: {
      type: String,
      default: "waiting for approval", 
    },
    adharCardRejectReason: {
      type: String,
      default: "waiting for approval", 
    },


});

driverSchema.plugin(timestamps);
module.exports = mongoose.model("Driver", driverSchema);

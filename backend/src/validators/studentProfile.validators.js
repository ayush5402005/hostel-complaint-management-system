const { body } = require('express-validator');

// Mirrors StudentProfileRequest.java's @NotBlank/@NotNull fields exactly.
const submitProfileRules = [
  body('hostelFeeUtr').trim().notEmpty().withMessage('Hostel fee UTR is required'),
  body('hostelFeeAmount').notEmpty().withMessage('Hostel fee amount is required').isFloat(),
  body('hostelFeeScreenshotUrl').trim().notEmpty().withMessage('Hostel fee screenshot is required'),
  body('messFeeUtr').trim().notEmpty().withMessage('Mess fee UTR is required'),
  body('messFeeAmount').notEmpty().withMessage('Mess fee amount is required').isFloat(),
  body('messFeeScreenshotUrl').trim().notEmpty().withMessage('Mess fee screenshot is required'),
  body('parentContact').trim().notEmpty().withMessage('Parent contact is required'),
  body('homeAddress').trim().notEmpty().withMessage('Home address is required'),
  body('profilePhotoUrl').trim().notEmpty().withMessage('Profile photo is required'),
];

module.exports = { submitProfileRules };

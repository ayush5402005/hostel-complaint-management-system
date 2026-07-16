const { body } = require('express-validator');

// Mirrors the @NotBlank/@NotNull/@Size annotations on ComplaintRequest.java,
// CloseComplaintRequest.java and UpdateComplaintStatusRequest.java.

const createComplaintRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
  body('category').notEmpty().withMessage('Category is required'),
  body('mediaUrls').optional().isArray({ max: 3 }).withMessage('Maximum 3 photos allowed'),
];

const closeComplaintRules = [
  body('rating').optional({ nullable: true }).isInt({ min: 1, max: 5 }),
  body('reviewText').optional({ nullable: true }).isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),
];

const updateStatusRules = [
  body('resolvedMediaUrls').optional().isArray({ max: 3 }).withMessage('Maximum 3 proof photos allowed'),
];

module.exports = { createComplaintRules, closeComplaintRules, updateStatusRules };

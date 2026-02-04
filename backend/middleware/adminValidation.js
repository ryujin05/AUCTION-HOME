import Joi from "joi";

export const validateBroadcast = (req, res, next) => {
  const audienceSchema = Joi.alternatives().try(
    Joi.string().valid("all", "admins", "users"),
    Joi.string().pattern(/^(user|email):.+/)
  ).optional();

  const schema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(1).max(2000).required(),
    type: Joi.string().valid("info", "warning", "alert").default("info"),
    // Accept both `audience` and older `targetAudience` from frontend
    audience: audienceSchema,
    targetAudience: audienceSchema,
    expiresAt: Joi.date().iso().optional().allow(null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    console.warn("validateBroadcast failed", { body: req.body, message: error.details[0].message });
    return res.status(400).json({ message: error.details[0].message });
  }

  // Normalize: prefer `audience`, fallback to `targetAudience`, default to 'all'
  value.audience = value.audience || value.targetAudience || "all";
  delete value.targetAudience;

  req.body = value;
  next();
};

export const validateStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().required(),
    reason: Joi.string().max(1000).allow('', null).optional(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    console.warn("validateStatusUpdate failed", { body: req.body, message: error.details[0].message });
    return res.status(400).json({ message: error.details[0].message });
  }
  req.body = value;
  next();
};

export const validateToggleBan = (req, res, next) => {
  const schema = Joi.object({
    ban: Joi.boolean().required(),
    reason: Joi.string().max(1000).allow('', null).optional(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    console.warn("validateToggleBan failed", { body: req.body, message: error.details[0].message });
    return res.status(400).json({ message: error.details[0].message });
  }
  req.body = value;
  next();
};

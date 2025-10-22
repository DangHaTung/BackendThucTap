export const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const payload = { body: req.body, params: req.params, query: req.query };
  const { error } = schema.validate(payload, { abortEarly: true, allowUnknown: true });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  return next();
};



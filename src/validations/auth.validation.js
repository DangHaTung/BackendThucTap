import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.empty': 'Username không được để trống',
    'string.min': 'Username phải có ít nhất 3 ký tự',
    'string.max': 'Username không được vượt quá 30 ký tự',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'string.empty': 'Email không được để trống',
    'any.required': 'Email là bắt buộc',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password phải có ít nhất 6 ký tự',
    'string.empty': 'Password không được để trống',
    'any.required': 'Password là bắt buộc',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'string.empty': 'Email không được để trống',
    'any.required': 'Email là bắt buộc',    
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password phải có ít nhất 6 ký tự',
    'string.empty': 'Password không được để trống',
    'any.required': 'Password là bắt buộc',
  }),
});

export const updateMeSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(30).optional(),
    avatar: Joi.string().uri().allow('').optional(),
    password: Joi.string().min(6).optional(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).when('password', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }).messages({
      'any.only': 'Xác nhận mật khẩu không khớp',
      'any.required': 'Vui lòng xác nhận mật khẩu'
    })
  }).required(),
  params: Joi.object({}).optional(),
  query: Joi.object({}).optional()
});
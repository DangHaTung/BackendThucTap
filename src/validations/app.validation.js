import Joi from "joi";

export const createBoardSchema = Joi.object({
  body: Joi.object({ title: Joi.string().min(1).max(200).optional() }).required(),
});

export const updateBoardSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ title: Joi.string().min(1).max(200).required() }).required(),
});

export const inviteMemberSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ memberId: Joi.string().hex().length(24).required() }).required(),
});

export const inviteByEmailSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ email: Joi.string().email().required() }).required(),
});

export const removeMemberSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ memberId: Joi.string().hex().length(24).required() }).required(),
});

export const leaveBoardSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }).required(),
});

export const createListSchema = Joi.object({
  params: Joi.object({ boardId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ title: Joi.string().min(1).max(200).optional() }).required(),
});

export const updateListSchema = Joi.object({
  params: Joi.object({
    boardId: Joi.string().hex().length(24).required(),
    listId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({ title: Joi.string().min(1).max(200).required() }).required(),
});

export const createCardSchema = Joi.object({
  params: Joi.object({
    boardId: Joi.string().hex().length(24).required(),
    listId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().allow("").optional(),
    labels: Joi.array().items(Joi.string()).optional(),
    dueDate: Joi.date().optional(),
  }).required(),
});

export const updateCardSchema = Joi.object({
  params: Joi.object({ cardId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().allow("").optional(),
    labels: Joi.array().items(Joi.string()).optional(),
    assignees: Joi.array().items(Joi.string().hex().length(24)).optional(),
    dueDate: Joi.date().optional(),
  }).required(),
});

export const moveCardSchema = Joi.object({
  params: Joi.object({ cardId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({
    targetListId: Joi.string().hex().length(24).required(),
    targetPosition: Joi.number().integer().min(0).required(),
  }).required(),
});

export const labelCrudSchema = Joi.object({
  params: Joi.object({ boardId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    color: Joi.string().pattern(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  }).required(),
});

export const updateLabelSchema = Joi.object({
  params: Joi.object({ labelId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({
    name: Joi.string().min(1).max(50).optional(),
    color: Joi.string().pattern(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  }).required(),
});

export const attachLabelSchema = Joi.object({
  params: Joi.object({ cardId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ labelName: Joi.string().min(1).max(50).required() }).required(),
});

export const commentCreateSchema = Joi.object({
  params: Joi.object({ cardId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ text: Joi.string().min(1).required() }).required(),
});

export const commentMutateSchema = Joi.object({
  params: Joi.object({ commentId: Joi.string().hex().length(24).required() }).required(),
  body: Joi.object({ text: Joi.string().min(1).required() }).required(),
});

export const searchBoardsSchema = Joi.object({
  query: Joi.object({ q: Joi.string().allow("").optional() }).required(),
});

export const searchCardsSchema = Joi.object({
  query: Joi.object({ q: Joi.string().allow("").optional(), label: Joi.string().optional() }).required(),
});



const express = require('express')
const router = express.Router()
const { NotFound, BadRequest } = require('http-errors')
const Joi = require('joi')

const contactsOperation = require("../../model")

const joiSchema = Joi.object({  
  name: Joi.string().required(),
  email: Joi.string().email({ tlds: { allow: false } }),
  phone: Joi.string().min(5).max(17).required(),
})

router.get('/', async (req, res, next) => {

  try {
    const contacts = await contactsOperation.listContacts()
  res.json(contacts)
  }

  catch(error){
    next(error);   
  }
})

router.get('/:contactId', async (req, res, next) => {

  const { contactId } = req.params

  try {
    const contact = await contactsOperation.getById(contactId)

    if (!contact) {
      throw new NotFound();
    }
    res.json(contact)
  }

  catch(error){
    next(error);    
  }  
})

router.post('/', async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body)
    if (error) {
      throw new BadRequest(error.message)
    }
     const newContact = await contactsOperation.addContact(req.body)
     res.status(201).json(newContact);
  }

  catch(error){
    next(error);    
  }   
})

router.delete('/:contactId', async (req, res, next) => {
try {    
    const { contactId } = req.params
  const removeContact = await contactsOperation.removeContact(contactId);
  if (!removeContact) {
    throw new NotFound();
  }
  res.json({message: "contact deleted"})
  }

  catch(error){
    next(error);    
  }  
})

router.put('/:contactId', async (req, res, next) => {  
  
  try {
    const { error } = joiSchema.validate(req.body)
    if (error) {
      throw new BadRequest(error.message)
    }
    const { contactId } = req.params
    const updateContact = await contactsOperation.updateContact(contactId, req.body)
    if (!updateContact) {
      throw new NotFound("missing fields");
    }
    res.json(updateContact)
  }

  catch(error){
    next(error);    
  }  
})

module.exports = router

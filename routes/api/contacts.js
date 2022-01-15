const express = require('express')
const router = express.Router()
const { NotFound, BadRequest } = require('http-errors')
const { joiSchema } = require('../../models/contact')
const {authenticate} = require('../../middlewares')

const { Contact } = require('../../models')

router.get('/', authenticate, async (req, res, next) => {

  try {
    const { page = 1, limit = 10, favorite } = req.query
    // console.log(req.query)
    const { _id } = req.user
    const skip = (page - 1) * limit
    let contacts = await Contact.find({
      owner: _id, favorite
    },
      '-createdAt -updatedAt',
      {
        skip,
        limit: +limit,        
      }

    )
     if (favorite === undefined) {
      contacts = await Contact.find({ owner: _id }, '-createdAt -updatedAt', {
        skip,
        limit: +limit,
      })
    }
  res.json(contacts)
  }

  catch(error){
    next(error)   
  }
})

router.get('/:contactId', authenticate, async (req, res, next) => {

  const { contactId } = req.params

  try {
    const contact = await Contact.findById(contactId)

    if (!contact) {
      throw new NotFound()
    }
    res.json(contact)
  }

  catch (error) {
    if (error.message.includes('Cast to ObjectId failed')) {
      error.status = 404
    }
    next(error)    
  }  
})

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error } = joiSchema.validate(req.body)
    if (error) {
      throw new BadRequest(error.message)
    }
    const {_id} = req.user
    const newContact = await Contact.create({...req.body, owner: _id})
    console.log(newContact)
     res.status(201).json(newContact)
  }
  catch (error) {
    if (error.message.includes('contact validation failed')) {
      error.status = 400
    }
    next(error)    
  }   
})

router.put('/:contactId', authenticate, async (req, res, next) => {  
  
  try {
    const { error } = joiSchema.validate(req.body)
    if (error) {
      throw new BadRequest(error.message)
    }
    const { contactId } = req.params
    const updateContact = await Contact.findByIdAndUpdate(contactId, req.body, {new: true})
    if (!updateContact) {
      throw new NotFound("missing fields")
    }
    res.json(updateContact)
  }

  catch (error) {
    if (error.message.includes('contact validation failed')) {
      error.status = 400
    }
    next(error)    
  }  
})

router.patch('/:contactId/favorite', authenticate, async (req, res, next) => {  
  
  try {
    const { contactId } = req.params
    const { favorite } = req.body

    if (req.body.favorite.toString().length === 0) {
        throw new BadRequest('missing fields favorite')
    }
    const updateStatusContact = await Contact.findByIdAndUpdate(contactId, { favorite }, { new: true })

    if (!updateStatusContact) {
      throw new NotFound()
    }
    
    res.json(updateStatusContact)
  }

  catch (error) {
    next(error)    
  }  
})

router.delete('/:contactId', authenticate, async (req, res, next) => {
try {    
    const { contactId } = req.params
  const removeContact = await Contact.findByIdAndRemove(contactId)
  if (!removeContact) {
    throw new NotFound()
  }
  res.json({message: "contact deleted"})
  }

  catch(error){
    next(error)    
  }  
})

module.exports = router

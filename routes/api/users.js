const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const gravatar = require('gravatar')
const path = require('path')
const fs = require('fs/promises')
// const Jimp = require('jimp')

const { BadRequest, Conflict, Unauthorized, NotFound } = require('http-errors')
const { joiRegisterSchema, joiLoginSchema, SubscriptionJoiSchema } = require('../../models/user')
const { SECRET_KEY = 3000 } = process.env
const {authenticate, upload} = require('../../middlewares')

const router = express.Router()

const { User } = require('../../models')

const avatarDir = path.join(__dirname, '../../', 'public', 'avatars')

router.post('/signup', async (req, res, next) => {
    try {
        const { error } = joiRegisterSchema.validate(req.body)        

        if (error) {
            throw new BadRequest(error.message)
        }
        const {name, email, password } = req.body
        const user = await User.findOne({ email })

        if (user) {
            throw new Conflict('Email in use')
        }
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)
        const avatarURL = gravatar.url(email)
        console.log(avatarURL)
        const newUser = await User.create({ name, email, password: hashPassword, avatarURL })

        res.status(201).json({
            user: {                
                email: newUser.email,
                subscription: newUser.subscription,                
            }
        })
        
    } catch (error) {
        next(error)
    }
    
})

router.post('/login', async (req, res, next) => {
    try {
        const { error } = joiLoginSchema.validate(req.body)        

        if (error) {
            throw new BadRequest(error.message)
        }

        const { email, password } = req.body
        const user = await User.findOne({ email })

        if (!user) { 
            throw new Unauthorized('Email or password is wrong')
        }

        const passwordCompare = await bcrypt.compare(password, user.password)
        
        if (!passwordCompare) { 
            throw new Unauthorized('Email or password is wrong')
        }

        const payload = {
            id: user._id
        }
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' })
        await User.findByIdAndUpdate(user.id, {token})
        res.json({
            token,
            user: {
                email: user.email,
                subscription: user.subscription                
            }
        })
       
    } catch (error) {
        next(error)
    }
    
})

router.get('/logout', authenticate, async (req, res) => { 
    const { _id } = req.user
    await User.findByIdAndUpdate(_id, { token: null })
    res.status(204).send()
})

router.get('/current', authenticate, async (req, res) => {
  const { email, subscription } = req.user
    res.json({
        user: {
            email,
            subscription,
        }
    })
})

router.patch('/', authenticate, async (req, res, next) => {
  try {
    const { error } = SubscriptionJoiSchema.validate(req.body)
    if (error) {
      throw new BadRequest(error.message)
    }
    const { _id } = req.user
    const updated = await User.findOneAndUpdate(_id, req.body, { new: true })
    if (!updated) {
      throw new NotFound()
    }
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

router.patch('/avatars', authenticate, upload.single('avatar'), async (req, res) => {
        const { path: tmpUpload, filename } = req.file
        const [extension] = filename.split('.').reverse()
        const newFileName = `${req.user._id}.${extension}`
        const fileUpload = path.join(avatarDir, newFileName)
        await fs.rename(tmpUpload, fileUpload)
        const avatarURL = path.join('avatars', newFileName)
        await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true })
        res.json({avatarURL})
 })

module.exports = router

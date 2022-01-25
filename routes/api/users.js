const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const gravatar = require('gravatar')
const path = require('path')
const fs = require('fs/promises')
const Jimp = require('jimp')
const {nanoid} = require('nanoid')

const { BadRequest, Conflict, Unauthorized, NotFound } = require('http-errors')
const { joiRegisterSchema, joiLoginSchema, SubscriptionJoiSchema } = require('../../models/user')
const { SECRET_KEY, SITE_NAME} = process.env
const { authenticate, upload } = require('../../middlewares')
const { sendEmail } = require('../../helpers')

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
        const verificationToken = nanoid()
        const avatarURL = gravatar.url(email)
        const newUser = await User.create({
            name,
            email,
            verificationToken,
            password: hashPassword,
            avatarURL
        })

        const data = {
            to: email,
            subject: 'Подтверждение Email',
            html: `<a target ="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Подтвердить email</a>`
        }

        await sendEmail(data)

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

        if (!user.verify) {
            throw new Unauthorized('Email not verify')
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

router.post('/verify', async (req, res, next) => { 
    try {
        const { email } = req.body
        if (!email) {
            throw new BadRequest('missing required field email')
        }
        const user = await User.findOne({ email })
        if(!user) {
            throw new NotFound('User not found')
        }
        if (user.verify) {
            throw new BadRequest('Verification has already been passed')
        }

        const { verificationToken } = user
        
        const data = {
            to: email,
            subject: 'Подтверждение Email',
            html: `<a target ="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Подтвердить email</a>`
        }

        await sendEmail(data)

        res.json({message: 'Verification email sent'})

    } catch (error) {
        next(error)
    }
})

router.get('/verify/:verificationToken', async (req, res, next) => {
    try {
        const { verificationToken } = req.params
        const user = await User.findOne({ verificationToken })
        if (!user) {
            throw new NotFound()
        }        
        await User.findByIdAndUpdate(user._id, { verificationToken: null, verify: true })
        res.json({
            message: 'Verification successful'
        })
    } catch (error) {
        next(error)
    }
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

router.patch('/avatars', authenticate, upload.single('avatar'), async (req, res, next) => {
    try {
        const { path: tmpUpload, filename } = req.file
        const image = await Jimp.read(tmpUpload)
        image.resize(250, 250)
        image.write(tmpUpload)
        const [extension] = filename.split('.').reverse()
        const newFileName = `${req.user._id}.${extension}`
        const fileUpload = path.join(avatarDir, newFileName)
        await fs.rename(tmpUpload, fileUpload)
        const avatarURL = path.join('avatars', newFileName)
        await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true })
        res.json({avatarURL})
    } catch (error) {
        next(error)
    }
   
 })

module.exports = router

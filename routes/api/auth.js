const express = require('express')

const { BadRequest, Conflict } = require('http-errors')
const { joiSchema } = require('../../models/user')

const router = express.Router()

const {User} = require('../../models/user')

router.post('/register', async (req, res, next) => {
    try {
        const { error } = joiSchema.validate(req.body)        

        if (error) {
            throw new BadRequest(error.message)
        }
        const {name, email, password} = req.body
        const user = await User.findOne({ email })

        if (user) {
            throw new Conflict("User alredy exist")
        }
        const newUser = await User.create(req.body)
        res.sendStatus(201).json({
            user: {
                name: newUser.name,
                email: newUser.email,
            }
        })


    } catch (error) {
        next(error)
    }
    
})

module.exports = router

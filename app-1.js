// const bcrypt = require("bcryptjs")

// const password = "123456"

// const hashPassword = async (pass) => {
//     const salt = await bcrypt.genSalt(10)
//     console.log("salt", salt)
//     const result = await bcrypt.hash(pass, salt)
//     console.log("hashPassword", result)
    
//     const compareResult = await bcrypt.compare(pass, result)
//     console.log("compareResult", compareResult)


// }

// hashPassword(password);

const jwt = require('jsonwebtoken')
const SECRET_KEY = '85GFN54DTJR51DTFGJ986GJRTF'

const payload = {
    id: '6dsb15fh3n6585gdfc63fdb'
}

const token = jwt.sigh(payload, SECRET_KEY, { expiresIn: '1h' })

const decodeToken = jwt.decode(token)

try {
const verifyToken = jwt.verify(token, SECRET_KEY)
} catch (error) {
    
}

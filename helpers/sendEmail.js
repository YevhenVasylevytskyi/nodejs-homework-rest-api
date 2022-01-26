const sgMail = require('@sendgrid/mail')
require('dotenv').config()

const { SENDGRID_API_KEY, IMEIL_FROM } = process.env

sgMail.setApiKey(SENDGRID_API_KEY)

const sendEmail = async(data, next) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const email = {...data, from: IMEIL_FROM}
        await sgMail.send(email)
        return true
    } catch (error) {
        throw error;
    }
}

module.exports = sendEmail


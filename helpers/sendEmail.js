const sgMail = require('@sendgrid/mail')
require('dotenv').config()

const { SENDGRID_API_KEY } = process.env

sgMail.setApiKey(SENDGRID_API_KEY)

const sendEmail = async(data, next) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const email = {...data, from: 'yevhenvasylevytskyi@gmail.com'}
        await sgMail.send(email)
        return true
    } catch (error) {
        throw error;
    }
}

module.exports = sendEmail


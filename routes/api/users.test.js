const mongoose = require('mongoose')
const request = require('supertest')
require('dotenv').config()

const app = require('../../app')

const { DB_TEST_HOST, PORT } = process.env

describe('test users', () => {
  let server
  beforeAll(() => (server = app.listen(PORT)))
  afterAll(() => server.close())

  beforeEach(done => {
    mongoose.connect(DB_TEST_HOST).then(() => done())
  })

  afterEach(done => {
    mongoose.connection.close(() => done())
  })

  test('test login route', async () => {
    const user = {
      email: 'yevgen@gmail.com',
      password: '123456',
    }

    const response = await request(app).post('/api/users/login').send(user)

    expect(response.statusCode).toBe(200)
    const isToken = response.body.token.split('.').length
    expect(isToken).toBe(3)
    expect(typeof response.body.user.email).toBe('string')
    expect(typeof response.body.user.subscription).toBe('string')
  })
})
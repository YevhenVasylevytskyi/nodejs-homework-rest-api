const fs = require('fs/promises')
const path = require("path")
const { nanoid } = require("nanoid")

const contactsPath = path.join(__dirname, "contacts.json")

const listContacts = async () => {

  const data = await fs.readFile(contactsPath)
  const contacts = JSON.parse(data)
  return contacts     

}

const getById = async (contactId) => {

  const contacts = await listContacts()    
  const contact = contacts.find(item => item.id === contactId)

  if (!contact) {
    return null
  }

  return contact
  
}

const removeContact = async (contactId) => {

  const contacts = await listContacts()
  const idx = contacts.findIndex(item => item.id === contactId)

  if (idx === -1){
    return null
  }

  const deleteContact = contacts.splice(idx, 1)
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2))

  return deleteContact

}

const addContact = async (body) => {

  const newContact = { id: nanoid(), ...body }
  const contacts = await listContacts()
  contacts.push(newContact)
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2))

  return newContact

}

const updateContact = async (contactId, body) => {

  const contacts = await listContacts()
  const idx = contacts.findIndex(item => item.id.toString() === contactId)
  
  if(idx === -1){
    return null
  }

  if (idx === -1) {
    console.log(`Contact with ID:"${contactId}" not found...`)
    return null
  }

  contacts[idx] = { ...contacts[idx], ...body }
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2))
  return contacts[idx]

}

module.exports = {
  listContacts,
  getById,
  removeContact,
  addContact,
  updateContact,
}

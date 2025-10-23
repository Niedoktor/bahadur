const db = require('./db');
const log = require('./log');
const { getPerson } = require('./getPerson');

const extendOffice = (office) => {
  office.getPerson = () => {
    return getPerson(office.personId);
  }
  
  return office;
}

const getOffice = (id) => {
  return extendOffice(db.offices.get(id));
}

const getOfficeByName = (name) => {
  return extendOffice(db.offices.find(o => o.name == name));
}

const getOfficeBySystemId = (systemId) => {
  return extendOffice(db.offices.find(o => o.systemId == systemId));
}

exports = module.exports = { getOffice, getOfficeByName, getOfficeBySystemId };
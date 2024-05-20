const yup = require('./configurations');

const schemaCreateUser = yup.object().shape({
    name: yup.string().required(),
    email: yup.string().required().email(),
    password: yup.string().required().trim().min(4) 
});

module.exports = {
    schemaCreateUser
}
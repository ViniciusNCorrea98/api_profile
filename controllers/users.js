const knex = require('../knex');
const schemaCreateUser = require('../validations/schemaUser')
const securePassword = require('secure-password');

const pwd = securePassword();

const createUser = async (req, res) => {
    const {name, email, password} = req.body;

    try{
        await schemaCreateUser.schemaCreateUser.validate(req.body);
        const buscarEmail = await knex('users').where('email', email).first();
        
        if(buscarEmail){
            return res.status(400).json('Email has been already used!')
        }

    } catch(error){
        return res.status(400).json(error.message)
    }

    try {
        const hash = (await pwd.hash(Buffer.from(password))).toString('hex');

        const newUser = await knex('users').insert({name, password: hash, email});

        if(!newUser){
            return res.status(400).json("There's a problem to CREATE a user! Try again!");
        }

        return res.status(200).json(error.message);
    } catch (error) {
        return res.status(400).json(error.message)
    }
}

module.exports = {
    createUser
}
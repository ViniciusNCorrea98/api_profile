const knex = require('../knex');
const securePassword= require('secure-password')
const jwt = require('jsonwebtoken')
const jwt_secret = require('../jwt_secret');

const pwd = securePassword();

const login = async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await knex('users').where('email', email).first();

        if(!user){
            return res.status(400).json('Not found!');
        }

        const checkPassword = await pwd.verify(Buffer.from(password), Buffer.from(user.password, 'hex'));

        switch(checkPassword){
            case securePassword.INVALID_UNRECOGNIZED_HASH:
            case securePassword.INVALID:
                return res.status(400).json('Message: Email or Password failed!');
            case securePassword.VALID:
                break;
            case securePassword.VALID_NEEDS_REHASH:
                try{
                    const hash = (await pwd.hash(Buffer.from(password))).toString('hex');
                    await knex('users').update({password: hash, email}).where('id', id);
                } catch {
                }
                break;
        }

        const token = jwt.sign({
            id: user.id,
            name: user.name
        }, jwt_secret, { expiresIn: '2h'});

        return res.status(200).json({
            user: {
                id: user.id, 
                name: user.name
            }, token
        })
    } catch (error) {
        
    }
}

module.exports = {login}
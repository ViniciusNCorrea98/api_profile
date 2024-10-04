const knex = require('../knex');

const listContacs = async (req, res) => {
    const {account_id} = req.path;
    const usuario = req.headers['usuario'];
    const query = req.query;

    if (!usuario || !usuario.api_access_token) {
        return res.status(401).json('Usuário não autorizado!');
    }

    try{
        const queryDinamica = {};
        if (account_id) {
            queryDinamica.account_id = account_id;
        }
        if (query.email) {
            queryDinamica.email = query.email;
        }
        if (query.nome) {
            queryDinamica.nome = query.nome;
        }
        if (query.telefone) {
            queryDinamica.telefone = query.telefone;
        }
        if (query.status) {
            queryDinamica.status = query.status;
        }
        
        const buscarUsarios = await knex("contacts").where(queryDinamica).select("*");

        if(!buscarUsarios){
            return res.status(400).json('Usuário não encontrado');
        }

        return res.status(200).json(buscarUsarios);

    } catch(error){
        return res.status(400).json(error.message)
    }
}

const createContact = async (req, res) => {
    const { account_id } = req.params;  // Obtendo account_id dos parâmetros
    let { inbox_id, name, email, phone_number, avatar, avatar_url, identifier, custom_attributes } = req.body; 
    const usuario = req.headers['usuario'];  // Obtendo o usuário dos headers

    // Verifica se o usuário possui o token de acesso
    if (!usuario || !usuario.api_access_token) {
        return res.status(401).json('Usuário não autorizado!');
    }

    // Verificações de campos obrigatórios
    if (!inbox_id || !account_id || (!phone_number && !identifier)) {
        return res.status(400).json('Campos obrigatórios faltando: inbox_id, account_id, phone_number e/ou identifier.');
    }

   
    const sanitizeInput = (input) => {
        return input.replace(/[<>]/g, '');
    };

    name = sanitizeInput(name || '');  
    email = sanitizeInput(email || '');  
    avatar = sanitizeInput(avatar || '');  
    avatar_url = sanitizeInput(avatar_url || ''); 


    const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp))$/i;
    if (avatar_url && !urlRegex.test(avatar_url)) {
        return res.status(400).json('URL de imagem inválida!');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  
    if (email && !emailRegex.test(email)) {
        return res.status(400).json('Email inválido!');
    }

    if (!phone_number && identifier) {
        phone_number = "+" + sanitizeInput(identifier.split("@")[0]);  
    }

    if (!identifier) {
        identifier = `${sanitizeInput(phone_number.split("+")[1])}@s.whatsapp.net`;  
    }

    try {
        custom_attributes = custom_attributes && Object.keys(custom_attributes).length > 0 ? JSON.parse(custom_attributes) : {};
    } catch (error) {
        return res.status(400).json('custom_attributes inválido!');
    }

    try {
        // Inserindo novo contato no banco de dados
        const newContactId = await knex('contacts').insert({
            account_id,
            inbox_id, 
            name, 
            email, 
            phone_number, 
            avatar, 
            avatar_url, 
            identifier, 
            custom_attributes 
        }).returning('id');

        const newContact = await knex('contacts').where('id', newContactId[0]).first();

        if (!newContact) {
            return res.status(404).json("Não foi possível cadastrar o usuário. Tente novamente!");
        }
        
        return res.status(201).json(newContact);

    } catch (error) {
        console.error("Erro ao criar contato:", error); 
        return res.status(400).json(`Erro ao criar contato: ${error.message}`);  
    }
};

const showContact = async (req, res) => {
    const {account_id, id} = req.path;
    const usuario = req.headers['usuario'];

    if(!account_id || !id){
        return res.status(400).json('Os campos account_id e id são obrigatórios!');
    }

    if (!usuario || !usuario.api_access_token) {
        return res.status(401).json('Usuário não autorizado!');
    }

    try {
        const buscarContact = await knex('contacts').select("*").where({'id': id, 'account_id': account_id}).first();

        if(!buscarContact){
            return res.status(404).json(`Não é possível localizar o contato com o id: ${id} mencionado`)
        }

        return res.status(200).json(buscarContact);
    } catch (error) {
        return res.status(400).json(error.message)
    }
}


const updateContact = async (req, res) => {
    const { account_id, id } = req.params; 
    let { inbox_id, name, email, phone_number, avatar, avatar_url, identifier, custom_attributes } = req.body; 
    const usuario = req.headers['usuario'];

    if (!usuario || !usuario.api_access_token) {
        return res.status(401).json('Usuário não autorizado!');
    }

    // Verifica se o id foi passado
    if (!id) {
        return res.status(400).json('O ID do contato é obrigatório.');
    }

    // Validação dos campos obrigatórios
    if (!inbox_id || !account_id || (!phone_number && !identifier)) {
        return res.status(400).json('Campos obrigatórios faltando: inbox_id, account_id, phone_number e/ou identifier.');
    }

    // Sanitização e definição de valores padrão
    const sanitizeInput = (input) => {
        return input ? input.replace(/[<>]/g, '') : ''; 
    };

    name = sanitizeInput(name || '');  
    email = sanitizeInput(email || '');  
    avatar = sanitizeInput(avatar || '');  
    avatar_url = sanitizeInput(avatar_url || '');

    // Validação de URL de imagem
    const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp))$/i;
    if (avatar_url && !urlRegex.test(avatar_url)) {
        return res.status(400).json('URL de imagem inválida!');
    }


    // Validação de email (opcional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (email && !emailRegex.test(email)) {
        return res.status(400).json('Email inválido!');
    }


    if (!phone_number && identifier) {
        phone_number = "+" + sanitizeInput(identifier.split("@")[0]);  
    }

    if (!identifier) {
        identifier = `${sanitizeInput(phone_number.split("+")[1])}@s.whatsapp.net`;  
    }

    try {
        custom_attributes = custom_attributes && Object.keys(custom_attributes).length > 0 ? JSON.parse(custom_attributes) : {};
    } catch (error) {
        return res.status(400).json('custom_attributes inválido!');
    }

    try {
        
        const updatedContact = await knex('contacts')
            .where('id', id)
            .andWhere('account_id', account_id)
            .update({
                inbox_id,
                name,
                email,
                phone_number,
                avatar,
                avatar_url,
                identifier,
                custom_attributes 
            });

        if (!updatedContact) {
            return res.status(404).json("Contato não encontrado ou nenhum dado foi alterado.");
        }

        const contactAfterUpdate = await knex('contacts').where('id', id).first();

        return res.status(200).json(contactAfterUpdate);

    } catch (error) {
        console.error("Erro ao atualizar contato:", error);
        return res.status(400).json(`Erro ao atualizar contato: ${error.message}`);
    }
};

const deleteContact = async (req, res) => {
    const { account_id, id } = req.params;
    const usuario = req.headers['usuario']; 

    // Verificação de autorização do usuário
    if (!usuario || !usuario.api_access_token) {
        return res.status(401).json('Usuário não autorizado!');
    }

    // Verifica se o account_id foi fornecido
    if (!account_id) {
        return res.status(400).json('O ID da conta é obrigatório.');
    }

    // Tenta deletar o contato no banco de dados
    try {
        const deletedContact = await knex('contacts')
            .where('id', id)
            .andWhere('account_id', account_id)
            .del();

        // Se nenhum contato foi encontrado, retorna 404
        if (!deletedContact) {
            return res.status(404).json("Contato não encontrado.");
        }
        return res.status(204).json(); 
    } catch (error) {
        console.error("Erro ao deletar contato:", error);
        return res.status(400).json(`Erro ao deletar contato: ${error.message}`);
    }
};

const contactConversations = async (req, res) => {
    const { account_id, id } = req.params;
    const usuario = req.headers['usuario'];  

    if (!usuario || !usuario.api_access_token) {
        return res.status(401).json('Usuário não autorizado!');
    }

    // Verifica se o account_id foi fornecido
    if (!account_id) {
        return res.status(400).json('O ID da conta é obrigatório.');
    }

    try {
        
        const buscarContversation = await knex('conversations').select("*").where({'id': id, 'account_id': account_id}).first();

        if(!buscarContversation){
            return res.status(404).json(`Não é possível localizar a conversa do contato com o id: ${id} mencionado`)
        }

        return res.status(200).json(buscarContact);

    } catch (error) {
        return res.status(400).json(error.message)
    }
}


const searchContact = async (req, res) => {
    const { account_id } = req.params; // Extraímos o account_id da URL
    const usuario = req.headers['usuario']; 
    const { q } = req.query; // Extraímos a query 'q'

    // Verificação de autorização do usuário
    if (!usuario || !usuario.api_access_token) {
        return res.status(401).json('Usuário não autorizado!');
    }

    // Verifica se o account_id foi fornecido
    if (!account_id) {
        return res.status(400).json('O ID da conta é obrigatório.');
    }

    try {
        // Inicia a consulta com a tabela 'contacts'
        let query = knex('contacts').where('account_id', account_id);

        // Se a query 'q' for fornecida, adiciona as condições de busca
        if (q) {
            query = query.where(function() {
                this.where('name', 'ilike', `%${q}%`)
                    .orWhere('email', 'ilike', `%${q}%`)
                    .orWhere('phone_number', 'ilike', `%${q}%`) 
                    .orWhere('identifier', 'ilike', `%${q}%`);
            });
        }

        const contacts = await query;
        if (!contacts) {
            return res.status(404).json("Nenhum contato encontrado.");
        }
        
        return res.status(200).json(contacts);

    } catch (error) {
        console.error("Erro ao listar contatos:", error);
        return res.status(400).json(`Erro ao listar contatos: ${error.message}`);
    }
}

exports.module = {
    listContacs,
    createContact,
    showContact, 
    updateContact,
    deleteContact,
    contactConversations,
    searchContact
}
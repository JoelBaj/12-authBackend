const { response} = require('express');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs')
const {generarJWT } = require('../helpers/jwt')

const crearUsuario = async  (req, res = response) => {
    const { email, name, password } = req.body;
   
    try {
        //verificar correo
            const usuario = await Usuario.findOne({ email: email });
        if (usuario) { 
            return res.status(400).json({
                ok: false,
                msg: 'EL usuario ya existe con ese email'
            })
        }
        //crear usuario con el modelo
        const dbUser = new Usuario(req.body);
        // hash de contraseña
        const salt = bcrypt.genSaltSync();
        dbUser.password = bcrypt.hashSync(password, salt);
        // Generar el JWT
        const token = await generarJWT( dbUser.id, name );
        //crear usuario de DB
        await dbUser.save();

        //generar respuestas existosa
        return res.status(201).json({
            ok: true,
            uid: dbUser.id,
            name,
            email,
            token
        });

    } catch (error) { 
        console.log(error)
        return res.status(500).json({
        ok: true,
        msg: 'Por favor hable con el admin'
    });
    }
   
   

}
const loginUsuario = async(req, res = response) => {

    const { email, password } = req.body;

    try {
        
        const dbUser = await Usuario.findOne({ email });

        if(  !dbUser ) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo no existe'
            });
        }

        // Confirmar si el password hace match
        const validPassword = bcrypt.compareSync( password, dbUser.password );

        if ( !validPassword ) {
            return res.status(400).json({
                ok: false,
                msg: 'El password no es válido'
            });
        }

        // Generar el JWT
        const token = await generarJWT( dbUser.id, dbUser.name );

        // Respuesta del servicio
        return res.json({
            ok: true,
            uid: dbUser.id,
            name: dbUser.name,
            email:dbUser.email,
            token
        });



    } catch (error) {
        console.log(error);

        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }

}

const revalidarToken = async(req, res = response ) => {

    const { uid } = req;
    //leer la bases de bados 
    const dbUser = await Usuario.findById(uid);

    // Generar el JWT
    const token = await generarJWT( uid, dbUser.name );

    return res.json({
        ok: true,
        uid, 
        name: dbUser.name,
        email: dbUser.email,
        token
    });

}

module.exports = {
    crearUsuario,
    loginUsuario,
    revalidarToken
}
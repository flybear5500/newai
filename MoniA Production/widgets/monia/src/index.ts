/* eslint-disable no-await-in-loop */
import dotenv from 'dotenv-flow';
import mysql from 'mysql2/promise';
import { RowDataPacket, FieldPacket } from 'mysql2/promise';
import { CustomRequest, UserEnvironment, User } from './models/UserEnvironment.js';
import express from 'express';
import routes from './routes/index.js';

dotenv.config();

const PORT = process.env.APP_PORT;

const app = express();
app.use(express.json());

async function checkToken(token: string) {
  // console.log('DB_HOST: ', process.env.DB_HOST);
  // console.log('DB_PORT: ', process.env.DB_PORT);
  // console.log('DB_USER: ', process.env.DB_USER);
  console.log('DB_NAME: ', process.env.DB_NAME);
  // console.log('DB_PASSWORD: ', process.env.DB_PASSWORD);

  // create the connection to database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
  });

  if (token) {
    const [rows, _]: [RowDataPacket[], FieldPacket[]] = await connection.execute(
      'SELECT user_id, lastupdatedate, cb_prompt_ia, cb_company, cb_marketing_currentcredit, cb_actia_domain, cb_actia_tonalite, cb_actia_style, cb_actia_temp, cb_actia_frequence, cb_actia_presence, cb_actia_intelligence FROM `yq0g1_comprofiler` WHERE `cb_token_api` = ?',
      [token]
    );

    // Vérifier si l'utilisateur existe
    if (rows.length === 0) {
      return null;
    } else {
      const user: User = {
        user_id: rows[0].user_id,
        lastupdatedate: rows[0].lastupdatedate,
        cb_prompt_ia: rows[0].cb_prompt_ia,
        cb_company: rows[0].cb_company,
        cb_marketing_currentcredit: rows[0].cb_marketing_currentcredit,
        cb_actia_domain: rows[0].cb_actia_domain,
        cb_actia_tonalite: rows[0].cb_actia_tonalite,
        cb_actia_style: rows[0].cb_actia_style,
        cb_actia_temp: rows[0].cb_actia_temp,
        cb_actia_frequence: rows[0].cb_actia_frequence,
        cb_actia_presence: rows[0].cb_actia_presence,
        cb_actia_intelligence: parseFloat(rows[0].cb_actia_intelligence), //convert text to number
      };
      return user;
    }
  } else {
    return null;
  }
}

app.use(async (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('Headers reçus : ', req.headers);
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    req.token = token;
    console.log('Token extrait : ', token);
    const tokenIsValid = await checkToken(token);
    if (!tokenIsValid) {
      return res.status(401).send({ error: 'Token invalide' });
    }
  } else {
    //    console.log('Aucun token dans les headers');
    return res.status(401).send({ error: 'Token manquant' });
  }
  console.log('Token valide, passage au middleware/handler suivant');
  return next();
});

app.use(async (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  if (req.token) {
    const user = await checkToken(req.token);
    if (user) {
      req.userEnv = new UserEnvironment(user);
      await req.userEnv.initialize(req);
      next();
    } else {
      res.status(401).send({ message: 'Utilisateur non trouvé' });
    }
  } else {
    res.status(401).send({ message: 'Token manquant' });
  }
});

app.use('/', routes);

app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));

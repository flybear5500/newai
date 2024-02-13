/* eslint-disable no-await-in-loop */
import dotenv from 'dotenv-flow';
import mysql from 'mysql2/promise';
import { RowDataPacket, FieldPacket } from 'mysql2/promise';
import { CustomRequest, UserEnvironment, User } from './models/UserEnvironment.js';
import express from 'express';
import routes from './routes/index.js';
import bodyParser from 'body-parser';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

const PORT = process.env.APP_PORT;

async function userHasStatusAndPlan(connection: any, userId: number, status: string, planId: number): Promise<boolean> {
  const [rows]: [RowDataPacket[], FieldPacket[]] = await connection.query(
    'SELECT COUNT(*) as count FROM yq0g1_cbsubs_subscriptions WHERE user_id = ? AND status = ? AND plan_id = ?',
    [userId, status, planId]
  );
  return rows[0].count > 0;
}

const app = express();
app.use(express.json());

async function checkToken(
  token: string,
  isSMSNetworkRequest: boolean = false,
  to?: string,
  apiKey?: string,
  msisdn?: string,
  SMSNetworkMainUser?: RowDataPacket
): Promise<{ user: User | null; actorId?: number }> {
  try {
    console.log('DB_NAME: ', process.env.DB_NAME);

    // Créer la connexion à la base de données
    const connection = await pool.getConnection();

    console.log('isSMSNetworkRequest:', isSMSNetworkRequest, 'msisdn:', msisdn);

    let actorId = null;
    let user: User | null = null;

    if (isSMSNetworkRequest && msisdn) {
      const cleanedSQL = "REPLACE(REPLACE(REPLACE(REPLACE(`cb_mobile`, '+', ''), '(', ''), ')', ''), '-', '')";
      const [rowsMsisdn]: [RowDataPacket[], FieldPacket[]] = await connection.execute(
        // 			`SELECT * FROM \`yq0g1_comprofiler\` WHERE REGEXP_REPLACE(\`cb_mobile\`, '[^0-9]', '') = ?`,
        `SELECT * FROM \`yq0g1_comprofiler\` WHERE ${cleanedSQL} = ?`,
        [msisdn]
      );

      if (rowsMsisdn.length === 0) {
        actorId = 0;
        console.log('No user found for this msisdn, actorId: ', actorId);
      } else {
        actorId = rowsMsisdn[0].user_id;
        console.log('User found, actorId: ', rowsMsisdn[0].user_id);
      }

      if (isSMSNetworkRequest && SMSNetworkMainUser) {
        let cb_atid = null;
        const [rowsAtId]: [RowDataPacket[], FieldPacket[]] = await connection.execute(
          'SELECT `id` FROM `yq0g1_affiliate_tracker_accounts` WHERE `user_id` = ? LIMIT 1',
          [SMSNetworkMainUser.user_id]
        );
        if (rowsAtId.length > 0) {
          cb_atid = rowsAtId[0].id;
        }

        const {
          user_id,
          lastupdatedate,
          cb_prompt_ia,
          cb_company,
          cb_marketing_currentcredit,
          cb_actia_domain,
          cb_actia_tonalite,
          cb_actia_style,
          cb_actia_temp,
          cb_actia_frequence,
          cb_actia_presence,
          cb_actia_intelligence,
          cb_network_token,
          cb_network_secret,
          cb_actia_telephone,
        } = SMSNetworkMainUser;

        user = {
          user_id,
          lastupdatedate,
          cb_prompt_ia,
          cb_company,
          cb_marketing_currentcredit,
          cb_actia_domain,
          cb_actia_tonalite,
          cb_actia_style,
          cb_actia_temp,
          cb_actia_frequence,
          cb_actia_presence,
          cb_actia_intelligence: parseFloat(cb_actia_intelligence), //convert text to number
          cb_network_token,
          cb_network_secret,
          cb_actia_telephone,
          cb_atid,
        };
      }
    }

    if (token) {
      const [rows]: [RowDataPacket[], FieldPacket[]] = await connection.execute(
        'SELECT user_id, lastupdatedate, cb_prompt_ia, cb_company, cb_marketing_currentcredit, cb_actia_domain, cb_actia_tonalite, cb_actia_style, cb_actia_temp, cb_actia_frequence, cb_actia_presence, cb_actia_intelligence, cb_actia_function_1 FROM `yq0g1_comprofiler` WHERE `cb_token_api` = ?',
        [token]
      );

      if (rows.length > 0) {
        const hasStatusAndPlan = await userHasStatusAndPlan(connection, rows[0].user_id, 'A', 66);
        user = {
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
          cb_network_token: rows[0].cb_network_token,
          cb_network_secret: rows[0].cb_network_secret,
          cb_actia_telephone: rows[0].cb_actia_telephone,
          planEntrepriseActif: hasStatusAndPlan ? 1 : 0,
          ...(hasStatusAndPlan ? { cb_actia_function_1: rows[0].cb_actia_function_1 } : {}),
        };
      }
    }

    connection.release();

    return { user, actorId };
  } catch (error) {
    console.error("Une erreur s'est produite lors de la vérification du token:", error);
    return { user: null };
  }
}

// Middleware pour parser le corps de requête
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware pour vérifier l'API Key et le Secret de sms network Vonage
app.use(async (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  if (req.path !== '/devnode-question') {
    return next();
  }

  //   console.log('Middleware sms network appelé');
  //   console.log('Headers reçus:', req.headers);
  //   console.log('Corps de la requête:', req.body);

  const apiKey = req.body['api-key'];
  const to = req.body.to;

  if (apiKey && to) {
    // Créer la connexion à la base de données
    const connection = await pool.getConnection();

    const [rows]: [RowDataPacket[], FieldPacket[]] = await connection.execute(
      'SELECT * FROM `yq0g1_comprofiler` WHERE `cb_network_token` = ? AND `cb_actia_telephone` = ?',
      [apiKey, to]
    );

    if (rows.length > 0) {
      req.isSMSNetworkRequest = true;
      req.SMSNetworkMainUser = rows[0];
      console.log('La requête est validée comme provenant de sms network');
    } else {
      console.log(
        "La requête n'est pas validée pour sms network. Clé API absente ou incorrecte dans la base de données."
      );
      return res.status(401).send({ error: 'Token invalide' });
    }
  }
  next();
});

// Middleware pour la vérification du token et initialiser l'environnement utilisateur
app.use(async (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader) {
    token = authHeader.split(' ')[1];
  }

  const { user, actorId } = await checkToken(
    token,
    req.isSMSNetworkRequest,
    req.body.to,
    req.body['api-key'],
    req.body.msisdn,
    req.SMSNetworkMainUser
  );

  if (!user) {
    return res.status(401).send({ error: 'Token invalide' });
  }

  if (actorId != null) {
    req.body.actid = actorId;
  }

  req.userEnv = new UserEnvironment(user);
  await req.userEnv.initialize(req);

  console.log('Token extrait : ', token);
  console.log('Connexion validée par token ou sms network, passage au middleware/handler suivant');
  next();
});

app.use('/', routes);

app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));

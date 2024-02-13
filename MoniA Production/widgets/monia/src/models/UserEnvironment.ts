import path from 'path';
import { addURL, deleteDocument, addTextAsDocument } from '../lib/contextManager.js';
import { getProjectRoot } from '../config/index.js';
import mysql from 'mysql2/promise';
import { RowDataPacket, FieldPacket } from 'mysql2/promise';
import { Request } from 'express';
import moment from 'moment-timezone';

import fs from 'fs';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs';

const fsPromises = fs.promises;
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const projectRootDir = getProjectRoot();

const initializingUsers: { [key: string]: boolean } = {};

export interface CustomRequest extends Request {
  isSMSNetworkRequest?: boolean;
  SMSNetworkMainUser?: number;
  userEnv?: UserEnvironment;
  token?: string;
  joomId?: string;
  prompt_ia?: string;
  actorId?: number;
}

export interface User {
  user_id: string;
  lastupdatedate?: Date;
  cb_company?: string;
  cb_actia_domain?: string;
  cb_prompt_ia?: string;
  cb_actia_tonalite?: string;
  cb_actia_style?: string;
  cb_actia_temp?: number;
  cb_actia_frequence?: number;
  cb_actia_presence?: number;
  cb_actia_intelligence?: number;
  cb_marketing_currentcredit?: number;
  cb_network_token?: string;
  cb_network_secret?: string;
  cb_actia_telephone?: string;
  cb_atid?: number;
}

export class UserEnvironment {
  joomId: string;
  vectorStoreBaseDir: string;
  memoryVectorStoreDir: string;
  docsStoreDir: string;
  chatLogDirectory: string;
  systemPromptDirectory: string;
  configBaseDir: string;
  systemPromptTemplate: string;
  PromptDate: Date;
  lastUpdateDate: Date | null;
  prompt_ia: string;
  company: string;
  website: string;
  tonalite: string;
  style: string;
  temperature: number;
  frequence: number;
  presence: number;
  intelligence: number;
  credits: number;
  token: string;
  secret: string;
  smsphone: string;
  atid:number;

  constructor(user: User) {
    this.joomId = user.user_id;
    this.configBaseDir = `config/${user.user_id}`;
    this.vectorStoreBaseDir = `db/${user.user_id}`;
    this.memoryVectorStoreDir = `memory/${user.user_id}`;
    this.docsStoreDir = `docs/${user.user_id}`;
    this.chatLogDirectory = `chat_logs/${user.user_id}`;
    this.systemPromptDirectory = `prompts/${user.user_id}`;
    this.lastUpdateDate = user.lastupdatedate || null;
    this.company = user.cb_company || '';
    this.website = user.cb_actia_domain || '';
    this.prompt_ia = user.cb_prompt_ia || '';
    this.tonalite = user.cb_actia_tonalite || 'sympathique et serviable';
    this.style = user.cb_actia_style || 'intelligent et créatif';
    this.temperature = user.cb_actia_temp || 0.3;
    this.frequence = user.cb_actia_frequence || 0.6;
    this.presence = user.cb_actia_presence || 0;
    this.intelligence = user.cb_actia_intelligence || 0;
    this.credits = user.cb_marketing_currentcredit || 0;
    this.token = user.cb_network_token || '';
    this.secret = user.cb_network_secret || '';
    this.smsphone = user.cb_actia_telephone || '';
    this.atid = user.cb_atid || 0;
  }

  async initialize(req: CustomRequest) {
	try {
		if (initializingUsers[this.joomId]) {
			console.log(`Initialization already in progress for user ${this.joomId}`);
			return;
		}
		initializingUsers[this.joomId] = true;
    await this.ensureDirectoriesExist();
    await this.createPersonalizedPromptFile(req);
    // this.systemPromptTemplate = await this.readSystemPromptFile();
	} catch (error) {
		console.error(`Failed to initialize user environment for user ${this.joomId}: ${error}`);
	} finally {
		delete initializingUsers[this.joomId];
  }
}

  async ensureDirectoriesExist() {
    try {
      await this.createDirectoryIfNotExist(this.configBaseDir);
      await this.createDirectoryIfNotExist(this.vectorStoreBaseDir);
      await this.createDirectoryIfNotExist(this.memoryVectorStoreDir);
      await this.createDirectoryIfNotExist(this.docsStoreDir);
      await this.createDirectoryIfNotExist(this.chatLogDirectory);
      await this.createDirectoryIfNotExist(this.systemPromptDirectory);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to create directories: ${error.message}`);
      }
    }
  }

  async createDirectoryIfNotExist(dirPath: string) {
    const fullDirPath = path.resolve(process.cwd(), dirPath);
    try {
      await fs.promises.access(fullDirPath);
    } catch (error) {
      if (error instanceof Error) {
        try {
          await fs.promises.mkdir(fullDirPath, { recursive: true });
        } catch (mkdirError) {
          if (mkdirError instanceof Error) {
            console.error(`Failed to create directory: ${mkdirError.message}`);
          }
          throw mkdirError;
        }
      } else {
        throw error;
      }
    }
  }

  // Read the contents of the generic prompt.txt file
  async readGenericPromptFile() {
    const genericPromptFilePath = path.resolve(projectRootDir, 'src/prompt.txt');
    const content = await readFileAsync(genericPromptFilePath, 'utf8');
    return content;
  }

  // Create a personalized prompt.txt file for the user and update website
  async createPersonalizedPromptFile(req: CustomRequest) {
		const lastUpdateDateMoment = this.lastUpdateDate ? moment.tz(this.lastUpdateDate, 'Europe/Paris').add(2, 'hours') : null;

	  await this.ensureDirectoriesExist();

    this.systemPromptTemplate = await this.readSystemPromptFile();

    const modifiedDateMoment = moment.tz(this.PromptDate, 'Europe/Paris');

    console.log("Prompt Date:", modifiedDateMoment);    

    // Define personalized prompt file path
    const personalizedPromptFileText = path.join(this.systemPromptDirectory, 'prompt.txt');

    // Check if the file exists
    const fileExists = await fsPromises
      .access(personalizedPromptFileText)
      .then(() => true)
      .catch(() => false);

    // If the file doesn't exist or doesn't have a valid date, set lastUpdateDate to null 
    // and update the file with the current date.
    if (!fileExists || !this.PromptDate) {
        const content = await this.readGenericPromptFile(); 

        //firstdate to force adding website at first prompt
        const firstdate = moment.tz(this.lastUpdateDate, 'Europe/Paris').subtract(2, 'years');

        const personalizedContent =
            firstdate.toISOString() +
            '\n' +
            content
                .replace(/{{company}}/g, this.company)
                .replace(/{{website}}/g, this.website)
                .replace(/{{tonalite}}/g, this.tonalite)
                .replace(/{{style}}/g, this.style)
                .replace(/{{intelligence}}/g, String(this.intelligence));
        await writeFileAsync(personalizedPromptFileText, personalizedContent);
        if (!fileExists) this.lastUpdateDate = null;

        // Call updateWebsite and updatePromptIA if the prompt file was just created or updated
        await this.updateWebsite(req, modifiedDateMoment);
        await this.updatePromptIA(req, modifiedDateMoment);
      return;
    }

    // Update website or prompt if the date has changed
    if (modifiedDateMoment && lastUpdateDateMoment && lastUpdateDateMoment.isAfter(modifiedDateMoment)) {
         await this.updateWebsite(req, modifiedDateMoment);
         await this.updatePromptIA(req, modifiedDateMoment);
    }	
    
		if (lastUpdateDateMoment && lastUpdateDateMoment.isAfter(modifiedDateMoment)) {
				// Update the prompt.txt with the new date and information if the user has been updated
    const content = await this.readGenericPromptFile();
    const personalizedContent =
						lastUpdateDateMoment.toISOString() +
      '\n' +
      content
        .replace(/{{company}}/g, this.company)
        .replace(/{{website}}/g, this.website)
        .replace(/{{tonalite}}/g, this.tonalite)
        .replace(/{{style}}/g, this.style)
        .replace(/{{intelligence}}/g, String(this.intelligence));
				await writeFileAsync(personalizedPromptFileText, personalizedContent);
		}

 			console.log('last update date', lastUpdateDateMoment);
    
  }
  
async updateWebsite(req: CustomRequest, modifiedDateMoment: moment.Moment) {
    const dbconnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    });

    // Check changes for website
    const [updatesWebsite] = (await dbconnection.execute(
      `SELECT * FROM yq0g1_comprofiler_plug_pulogger WHERE profileid = '${this.joomId}' AND fieldname = 'cb_actia_domain' ORDER BY id DESC LIMIT 1`
    )) as [RowDataPacket[], FieldPacket[]];

     const changedateWebsite = updatesWebsite[0]?.changedate;
		const changedateWebsiteMoment = moment.tz(changedateWebsite, 'Europe/Paris').add(2, 'hours');    
    	console.log("Change Date Website:", changedateWebsiteMoment);

    const oldWebsite = updatesWebsite[0]?.oldvalue 
        ? (updatesWebsite[0]?.oldvalue.startsWith('https://')
          ? updatesWebsite[0]?.oldvalue
            : 'https://' + updatesWebsite[0]?.oldvalue)
        : null;

        const newWebsite = updatesWebsite[0]?.newvalue.startsWith('https://')
          ? updatesWebsite[0]?.newvalue
          : 'https://' + updatesWebsite[0]?.newvalue;

    if (changedateWebsiteMoment && modifiedDateMoment && modifiedDateMoment.isBefore(changedateWebsiteMoment)) {
		console.log('updating newWebsite : ', newWebsite);
        try {
          await deleteDocument(req.userEnv!, {
            userid: this.joomId,
            isPrivate: 1,
            docs: [oldWebsite],
          });
        } catch (error) {
          console.error(`Failed to delete docs: ${error}`);
        }

        // Apply the add-url command on the new website value
        try {
          await addURL(req.userEnv!, {
            userid: this.joomId,
            isPrivate: 1,
            url: [newWebsite],
                selector : 'main, .main, article, #content, .content, section, .post, .entry, .article, .main-content, .mainbody, .body-content, nav, .navbar, .navigation, .menu',
                maxPages: 20,
            numberOfCharactersRequired: 500,
          });
        } catch (error) {
          console.error(`Failed to add url: ${error}`);
        }
      }
}

async updatePromptIA(req: CustomRequest, modifiedDateMoment: moment.Moment) {
    const dbconnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
    });

   const [updatesPromptIA] = (await dbconnection.execute(
        `SELECT * FROM yq0g1_comprofiler_plug_pulogger WHERE profileid = '${this.joomId}' AND fieldname = 'cb_prompt_ia' ORDER BY id DESC LIMIT 1`
    )) as [RowDataPacket[], FieldPacket[]];


   const changedatePromptIA = updatesPromptIA[0]?.changedate;
    const changedatePromptIAMoment = moment.tz(changedatePromptIA, 'Europe/Paris').add(2, 'hours');
    console.log("Change Date Promptia:", changedatePromptIAMoment);

    const oldPromptIA = updatesPromptIA[0]?.oldvalue || null;
    const newPromptIA = updatesPromptIA[0]?.newvalue;

    if (changedatePromptIAMoment && modifiedDateMoment && modifiedDateMoment.isBefore(changedatePromptIAMoment) && oldPromptIA && oldPromptIA !== newPromptIA) {
        console.log('updating newPromptIA : ', newPromptIA);
        try {
            await deleteDocument(req.userEnv!, {
                userid: this.joomId,
                isPrivate: 1,
                docs: ['prompt_monia_user'],
            });
        } catch (error) {
            console.error(`Failed to delete docs: ${error}`);
        }

        // Apply the add-text command on the new cb_prompt_ia value
        try {
            await addTextAsDocument(req.userEnv!, {
                userId: this.joomId,
                isPrivate: 1,
                text: [newPromptIA],
            });
        } catch (error) {
            console.error(`Failed to add text prompt_monia: ${error}`);
        }
    }
}

  async readSystemPromptFile() {
    const systemPromptFilePath = path.join(this.systemPromptDirectory, 'prompt.txt');
    const fileExists = fs.existsSync(systemPromptFilePath);

    // If the file doesn't exist, create it
    if (!fileExists) {
      const initialContent = await this.readGenericPromptFile(); // Get initial content from generic prompt
      await fsPromises.writeFile(systemPromptFilePath, initialContent);
    }

    const content = await fs.promises.readFile(systemPromptFilePath, 'utf8');
    const lines = content.split('\n');
    
    const promptDateString = lines[0];
    
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?([+-]\d{2}:\d{2}|Z)?$/;
    if (isoDatePattern.test(promptDateString) && moment(promptDateString).isValid()) {
      this.PromptDate = moment.tz(promptDateString, 'Europe/Paris').toDate();
//         this.PromptDate = promptDateString.toDate();
      const contentWithoutDate = lines.slice(1).join('\n');
      return contentWithoutDate;
    } else {
        return content;  // Return the entire content if the first line is not a date
        } 
    }

  
}

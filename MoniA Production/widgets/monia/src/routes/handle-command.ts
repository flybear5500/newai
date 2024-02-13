import { Router } from 'express';
import createCommandHandler from '../commands.js';
import express from 'express';
import { CustomRequest } from '../models/UserEnvironment.js';

const router = Router();
const commandHandler = createCommandHandler();

// app.use(async (req: CustomRequest, res: express.Response, next: express.NextFunction)

router.post('/', async (req: CustomRequest, res: express.Response) => {
  if (!req.body || !req.body.command) {
    res.status(400).send({ message: 'Le champ "command" est obligatoire' });
    return;
  }

  const command = req.body.command;
  const userid = req.body.userid;
  const actid = req.body.actid || 0;
  const chatLogActidDirectory = `chat_logs/` + actid + `/1`;
  console.log('command chat directory :', chatLogActidDirectory);
  const isPrivate = req.body.isPrivate;
  const docs = req.body.docs;
  const selector = req.body.selector;
  const maxPages = req.body.maxPages;
  const numberOfCharactersRequired = req.body.numberOfCharactersRequired;
  const folders = req.body.folders;

  switch (command) {
    case 'add-docs':
      // Code to add document - voir pour vérifier la confidentialité sur la base joomla si on arrive pas à la passer dans la requete
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid, isPrivate: isPrivate, docs: docs });
      break;
    case 'add-text':
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid, isPrivate: isPrivate, docs: docs });
      break;
    case 'delete-docs':
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid, isPrivate: isPrivate, docs: docs });
      break;
    case 'delete-mem-conv':
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid, isPrivate: isPrivate, docs: docs });
      break;
    case 'delete-conv':
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid, isPrivate: isPrivate, docs: docs });
      break;
    case 'delete-own-conv':
      await commandHandler.execute(command, { userDir: chatLogActidDirectory, docs: docs });
      break;
    case 'show-conv':
      const files = await commandHandler.execute(command, { userDir: chatLogActidDirectory, userid: userid });
      console.log(files); //important pour typescript sinon erreur de code
      res.status(200).send(files);
      return;
      break;
    case 'erase-user':
      // Code to handle delete all folders and user command
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid, folders: folders });
      break;
    case 'reset':
      // Code to handle reset chat command
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid });
      break;
    case 'add-url':
      // Code to handle add URL command
      await commandHandler.execute(command, {
        userEnv: req.userEnv,
        userid: userid,
        isPrivate: isPrivate,
        url: docs,
        selector: selector,
        maxPages: maxPages,
        numberOfCharactersRequired: numberOfCharactersRequired,
      });
      break;
    case 'add-youtube':
      // Code to handle add YouTube command
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid, isPrivate: isPrivate, url: docs });
      break;
    case 'context-config':
      // Code to handle set context config command
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid }); // args would need to be defined based on your specific needs
      break;
    case 'memory-config':
      // Code to handle set memory config command
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid }); // args would need to be defined based on your specific needs
      break;
    case 'toggle-window-memory':
      // Code to handle toggle window buffer memory command
      await commandHandler.execute(command, { userEnv: req.userEnv, userid: userid }); // args would need to be defined based on your specific needs
      break;
    default:
      res.status(400).send({ message: 'Commande inconnue' });
  }

  res.status(200).send({ message: 'Commande traitée avec succès' });
});

export default router;

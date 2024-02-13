import { HNSWLib } from 'langchain/vectorstores/hnswlib';

/**
 * Retrieves relevant context for the given question by performing a similarity search on the provided vector store.
 * @param {HNSWLib} vectorStore - HNSWLib is a library for approximate nearest neighbor search, used to
 * search for similar vectors in a high-dimensional space.
 * @param {string} sanitizedQuestion - The sanitized version of the question that needs to be answered.
 * It is a string input.
 * @param {number} numDocuments - The `numDocuments` parameter is the number of documents that the
 * `getRelevantContext` function should retrieve from the `vectorStore` based on their similarity to
 * the `sanitizedQuestion`.
 * @param {string} isPrivate - The privacy status of the documents.
 * @returns The function `getRelevantContext` is returning a Promise that resolves to a string. The
 * string is the concatenation of the `pageContent` property of the top `numDocuments` documents
 * returned by a similarity search performed on a `vectorStore` using the `sanitizedQuestion` as the
 * query. The resulting string is trimmed and all newline characters are replaced with spaces.
 */

// function testFilter() {
//     // Création de faux documents avec différentes valeurs pour 'isPrivate' et 'actid'
//     const docs = [
//         { metadata: { isPrivate: undefined, actid: undefined } },
//         { metadata: { isPrivate: 2, actid: 11827 } },
//         { metadata: { isPrivate: 4, actid: 0 } },
//         { metadata: { isPrivate: 4 } },
//         { metadata: { isPrivate: 64, actid: 11827 } },
//         { metadata: { isPrivate: 128, actid: 99999 } },
// 		{ metadata: { isPrivate: 128 } },
//         { metadata: { isPrivate: 4096, actid: undefined } },
//         { metadata: { isPrivate: 256 } }, // Document sans metadata actid
//     ];
//
//     // Codes de confidentialité des utilisateurs à tester
//     const user_privacies = [1, 2, 4, 128, 576, 4672, 12864];
//
//     // Les actid à tester
//     const actids = [undefined, 0, 11827];
//
//     // Pour chaque code de confidentialité de l'utilisateur et pour chaque actid, créer un filtre et tester chaque document
//     for (const user_privacy of user_privacies) {
//         console.log(`Testing user_privacy: ${user_privacy}`);
//
//         for (const actid of actids) {
//             console.log(`Testing actid: ${actid}`);
//             const filter = createFilter(user_privacy, false, actid); // supposons que isUserHolder est toujours false pour ces tests
//
//             for (const doc of docs) {
//                 const result = filter(doc);
//                 console.log(`Document with isPrivate ${doc.metadata.isPrivate} and actid ${doc.metadata.actid} is ${result ? '' : 'not '}accessible`);
//             }
//             console.log('----------------');
//         }
//     }
// }

function hasAccess(user_privacy: number, doc_isPrivate: number) {
  // Si doc_isPrivate est 0 ou 1, tout le monde a accès
  if (doc_isPrivate <= 1) {
    return true;
  }

  // Si user_privacy est 2 ou plus, l'utilisateur a accès aux documents jusqu'au niveau 1 inclus
  if (user_privacy >= 2) {
    if (doc_isPrivate <= 2) {
      return true;
    }
  }

  // Si user_privacy est 4 ou plus, l'utilisateur a accès aux documents jusqu'au niveau 2 inclus
  if (user_privacy >= 4) {
    if (doc_isPrivate <= 4) {
      return true;
    }
  }

  // Si user_privacy est 64 ou plus, l'utilisateur a accès uniquement aux documents du niveau 64
  if (user_privacy === 64) {
    if (doc_isPrivate === 64) {
      return true;
    }
  }

  // Sinon, vérifiez si tous les bits de doc_isPrivate sont inclus dans user_privacy
  if ((doc_isPrivate & user_privacy) === doc_isPrivate) {
    return true;
  }

  return false;
}

const createFilter = (user_privacy: number, isUserHolder: boolean, actid?: number) => {
  return (doc: any) => {
    const doc_actid = doc.metadata?.actid;
    const doc_isPrivate = doc.metadata?.isPrivate;

    // Si actid est supérieur à 0, alors on filtre d'abord par actid si le metadata actid existe
    if (actid && actid > 0 && doc_actid !== undefined) {
      // Si actid et doc_actid sont différents, le document n'est pas accessible
      if (doc_actid !== actid) {
        return false;
      }
    }

    // Si l'utilisateur est le détenteur du document, il a accès à ce document
    if (isUserHolder) {
      return true;
    }

    // Si le document n'a pas de metadata isPrivate, il est inclus pour tout le monde
    if (typeof doc_isPrivate === 'undefined') {
      return true;
    }

    // Utilisez la fonction personnalisée pour vérifier l'accès
    if (hasAccess(user_privacy, doc_isPrivate)) {
      return true;
    }

    // Pour tous les autres cas, ne renvoie aucun document
    return false;
  };
};

async function getRelevantContext(
  vectorStore: HNSWLib,
  sanitizedQuestion: string,
  numDocuments: number,
  user_privacy: number,
  isUserHolder: boolean,
  actid?: number
): Promise<string> {
  // Define a filter function that checks if a document's private property matches the provided private value
  //    const filter = (doc: any) => doc.metadata?.isPrivate === 0 || doc.metadata?.isPrivate === user_privacy;

  if (!vectorStore || typeof vectorStore.similaritySearch !== 'function') {
    throw new Error('vectorStore is not properly initialized or does not have a similaritySearch method');
  }

  const filter = createFilter(user_privacy, isUserHolder, actid);

  const documents = await vectorStore.similaritySearch(sanitizedQuestion, numDocuments, filter);
  // Return the pageContent of the relevant documents
  return documents
    .map((doc) => doc.pageContent)
    .join(', ')
    .trim()
    .replaceAll('\n', ' ');
}

//  export { getRelevantContext, testFilter };
export { getRelevantContext };

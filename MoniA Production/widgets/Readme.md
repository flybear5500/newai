Our website is on joomla 5 which takes care of the front and back end and the SQL DB

Subscriptions are managed through the website. Once subscribed a customer can download the MoniA plugin.

The plugin installs a widget on its own website. The widget is responsible to send the correct customer data to our node.js application with the question, there is a RAG on our node.js with the customer HnsWlib vector DB then it displays the answer on the customer website.

Chats are kept in another instance of the customer HnsWlib to be analyzed later. The customer can choose whether to keep each chat or not.

MoniA is managed from our server front end by the customer when accessing its profile.

The customer can add docs to its vector DB. We used embeddings from OpenAI and then store docs in the customer own HnsWlib

The process is managed by auto actions on our website that call some command on the node.js (see folder commands)

There is a token count on the node.js application which allows the decreasing of the customer points and allow a purchase of more tokens when its subscription level is reached (number of authorized question depending on the purchased plan)

This is the development version of MoniA installed on https://devel.cercle.business

This is still on typescript for now. When using the userid 11875 we can test with the python code and the fastapi python route /process-question
When using any other user this is the typescript code.

Don't change this as we have some investors testing the new SMS version

In this dev version, we tried to have MoniA behave as a multi tool agent but the result is not that good.

We also added the ability for a customer to buy a phone number with our partner and allow MoniA to receive questions and send answers through SMS
For now we tested on Vonage but we'll move to our partner SFR when their API will be ready in a couple of months.
Their API will use plain REST with https instead of Vonage integrated node.js

TODO :
- we need to change the commands in order to use neuralDB instead of HnsWlib for all storing of documents and chats.
- The idea would be to have two neuralDB models per customer : one for its documents, one for its archived chats with its visitors/employees

- The neuralDB is stored on another server located at http://95.217.178.108/search?user-model=95.217.178.108/23869374-e8d4-489d-8aad-e5700b10a3c8
- This is a test exemple

- The neuralDBs will be on different servers depending on the customers : small ones will be at the address above, bigger ones will have their own server IP with a token to access them
- The fields in Joomla to store the infos will be : cb_actia_ndb_ip and cb_actia_ndb_ext_token
- We can add more fields if needed.

- We need to change the code to process question from typescript to python in order to use neuralDB and to allow implementation of new tools after.
- So the idea is to move from a single chatBot to a multi tool agent.

- The Cercle widget used to display on customers website has already been adapted to display some tools and the answer.

- When moving to python, it's important to respect the format used by the widget. The output parser used outputs data like this : https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain/agents/conversational_chat/prompt.py
- 
- FORMAT_INSTRUCTIONS = """RESPONSE FORMAT INSTRUCTIONS
----------------------------

When responding to me, please output a response in one of two formats:

**Option 1:**
Use this if you want the human to use a tool.
Markdown code snippet formatted in the following schema:

```json
{{{{
    "action": string, \\\\ The action to take. Must be one of {tool_names}
    "action_input": string \\\\ The input to the action
}}}}
```

**Option #2:**
Use this if you want to respond directly to the human. Markdown code snippet formatted in the following schema:

```json
{{{{
    "action": "Final Answer",
    "action_input": string \\\\ You should put what you want to return to use here
}}}}
```"""


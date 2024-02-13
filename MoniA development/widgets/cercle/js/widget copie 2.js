const domain = "https://devel.cercle.business";
const scriptSrc = document.currentScript.src;
const pathMatch = scriptSrc.match(/path=([^&]*)/);
const path = pathMatch ? pathMatch[1] : null;
const page = window.location.origin;
var answersElement;
const tempElement = document.createElement("div");
var prompt = "";
var assistantNickname = "MoniA";
var last_question;
var last_answer;
let queue = [];
let buffer = '';
let regex = /^data: (.+)\n/gm;
let match;
let delay = 0;
let answers = localStorage.getItem(page + "_answers") || "";
let answer_array = answers.split("|");
let isLoggedIn;

if (path == null) {  }
const frameUrl = `${domain}/${path}&format=raw`;

class MoniaWebComponent extends HTMLElement {
    constructor() {
        super();

        this.shadow = this.attachShadow({mode: 'open'});

        const style = document.createElement('style');
        style.textContent = `
		
		`;
		this._domainChecked = false;
        this.shadow.appendChild(style);
        this.aiurl = '';
        this.atid = '';
        this.baseUrl = '';
        this.currentResponse = "";
        this.parentPageData = null;
        this.emptyInputCounter = 0;
        this.last_question = "";
        this.last_answer = "";
        this.messageDisplayed = false;

        this.isRecording = false;
        this.countdownDuration = 60;
        this.countdown = this.countdownDuration;
        this.mediaRecorder = null;
        this.audioBlob = null;
        this.audioType = null;

    }


    async loadPageContent(shadowRoot, content) {
        if (path) {
            const widgetWrapper = document.createElement("div");
            widgetWrapper.classList.add("activ-ha-widget__wrapper", "activ-ha-widget__wrapper--closed");
            widgetWrapper.style.width = "64px";
            widgetWrapper.style.height = "64px";
            widgetWrapper.style.position = "fixed";
            widgetWrapper.style.bottom = "50px";
            widgetWrapper.style.left = "50%";
            widgetWrapper.style.transform = "translateX(-50%)";
            widgetWrapper.style.overflow = "auto";
            widgetWrapper.style.border = "0";
            widgetWrapper.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
            widgetWrapper.style.filter = "drop-shadow(0 0 8px rgba(0, 0, 0, 0.16))";
            widgetWrapper.style.zIndex = 2147483000;
            shadowRoot.appendChild(widgetWrapper);

            const openIcon = document.createElement("img");
            openIcon.className = "activ-ha-widget__icon--open";
            openIcon.src = `${domain}/widgets/cercle/assets/cercle-business-MoniA.png`;
            openIcon.width = 64;
            openIcon.style.position = "absolute";
            openIcon.style.bottom = 0;
            openIcon.style.left = "50%";
            openIcon.style.transform = "translateX(-50%)";
            openIcon.style.cursor = "pointer";
            widgetWrapper.appendChild(openIcon);

            const closeIcon = document.createElement("img");
            closeIcon.className = "activ-ha-widget__icon--close";
            closeIcon.width = 16;
            closeIcon.style.display = "none";
            closeIcon.style.cursor = "pointer";
            closeIcon.style.position = "absolute";
            closeIcon.style.top = "10px";
            closeIcon.style.right = "10px";
            closeIcon.style.zIndex = 2147483001;
            closeIcon.src = `${domain}/widgets/cercle/assets/cross-outline.png`;
            widgetWrapper.appendChild(closeIcon);

            const widgetContainer = document.createElement("div");
            widgetContainer.style.width = "100%";
            widgetContainer.style.height = "0";
            widgetContainer.style.display = "flex";
            widgetContainer.style.justifyContent = "center";
            widgetContainer.style.alignItems = "center";
            widgetContainer.style.borderRadius = "10px";
            widgetWrapper.appendChild(widgetContainer);

            const contentDiv = document.createElement("div");
            contentDiv.innerHTML = content;
            contentDiv.style.width = "100%";
            contentDiv.style.height = "100%";
            contentDiv.style.position = "relative";
            contentDiv.style.overflow = "auto";
            contentDiv.style.display = "none";
            contentDiv.style.borderRadius = "16px";
            
								contentDiv.style.background = "rgba(202, 144, 210, 0.13);"
								contentDiv.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.1);"
								contentDiv.style.backdropFilter = "blur(8.2px);"								
                contentDiv.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
                contentDiv.style.filter = "drop-shadow(0 0 20px rgba(0, 0, 0, 0.16))";            
            
            
            contentDiv.classList.add("activ-ha-widget");
            widgetContainer.appendChild(contentDiv);

            const loaderStyleSheet = document.createElement("link");
            loaderStyleSheet.rel = "stylesheet";
            loaderStyleSheet.type = "text/css";
            loaderStyleSheet.href = `${domain}/widgets/cercle/css/load8.css`;
            //shadowRoot.appendChild(loaderStyleSheet);


            const tempStyleSheet = document.createElement("link");
            tempStyleSheet.rel = "stylesheet";
            tempStyleSheet.type = "text/css";
            tempStyleSheet.href = `${domain}/widgets/cercle/css/template.min.css`;
           // shadowRoot.appendChild(tempStyleSheet);

            const userStyleSheet = document.createElement("link");
            userStyleSheet.rel = "stylesheet";
            userStyleSheet.type = "text/css";
            userStyleSheet.href = `${domain}/widgets/cercle/css/user.css`;
            //shadowRoot.appendChild(userStyleSheet);

            const fontStyleSheet = document.createElement("link");
            fontStyleSheet.rel = "stylesheet";
            fontStyleSheet.type = "text/css";
            fontStyleSheet.href = `${domain}/media/activha/fonts/font.min.css`;
          //  shadowRoot.appendChild(fontStyleSheet);

            openIcon.addEventListener("click", async function () {
                openIcon.style.display = "none";
                closeIcon.style.display = "block";
                widgetWrapper.classList.add("loading");
                widgetWrapper.style.width = "80%";
                widgetWrapper.style.minWidth = "330px";
                widgetWrapper.style.maxWidth = "600px";
                widgetWrapper.style.height = "500px";
                widgetWrapper.style.border = "2px #673ab7 solid";
                widgetWrapper.style.borderRadius = "10px";
                widgetContainer.style.height = "500px";
                widgetWrapper.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
                widgetWrapper.style.filter = "drop-shadow(0 0 20px rgba(0, 0, 0, 0.16))";
                widgetWrapper.classList.remove("activ-ha-widget__wrapper--closed");
                widgetWrapper.classList.add("activ-ha-widget__wrapper--opened");
                contentDiv.style.display = "block";
            });

            closeIcon.addEventListener("click", function () {
                openIcon.style.display = "block";
                closeIcon.style.display = "none";
                contentDiv.style.display = "none";
                widgetWrapper.classList.remove("loading");
                widgetWrapper.style.width = "64px";
                widgetWrapper.style.height = "64px";
                widgetWrapper.style.border = "0";
                widgetContainer.style.height = "0";
                widgetWrapper.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
                widgetWrapper.style.filter = "drop-shadow(0 0 8px rgba(0, 0, 0, 0.16))";
                widgetWrapper.classList.remove("activ-ha-widget__wrapper--opened");
                widgetWrapper.classList.add("activ-ha-widget__wrapper--closed");
            });
        }
        this.updateWebComponentState(this.isLoggedIn);
    }

    async connectedCallback() {    
        try {
            let isLoggedIn = false;
            if (!this.tokenValidated) {
                const token = this.getAttribute('token');
                const isValid = await this.isTokenValid(token);

                if (isValid) {
                    this.tokenValidated = true;
                    isLoggedIn = true;
                }
            }


            this._contentLoaded = new Promise(async (resolve) => {
                const response = await fetch(frameUrl);
                const content = await response.text();

                await this.loadPageContent(this.shadowRoot, content);
                resolve();

                window.submitClicked = this.submitClicked.bind(this);
                window.clearClicked = this.clearClicked.bind(this);
                window.submitLogin = this.submitLogin.bind(this);
                window.disconnect = this.disconnect.bind(this);
                window.signupClicked = this.signupClicked.bind(this);
                window.resizeTextarea = this.resizeTextarea.bind(this);

                const isLoggedIn = localStorage.getItem(page + "_isLoggedIn");
                this.updateWebComponentState(isLoggedIn == 1);

                const recordButton = this.shadowRoot.getElementById("recordButton");
                recordButton.addEventListener("click", () => this.startRecording());

            });
			await this.adjustFontSize();
            await this._contentLoaded;
            await this.initActiaDev();
            await this.checkDomain();
			if (!this._domainChecked) {
				answers = " Oupsss, je suis désolée, mais il semble que ma configuration ne fonctionne pas encore sur ce site. Son propriétaire doit déclarer ce domaine dans son espace client avant que je ne puisse vous répondre...<br><br>";
				answersElement.insertAdjacentHTML('beforeend', answers);
				
				return;
			}
            if (super.connectedCallback) {
                super.connectedCallback();
            }
        } catch (error) {
            console.error('Error loading template:', error);
        }
    }

    async checkDomain() {
        if (!this._domainChecked) {
            const checkDomain = this.shadowRoot.getElementById('monia');
            let baseUrl;

            if (checkDomain) {
                baseUrl = checkDomain.getAttribute('data-domain');
            }

            baseUrl = baseUrl.trim();
            if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
                baseUrl = 'https://' + baseUrl;
            }

            try {
                const baseHostname = new URL(baseUrl).hostname;
                const currentHostname = window.location.hostname;
            const domainHostname = new URL(domain).hostname;
                

            if (baseHostname !== currentHostname && domainHostname !== currentHostname) {
                    alert("MoniA ne peut pas fonctionner sur ce site parce que vous n'avez pas ajouté le domaine dans votre espace client Cercle Business. Ajoutez votre domaine et rechargez cette page ensuite...");
                    this._domainChecked = false;
                } else {
                    this._domainChecked = true;
                }
            } catch (error) {
                console.error("Erreur lors de la vérification du domaine :", error);
                this._domainChecked = false;
            }
        }
    }

 async adjustFontSize() {
    const htmlElement = document.querySelector('html');
    const fontSize = parseFloat(getComputedStyle(htmlElement).fontSize);
// 	console.log("taille ",fontSize);
    if (fontSize < 16) {
      const customCSS = `     
		#monia {
			padding-bottom: 80px !important;
		}
		.small, .text-sm, small {
		  font-size: 12.5px !important;
		}

		.fs-1 {
		  font-size: 40px !important;
		}

		.fs-6, #userInput, #sendIA, #testai, #cbia, #answers, #output, #thinking, #written-input-template, #audio-input-template, #recordButton, #errorMessage, #ajaxLoginForm, #ajaxRegisterForm, #connect-link, #signup-link, #registerIA, #signinIA, form-control {
		font-size: 16px !important;
		}
		.mb-3 {
margin-bottom: 16px !important;
}

		.mt-5 {
		margin-top: 80px !important;
		}
      `;
      const styleElement = document.createElement('style');
      styleElement.textContent = customCSS;
      this.shadowRoot.appendChild(styleElement);
    }
  }    
    
    startRecording() {
        this.startRecording();
    }

    stopRecording() {
        this.stopRecording();
    }

    submitClicked() {
        this.chatbotprocessinput();
    }

    clearClicked() {
        this.clearLocalStorage();
    }

    resizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    submitLogin() {
        this.loginUserAjax();
    }

    signupClicked() {
        this.registerUserAjax();
    }

    disconnect() {
        this.disconnectUser();
    }

    receiveDataFromParent(data) {
        this.parentPageData = data;
    }

    getUserInputValue() {
        const userInput = this.shadowRoot.getElementById('userInput');
        return userInput ? userInput.value : null;
    }

    setUserInputValue(value) {
        const userInput = this.shadowRoot.getElementById('userInput');
        if (userInput) {
            userInput.value = value;
        }
    }

    getAnswersValue() {
        const answers = this.shadowRoot.getElementById('answers');
        return answers ? answers : null;
    }

    getAnswersElement() {
        const answers = this.shadowRoot.getElementById('answers');
        return answers.innerHTML ? answers.innerHTML : null;
    }

    getThinkingValue() {
        const thinking = this.shadowRoot.getElementById('thinking');
        return thinking ? thinking : null;
    }

    updateInnerHtml(elementId, newHtml) {
        const element = this.shadowRoot.getElementById(`${elementId}`);
        if (element) {
            element.innerHTML = newHtml;
        } else {
            console.error(`Element with ID '${elementId}' not found.`);
        }
    }

    isLocalStorageAvailable() {
        if (localStorageState !== 'unknown') {
            return localStorageState === 'available';
        }
        const testKey = "test";
        try {
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            localStorageState = 'available';
        } catch (e) {
            localStorageState = 'unavailable';
        }
        return localStorageState === 'available';
    }

    clearLocalStorage() {
        try {
            localStorage.setItem(window.location.origin + "_answers", "");
            if (answersElement) {
                answersElement.innerHTML = "";
                this.updateAnswersElementClass();
            }
        } catch (error) {
            console.error('Error in clearLocalStorage:', error);
        }
    }

    manageCounter(actia_session_id) {
        try {
            let counter = parseInt(localStorage.getItem(actia_session_id + '_counter')) || 0;
            if (counter < 5) {
                counter++;
                localStorage.setItem(actia_session_id + '_counter', counter);
            }
            return counter;
        } catch (error) {
            console.error('Error in manageCounter:', error);
            return 0;
        }
    }

    getSessionID() {
        try {
            let sessionID = localStorage.getItem(page + '_actia_session_id');
            if (!sessionID) {
                sessionID = 'session_' + new Date().getTime();
                localStorage.setItem(page + '_actia_session_id', sessionID);
            }
            return sessionID;
        } catch (error) {
            console.error('Error in getSessionID:', error);
            return 'fallback_session_id';
        }
    }

    updateParentData(data) {
        if (data && data.base) {
            parentData.base = data.base;
        }
        if (data && data.title) {
            parentData.title = data.title;
        }
        if (data && data.description) {
            parentData.description = data.description;
        }
        if (data && data.keywords) {
            parentData.keywords = data.keywords;
        }
        if (data && data.ogData) {
            parentData.ogData = data.ogData;
        }
        if (data && data.textData) {
            parentData.textData = data.textData;
        }
    }

    processQueue(question) {
        this._contentLoaded.then(() => {
            this.aiurl = this.shadowRoot.getElementById('monia').getAttribute('data-aiurl');
        });

        if (queue.length > 0) {
            const message = queue.shift();
            let dataObject, textupdate, question_update, answer_update, conversation_update;

            if (!message.includes("[DONE]")) {
                dataObject = JSON.parse(message);
                if (dataObject.error) {
                    answer_update = " Oupsss, je suis désolée, mais il semble que mes serveurs soient surchargés et en maintenance, je vous remercie de bien vouloir reéssayer dans un petit moment...<br><br>";
                    answersElement.insertAdjacentHTML('beforeend', answer_update);
                    return;
                }

                const text = dataObject.choices[0].delta.content;
                const decodedText = new TextDecoder().decode(new TextEncoder().encode(text));
                this.currentResponse += decodedText;
                answersElement.insertAdjacentHTML('beforeend', decodedText);
                this.updateAnswersElementClass();

                delay = 150;

                setTimeout(() => {
                    this.processQueue(question);
                }, delay);
                const recordButton = this.shadowRoot.getElementById('recordButton');
                recordButton.disabled = true;
            }

            if (message.includes("[DONE]")) {
                answersElement.insertAdjacentHTML('beforeend', "<br><br>");
                question_update = "<span class='fw-bold'>Toi: </span>" + question;
                answer_update = "<br><span class='fw-bold'>" + assistantNickname + ": </span>" + this.currentResponse.replace(/Q: /g, "").replace(/A: /g, "").replace(/R: /g, "").replace(/r: /g, "").replace(/MoniA: /g, "").replace(/MoniA : /g, "");
                conversation_update = question_update + answer_update;
                answers = localStorage.getItem(page + "_answers") || "";
                answers += conversation_update + "|";
                localStorage.setItem(page + "_answers", answers);
                this.currentResponse = "";

                if (answer_array.length > 30) {
                    answer_array.shift();
                }
                answer_array.push(conversation_update);
                const last = this.extractLastQuestionAndAnswer(answer_array.join("|"));
                last_questions: last_question ? (last_question.trim ? last_question.trim() : last_question) : "";
                last_answers: last_answer ? (last_answer.trim ? last_answer.trim() : last_answer) : "";
                const recordButton = this.shadowRoot.getElementById('recordButton');
                recordButton.disabled = false;
                const sendButton = this.shadowRoot.getElementById('sendIA');
                sendButton.textContent = "Envoyer";
                sendButton.disabled = false;
            }
        }
    }

    extractLastQuestionAndAnswer(answers) {
        let pairs = answers.split("|").filter(pair => pair.trim() !== "");
        let lastPair = pairs[pairs.length - 1];

        if (pairs.length > 0) {
            let formattedPair = lastPair.replace(/<[^>]+>/g, '');
            let matchToi = /Toi:\s*(.*)(?=MoniA:)/.exec(formattedPair);
            let last_question = matchToi ? matchToi[1] : "";

            let matchActiA = /MoniA:\s*(.*)/.exec(formattedPair);
            let last_answer = matchActiA ? matchActiA[1] : "";

            this.last_question = last_question;
            this.last_answer = last_answer;
            return {last_question, last_answer};
        }
        return {last_question: "", last_answer: ""};
    }

    addConnectSignupLinks() {
        answersElement = this.getAnswersValue();

        tempElement.innerHTML = answersElement.innerHTML;

        answersElement.innerHTML += `<span class='fw-bold'>MoniA</span> : Je pense qu'il est temps pour vous de vous connecter <a class='btn btn-info btn-sm' id='connect-link' href='#ajaxLoginForm'>Connectez-vous</a> sinon <a class='btn btn-info btn-sm' id='signup-link' href='#SignupForm'>inscrivez-vous</a><br><br>`;

        this.updateAnswersElementClass();
        const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
        errorMessageDiv.style.display = 'none';

        const signupLink = this.shadowRoot.getElementById("signup-link");
        signupLink.addEventListener("click", (e) => {
            e.preventDefault();
            this.shadowRoot.getElementById('ajaxLoginForm').style.display = 'none';
            this.shadowRoot.getElementById('ajaxRegisterForm').style.display = 'block';
            const usernameInput = this.shadowRoot.getElementById('reg_name');
            if (usernameInput) {
                usernameInput.focus();
            }
        });

        const connectLink = this.shadowRoot.getElementById("connect-link");
        connectLink.addEventListener("click", (e) => {
            e.preventDefault();
            this.shadowRoot.getElementById('ajaxLoginForm').style.display = 'block';
            this.shadowRoot.getElementById('ajaxRegisterForm').style.display = 'none';
            const usernameInput = this.shadowRoot.getElementById('username');
            if (usernameInput) {
                usernameInput.focus();
            }
        });

    }

    fetchAIResponse(aiurl, params, question) {
        const self = this;

        fetch(aiurl, {
            method: 'POST', body: JSON.stringify(params), response: 'text'
        }).then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const reader = response.body.getReader();
            if (reader == null) {
                alert("Nous avons rencontré une surcharge réseau, veuillez re-essayer ou reformulez votre questions ?");
            }

            reader.read().then(function processResult(result) {
                if (result.done) {
                    return;
                }
                const text = new TextDecoder().decode(result.value);
                const thinkingElement = self.getThinkingValue();
                if (thinkingElement) {
                    thinkingElement.innerHTML = "";
                }

                while ((match = regex.exec(text)) !== null) {
                    const message = match[1];
                    queue.push(message);
                }
                self.processQueue(question);

                setTimeout(() => {
                    return reader.read().then(processResult);
                }, delay);
            });
        }).catch(error => {
            console.error('Error in fetchAIResponse:', error);
        });
    }

    chatbotprocessinput(questionText = null) {
        try {
            this._contentLoaded.then(() => {
                const variablesElement = this.shadowRoot.getElementById('monia');
                console.log('Step 1: variablesElement', variablesElement);
                if (variablesElement) {
                    const aiurl = variablesElement.getAttribute('data-aiurl');
                    const baseUrl = variablesElement.getAttribute('data-domain');
                    const user = parseInt(variablesElement.getAttribute('data-user'), 10) || 0;
                    const eventowner = parseInt(variablesElement.getAttribute('data-eventowner'), 10) || 0;
                    const actid = parseInt(variablesElement.getAttribute('data-actid'), 10) || 0;
                    const atidRaw = variablesElement.getAttribute('data-atid');
                    const atidRegex = /&atid=(\d+)/;
                    const atidMatch = atidRaw.match(atidRegex);
                    const atid = atidMatch ? parseInt(atidMatch[1], 10) : 0;

                    console.log("atid ", atid);

                    let actia_session_id = this.getSessionID();
                    const isLoggedIn = localStorage.getItem(page + "_isLoggedIn");
                    if (isLoggedIn !== "1") {
                        let counter = this.manageCounter(actia_session_id);
                        if (counter >= 5 && !this.isLoggedIn && !this.messageDisplayed) {
                            const sendButton = this.shadowRoot.getElementById('sendIA');
                            sendButton.disabled = true;
                            const recordButton = this.shadowRoot.getElementById('recordButton');
                            recordButton.disabled = true;
                            this.addConnectSignupLinks();
                            return;
                        }
                    }
                    let question = questionText || this.getUserInputValue();
                    if (question.trim() !== "") {
                        let theprompt = prompt + "Q: " + question;
                        this.emptyInputCounter = 0;
                        let thinkingElement = this.getThinkingValue();
                        if (thinkingElement) {
                            thinkingElement.innerHTML = "<div class=\"alert bg-aha-info d-flex align-items-center\" role=\"alert\"> Thinking<div class=\"spinner-grow spinner-grow-sm ms-3\" role=\"status\"><span class=\"visually-hidden\">Loading...</span></div></div>";
                            const recordButton = this.shadowRoot.getElementById('recordButton');
                            recordButton.disabled = true;
                            const sendButton = this.shadowRoot.getElementById('sendIA');
                            sendButton.textContent = "Waiting...";
                            sendButton.disabled = true;
                        }

                        if (answer_array.length > 0) {
                            answer_array = answer_array.slice(-30);
                            answers = answer_array.join("|");
                            let {last_question, last_answer} = this.extractLastQuestionAndAnswer(answers);
                        }
                        let last_question_update = "<span class='fw-bold'>Toi: </span>" + question;
                        answersElement.innerHTML += last_question_update + "<br>";
                        answersElement.innerHTML += "<span class='fw-bold'>MoniA: </span>";
                        const params = {
                            prompt: theprompt,
                            user: user,
                            base: baseUrl,
                            eventowner: eventowner,
                            actid: actid,
                            data_website: this.parentPageData,
                            last_questions: this.last_question ? this.last_question.trim() : "",
                            last_answers: this.last_answer ? this.last_answer.trim() : "",
                        };
                        this.fetchAIResponse(aiurl, params, question);
                        this.setUserInputValue("");
                        return question;

                    } else {
                        this.emptyInputCounter++;

                        let tempmessage;
                        const recordButton = this.shadowRoot.getElementById('recordButton');

                        if (this.emptyInputCounter === 1) {
                            tempmessage = "Quelle est votre question ?";
                            recordButton.disabled = false;
                        } else if (this.emptyInputCounter === 2) {
                            tempmessage = "Vous ne m'avez posé aucune question, pas facile de répondre même pour une IA ! Que voulez-vous savoir ? Comment puis je vous aider ?";
                            recordButton.disabled = false;
                        } else if (this.emptyInputCounter >= 3) {
                            tempmessage = "N'hésitez pas à poser une question...";
                            recordButton.disabled = false;
                        }
                        answersElement = this.getAnswersValue();
                        answersElement.innerHTML += "<span class='fw-bold'>MoniA: </span>" + tempmessage + "<br><br>";
                    }
                }
            }); 
        } catch (e) {
            console.error('Error in chatbotProcessInput:', e);
        }
    }

    updateAnswersElementClass() {
        if (answersElement.innerHTML.trim() !== "") {
            answersElement.classList.add("bg-light");
        } else {
            answersElement.classList.remove("bg-light");
        }
    }

    initActiaDev() {
        var chatbotprocessinput;
        let messageQueue = [];
        let processingQueue = false;
        let parentData = {
            base: null, title: "", description: "", keywords: ""
        };
        let localStorageCheckPromise;
        let localStorageState = 'unknown';
        let answers;
        answersElement = this.getAnswersValue();

        function getRecentConversations(page, limit) {
            return new Promise((resolve, reject) => {
                const storedValue = localStorage.getItem(`${page}_answers`);
                const answers = storedValue ? storedValue.split("|") : [];
                resolve(answers.slice(-limit).join("|"));
            });
        }

        getRecentConversations(page, 30).then(recentAnswers => {
            answers = recentAnswers;
            const {last_question, last_answer} = this.extractLastQuestionAndAnswer(answers);
            if (answersElement) {
                answersElement.innerHTML = answers.replace(/\|/g, "<br><br>");
                this.updateAnswersElementClass();
            }
        });

    }

    disconnectUser() {
        localStorage.removeItem(page + "_isLoggedIn");
        localStorage.removeItem(page + "_token");
        localStorage.removeItem(page + "_loginDate");
        localStorage.removeItem(page + "_firstname");

        isLoggedIn = false;
        this.shadowRoot.getElementById('ajaxLoginForm').style.display = 'block';
        this.shadowRoot.getElementById('welcomeMessage').style.display = 'none';
        const usernameInput = this.shadowRoot.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
        }
    }

    async loginUserAjax() {
        const username = this.shadowRoot.getElementById('username').value;
        const password = this.shadowRoot.getElementById('password').value;

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const requestOptions = {
            method: 'POST', body: formData,
        };

//Production              //fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=330&Itemid=9343&format=raw`, requestOptions)
        fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=327&Itemid=9343&format=raw`, requestOptions)

            .then(response => {
                const clonedResponse = response.clone();
                response.text().then(text => console.log("Texte de la réponse:", text));
                return clonedResponse.text().then(text => JSON.parse(text));

            })

            .then(data => {
                if (data.success === "true" && data.token && data.token.trim() !== '') {
                    const isLoggedInValue = data.isloggedin;
                    const token = data.token;
                    const firstname = data.firstname;
                    if (token && token.trim() !== '') {
                        console.log('Connexion réussie');
                        localStorage.setItem(page + "_isLoggedIn", 1);
                        localStorage.setItem(page + "_token", token);
                        localStorage.setItem(page + "_firstname", firstname);
                        localStorage.setItem(page + "_loginDate", new Date().toISOString());
                        isLoggedIn = true;
                        this.shadowRoot.getElementById('ajaxLoginForm').style.display = 'none';
                        this.shadowRoot.getElementById('welcomeMessage').style.display = 'block';
                        const sendButton = this.shadowRoot.getElementById('sendIA');
                        sendButton.disabled = false;
                        const recordButton = this.shadowRoot.getElementById('recordButton');
                        recordButton.disabled = false;
                        tempElement.innerHTML = `<span class='fw-bold'>MoniA</span> : Bonjour ` + localStorage.getItem(page + "_firstname") + `, je suis contente de vous revoir et vous ai reconnecté automatiquement.<br><br>Nous pouvons continuer notre discussion... <br><br>`;
                        answersElement.innerHTML = tempElement.innerHTML;

                    }
                } else {
                    console.log('Échec de la connexion');
                    const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                    errorMessageDiv.innerHTML = 'Échec de la connexion. Veuillez vérifier votre nom d\'utilisateur et votre mot de passe.';
                    errorMessageDiv.style.display = 'block';
                    errorMessageDiv.focus();
                    localStorage.removeItem(this.page + "_isLoggedIn");

                }
            })
            .catch(error => {
                console.error('Error:', error);
                const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                errorMessageDiv.innerHTML = 'Une erreur s\'est produite lors de la connexion. Veuillez vérifier votre nom d\'utilisateur et votre mot de passe.';
                errorMessageDiv.style.display = 'block';
                errorMessageDiv.focus();
            });
    }

    async registerUserAjax() {
        const name = this.shadowRoot.getElementById('reg_name').value;
        const firstname = this.shadowRoot.getElementById('reg_firstname').value;
        const email = this.shadowRoot.getElementById('reg_email').value;
        const username = this.shadowRoot.getElementById('reg_username').value;
        const password = this.shadowRoot.getElementById('reg_password').value;
        const variablesElement = this.shadowRoot.getElementById('monia');
        
		const atidRaw = variablesElement.getAttribute('data-atid');
		const atidRegex = /&atid=(\d+)/;
		const atidMatch = atidRaw.match(atidRegex);
		const atid = atidMatch ? parseInt(atidMatch[1], 10) : 0;

        const formData = new FormData();
        formData.append('lastname', name);
        formData.append('firstname', firstname);
        formData.append('email', email);
        formData.append('username', username);
        formData.append('password', password);
        formData.append('atid', atid);        

        const requestOptions = {
            method: 'POST', body: formData
        };

        try {
            const response = await fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=330&Itemid=9343&format=raw` + atid, requestOptions);

//Production
//             const response = await fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=329&Itemid=9343&format=raw` + atid, requestOptions);
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const responseText = await response.text();
            const jsonMatch = responseText.match(/{.*}/);
            if (!jsonMatch) {
                throw new Error('Aucune donnée JSON valide trouvée dans la réponse.');
            }

            const responseData = JSON.parse(jsonMatch[0]);

            if (responseData.success) {
                console.log('Inscription réussie');
                const token = responseData.token;
                const firstname = responseData.firstname;

                if (token && token.trim() !== '') {
                    localStorage.setItem(page + "_isLoggedIn", 1);
                    localStorage.setItem(page + "_token", token);
                    localStorage.setItem(page + "_firstname", firstname);
                    localStorage.setItem(page + "_loginDate", new Date().toISOString());
                    isLoggedIn = true;
                    this.shadowRoot.getElementById('ajaxRegisterForm').style.display = 'none';
                    this.shadowRoot.getElementById('welcomeMessage').style.display = 'block';
                    this.shadowRoot.getElementById('ajaxLoginForm').style.display = 'none';
                    this.shadowRoot.getElementById('welcomeMessage').style.display = 'block';
                    const sendButton = this.shadowRoot.getElementById('sendIA');
                    sendButton.disabled = false;
                    const recordButton = this.shadowRoot.getElementById('recordButton');
                    recordButton.disabled = false;

                    tempElement.innerHTML = `<span class='fw-bold'>MoniA</span> : Merci pour votre inscription, je vous ai connecté automatiquement. Vous allez recevoir vos identifiants de Cercle Business par email ( https://cercle.business est le site qui me propulse)<br><br> Maintenant nous pouvons continuer notre discussion... <br><br>`;
                    answersElement.innerHTML = tempElement.innerHTML;

                } else {
                    console.log('Token vide. Vérifiez la réponse du serveur.');
                    const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                    errorMessageDiv.innerHTML = 'Échec de l\'inscription. Veuillez vérifier les informations fournies. Cet identifiant n\'est pas disponible ou votre email est déjà enregistré sur Cercle Business. Vous pouvez aussi vous inscrire directement sur <a href=="https://cercle-business/inscription-particuliers" target="blank">Cercle Business</a>';
                    errorMessageDiv.style.display = 'block';
                    errorMessageDiv.focus();
                }
            } else {
                console.log('Échec de l\'inscription');
                const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                errorMessageDiv.innerHTML = 'Échec de l\'inscription. Veuillez vérifier les informations fournies. Cet identifiant n\'est pas disponible ou votre email est déjà enregistré sur Cercle Business.';
                errorMessageDiv.style.display = 'block';
                errorMessageDiv.focus();
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
            errorMessageDiv.innerHTML = 'Une erreur s\'est produite lors de l\'inscription. Veuillez réessayer.';
            errorMessageDiv.style.display = 'block';
            errorMessageDiv.focus();
        }
    }

    async updateWebComponentState(isLoggedIn) {
        const token = localStorage.getItem(page + "_token");
        const Logged = localStorage.getItem(page + "_isLoggedIn");
        const ajaxLoginForm = this.shadowRoot.getElementById('ajaxLoginForm');
        const welcomeMessage = this.shadowRoot.getElementById('welcomeMessage');
        const isTokenValid = token ? await this.isTokenValid(token) : false;

        if (!isTokenValid) {
            isLoggedIn = false;
            localStorage.removeItem(page + "_isLoggedIn");
            localStorage.removeItem(page + "_token");
            localStorage.removeItem(page + "_loginDate");
            localStorage.removeItem(page + "_firstname");
        }

        if (this.isLoginExpired()) {
            localStorage.removeItem(page + "_isLoggedIn");
            localStorage.removeItem(page + "_token");
            localStorage.removeItem(page + "_loginDate");
            localStorage.removeItem(page + "_firstname");

            isLoggedIn = 0;
        }

        if (Logged) {
            if (ajaxLoginForm) {
                ajaxLoginForm.style.display = 'none';
            }
            if (welcomeMessage) {
                welcomeMessage.style.display = 'block';
            }
        } else {
            if (ajaxLoginForm) {
            }
            if (welcomeMessage) {
            }
        }
    }

    isLoginExpired() {
        const loginDate = localStorage.getItem(page + "_loginDate");
        if (!loginDate) {
            return true;
        }

        const currentDate = new Date();
        const savedDate = new Date(loginDate);
        const daysPassed = (currentDate - savedDate) / (1000 * 60 * 60 * 24);

        return daysPassed > 30;
    }

    async isTokenValid(token) {
        if (token === null || token.trim() === "") {
            this.updateWebComponentState(false);
            return false;
        }
        const url = new URL(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=328&Itemid=9343&format=raw`);
        url.searchParams.append('token', token);

//Production
 //       const url = new URL(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=331&Itemid=9343&format=raw`);
        const requestOptions = {
            method: 'POST'
        };

        const response = await fetch(url, requestOptions);

        const responseText = await response.text();

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = JSON.parse(responseText);
            return data.valid;
        } else {
            this.updateWebComponentState(false);
            return false;
        }
    }

    async convertToWav(audioBuffer) {
        const numOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChannels * 2;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        this.writeUTFBytes(view, 0, "RIFF");
        view.setUint32(4, 36 + length, true);
        this.writeUTFBytes(view, 8, "WAVE");
        this.writeUTFBytes(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numOfChannels, true);
        view.setUint32(24, audioBuffer.sampleRate, true);
        view.setUint32(28, audioBuffer.sampleRate * numOfChannels * 2, true);
        view.setUint16(32, numOfChannels * 2, true);
        view.setUint16(34, 16, true);
        this.writeUTFBytes(view, 36, "data");
        view.setUint32(40, length, true);
        const data = new Float32Array(audioBuffer.length);
        let offset = 44;
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            audioBuffer.copyFromChannel(data, i);
            for (let j = 0; j < data.length; j++, offset += 2) {
                const sample = Math.max(-1, Math.min(1, data[j]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            }
        }

        return new Blob([view], {type: "audio/wav"});
    }

    writeUTFBytes(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    async sendAudioToApi(audioBlob, audioType) {
        const formData = new FormData();
        const mimeTypeToExtension = {
            'audio/mp3': 'mp3',
            'audio/mp4': 'mp4',
            'audio/mpeg': 'mpeg',
            'audio/mpga': 'mpga',
            'audio/m4a': 'm4a',
            'audio/wav': 'wav',
            'audio/wave': 'wave',
            'audio/webm': 'webm',
        };

        const fileExtension = mimeTypeToExtension[audioType] || '';

        formData.append('audio', audioBlob, `audio.${fileExtension}`);


//Production
//        const response = await fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=332`, {  
        const response = await fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=321`, {      
            method: 'POST', body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            if (data.error) {
                console.error('Erreur API:', data.error);
            } else {
                const parsedData = JSON.parse(data);
                const transcription = parsedData.text;
                console.log('text:', transcription);
                this.chatbotprocessinput(transcription);
            }
        } else {
            console.error('Erreur:', response.statusText);
        }
    }

    updateCountdown() {
        const recordButton = this.shadowRoot.getElementById('recordButton');
        const progressBar = this.shadowRoot.querySelector('.progress-bar');
        recordButton.style.backgroundImage = `url('${domain}/widgets/cercle/assets/recording.png')`;

        if (this.countdown > 0) {
            const progressPercentage = (this.countdown / this.countdownDuration) * 100;
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.innerHTML = `${this.countdown}s`;
            recordButton.BackgroundColor = `#fff`;
            this.countdown -= 1;
        } else {
            this.stopRecording();
        }
    }

    stopRecording() {
        const recordButton = this.shadowRoot.getElementById('recordButton');
        const progressBar = this.shadowRoot.querySelector('.progress-bar');

        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }
        const writtenInput = this.shadowRoot.getElementById('written-input-template');
        writtenInput.style.display = 'flex';

        clearInterval(this.countdownInterval);
        recordButton.style.backgroundImage = '';
        progressBar.style.width = `100%`;
        progressBar.innerHTML = ``;
        this.isRecording = false;
        if (this.audioBlob) {
            this.sendAudioToApi(this.audioBlob, this.audioType);
            this.audioBlob = null;
            this.audioType = null;
        }
    }

    async startRecording() {
        if (!this.isRecording) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const gainNode = audioContext.createGain();
                gainNode.gain.value = 3;

                const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
                this.mediaRecorder = new MediaRecorder(mediaStream);
                this.mediaRecorder.start();

                const audioChunks = [];

                this.mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                this.mediaRecorder.addEventListener("stop", async () => {
                    let audioBlob, audioType;
                    if (navigator.userAgent.indexOf("Safari") != -1 && navigator.userAgent.indexOf("Chrome") == -1) {
                        audioBlob = new Blob(audioChunks, {type: "audio/m4a"});
                        audioType = "audio/m4a";
                    } else if (navigator.userAgent.indexOf("Firefox") != -1) {
                        audioBlob = new Blob(audioChunks, {type: "audio/webm"});
                        audioType = "audio/webm";
                    } else {
                        audioBlob = new Blob(audioChunks, {type: "audio/wav"});
                        audioType = "audio/wav";
                    }

                    if (audioType !== "audio/wav") {
                        const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
                        audioBlob = await this.convertToWav(audioBuffer);
                        audioType = "audio/wav";
                    }

                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audioElement = this.shadowRoot.getElementById("audioElement");
                    audioElement.src = audioUrl;
                    audioElement.style.display = "none";
                    await this.sendAudioToApi(audioBlob, audioType);
                });

                this.countdown = this.countdownDuration;
                this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);

                setTimeout(() => {
                    this.stopRecording();
                }, this.countdownDuration * 1000);

                this.isRecording = true;
                const recordButton = this.shadowRoot.getElementById('recordButton');
                recordButton.disabled = true;
                setTimeout(() => {
                    recordButton.disabled = false;
                }, 3000);

            } catch (error) {
                alert("An error occurred while trying to record audio.");
            }
        } else {
            this.stopRecording();
        }
    }
}

customElements.define('monia-web-component', MoniaWebComponent);

function getDataFromParentPage() {
    const base = window.location.href;
    const titleElement = document.querySelector('head > title');
    const descriptionElement = document.querySelector('head > meta[name="description"]');
    const keywordsElement = document.querySelector('head > meta[name="keywords"]');
    const ogElements = document.querySelectorAll('head > meta[property^="og:"]');
    const title = titleElement && titleElement.textContent ? titleElement.textContent : "";
    const description = descriptionElement ? descriptionElement.getAttribute('content') : "";
    const keywords = keywordsElement ? keywordsElement.getAttribute('content') : "";
    const metaData = {
        title, description, keywords
    };
    const ogData = {};
    ogElements.forEach((element) => {
        const property = element.getAttribute('property');
        const content = element.getAttribute('content');
        ogData[property] = content;
    });

    const h1Element = document.querySelector('h1');
    const h1Text = h1Element ? h1Element.textContent : "";
    const textAfterH1 = h1Element && h1Element.nextSibling && h1Element.nextSibling.textContent ? h1Element.nextSibling.textContent.trim() : "";
    const combinedText = (h1Text + ' ' + textAfterH1).slice(0, 500);
    const textData = {
        combinedText
    };
    return {type: 'parentPageData', base, metaData, ogData, textData};
}

function init() {
    if (!document.body) return;
    const moniaElement = document.createElement('monia-web-component');
    moniaElement.id = 'monia-instance';
    document.body.appendChild(moniaElement);

    const MoniAComponent = document.querySelector('monia-web-component');
    const parentPageData = getDataFromParentPage();

    MoniAComponent.receiveDataFromParent(parentPageData);
}

function observeBody() {
    if (document.body) {
        init();
        return;
    }

    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && document.body) {
                init();
                observer.disconnect();
                break;
            }
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
}

observeBody();
if (document.body) {
    init();
}
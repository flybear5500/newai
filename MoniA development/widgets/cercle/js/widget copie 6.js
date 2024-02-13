const domain = 'https://devel.cercle.business';
const scriptSrc = document.currentScript.src;
const pathMatch = scriptSrc.match(/path=([^&]*)/);
const path = pathMatch ? pathMatch[1] : null;
const page = window.location.origin;
var answersElement;
const tempElement = document.createElement("div");
var prompt = "";
var assistantNickname = 'MoniA';
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
let currentKey = "";
let currentValue = "";
let currentAction = "";
let tokBuffer='';
let previousTokens = [];
let inKey;
let currentKeyword = "";
let lastSixChars ="";
 // Pour construire les mots clés "action" et "action_input"
let buildingActionInput = false;
let buildingValue = false;
let buildingKeyword = "";
let isInActionInput = false;
let currentLoadingElement = null;
let accumulatingLink = false;
let accumulatedLinkText = "";
let insideBoldText = false;
let accumulatedBoldText = "";
let possibleImgTagStart = false;
let accumulatedMediaHtmlText = "";
let accumulatingMediaHtml = false;
let isProcessingQueue = false;
let lastAFinalDiv = null;
let lastAToolDiv = null;
let isMaximized = false;

if (path == null) {  }
const frameUrl = `${domain}/${path}&format=raw`;

class MoniaWebComponent extends HTMLElement {
    constructor() {
        super();

        this.shadow = this.attachShadow({mode: 'open'});

        const style = document.createElement('style');
        style.textContent = `
		
		`;
		this.translations = {};
		this._domainChecked = true;
        this.shadow.appendChild(style);
        this.aiurl = '';
        this.atid = '';
        this.baseUrl = '';
        this.currentResponse = "";
        this.parentPageData = null;
        this.emptyInputCounter = 0;
        this.last_question = "";
        this.last_answer = "";
        this.tr_owner = "";
        this.messageDisplayed = false;
        this.chatsLoaded = false;
        this.historyEventAdded = false;

        this.isRecording = false;
        this.countdownDuration = 60;
        this.countdown = this.countdownDuration;
        this.mediaRecorder = null;
        this.audioBlob = null;
        this.audioType = null;
    }

    async loadPageContent(shadowRoot, content) {
        if (path) {
        		const windowWidth = window.innerWidth;        	
            const widgetWrapper = document.createElement("div");
            widgetWrapper.id="monia__wrapper"
            widgetWrapper.classList.add("activ-ha-widget__wrapper", "activ-ha-widget__wrapper--closed");
            if(windowWidth > 1280){
							widgetWrapper.style.width = "64px";
							widgetWrapper.style.height = "64px";
            } else {
							widgetWrapper.style.width = "48px";
							widgetWrapper.style.height = "48px";            
            }
            widgetWrapper.style.position = "fixed";            
            widgetWrapper.style.bottom = "50px";
            widgetWrapper.style.left = "50%";
            widgetWrapper.style.transform = "translateX(-50%)";
            widgetWrapper.style.border = "0";
            widgetWrapper.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
            widgetWrapper.style.zIndex = 2147483000;
            shadowRoot.appendChild(widgetWrapper);

            const openIcon = document.createElement("img");
            openIcon.id = "openIcon";
            openIcon.className = "activ-ha-widget__icon--open";
            openIcon.src = `${domain}/widgets/cercle/assets/cercle-business-MoniA.png`;
            if(windowWidth > 1280){
							openIcon.width = 64;
            } else {
							openIcon.width = 48;
            }
            openIcon.style.position = "absolute";
            openIcon.style.bottom = 0;
            openIcon.style.left = "50%";
            openIcon.style.transform = "translateX(-50%)";
			openIcon.style.backdropFilter = "blur(60px)";
			openIcon.style.background = "rgba(255, 255, 255, 0.15)";
            openIcon.style.cursor = "pointer";
            widgetWrapper.appendChild(openIcon);

            const widgetContainer = document.createElement("div");
            widgetContainer.id = "moniaContainer";
            widgetContainer.style.width = "100%";
            widgetContainer.style.height = "0";
            widgetContainer.style.display = "flex";
            widgetContainer.style.justifyContent = "center";
            widgetContainer.style.alignItems = "center";
            widgetContainer.style.borderRadius = "10px";
            widgetContainer.style.overflow = "auto";
            widgetWrapper.appendChild(widgetContainer);

            const contentDiv = document.createElement("div");
            contentDiv.innerHTML = content;
            contentDiv.style.width = "100%";
            contentDiv.style.height = "100%";
            contentDiv.style.position = "relative";
            contentDiv.style.display = "none";
            contentDiv.classList.add("activ-ha-widget");
            widgetContainer.appendChild(contentDiv);
            
            const MoniAIcon = document.createElement("img");
            MoniAIcon.className = "activ-ha-widget__icon--MoniA";
            MoniAIcon.width = 100;
            MoniAIcon.style.display = "none";
            MoniAIcon.style.position = "absolute";
            MoniAIcon.style.top = "10px";
            MoniAIcon.style.left = "15px";
            MoniAIcon.style.zIndex = 2147483001;
            MoniAIcon.src = `${domain}/widgets/cercle/assets/MoniA.svg`;
            widgetWrapper.appendChild(MoniAIcon);                        

            const loaderStyleSheet = document.createElement("link");
            loaderStyleSheet.rel = "stylesheet";
            loaderStyleSheet.type = "text/css";
            loaderStyleSheet.href = `${domain}/widgets/cercle/css/monia.css`;
            shadowRoot.appendChild(loaderStyleSheet);

			const scriptElement = document.createElement("script");
			scriptElement.src = `${domain}/widgets/cercle/js/JSON5.min.js`;
			shadowRoot.appendChild(scriptElement);            

            openIcon.addEventListener("click", async function () {
                openIcon.style.display = "none";
                section.style.display = "block";
								light.style.display = "block";
								MoniAIcon.style.display = "block";
//                 widgetWrapper.style.width = "80%";

								// Pour les écrans très petits (smartphones)
								if (windowWidth <= 480) {
										widgetWrapper.style.width = "80%";
										widgetWrapper.style.height = "450px";
								} 
								// Pour les écrans moyens (tablettes, etc.)
								else if (windowWidth <= 1280) {
										widgetWrapper.style.width = "40%";
// 										widgetWrapper.style.minWidth = "330px";
										widgetWrapper.style.height = "400px";
								} 
								// Pour les écrans plus grands
								else {
										widgetWrapper.style.width = "600px";
										widgetWrapper.style.height = "500px";
								} 
    
                 widgetWrapper.style.bottom = "50px";
                widgetWrapper.style.minWidth = "330px";
                widgetWrapper.style.maxWidth = "600px";
//                 widgetWrapper.style.height = "500px";				
                 widgetContainer.style.height = "440px";
                widgetWrapper.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
                widgetWrapper.classList.remove("activ-ha-widget__wrapper--closed");
                widgetWrapper.classList.add("activ-ha-widget__wrapper--opened");
							 widgetWrapper.classList.add ("glass-container");
                contentDiv.style.display = "block";
                localStorage.setItem(page + "_window_state", "opened");
                applyStylesBasedOnWidth();
            });
                      
			let section = document.createElement('section');
			section.className = 'window--buttons'; 
			section.style.display = "none";
			section.style.cursor = "pointer";
			section.style.position = "absolute";
			section.style.top = "10px";
			section.style.right = "15px";
			section.style.zIndex = 2147483001;
			let maximizeDiv = document.createElement('div');
			maximizeDiv.className = 'window__maximize'; 
			let closeDiv = document.createElement('div');
			closeDiv.className = 'window__close';
			section.appendChild(maximizeDiv);
			section.appendChild(closeDiv);
			widgetWrapper.appendChild(section);
			
			let light = document.createElement('div');
			light.className = 'dark-light';
			light.style.display = "none";
			light.style.cursor = "pointer";
			light.style.position = "absolute";
			light.style.bottom = "10px";
			light.style.right = "15px";
			light.style.zIndex = 2147483001;
			let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttributeNS(null, "viewBox", "0 0 24 24");
			svg.setAttributeNS(null, "stroke", "currentColor");
			svg.setAttributeNS(null, "stroke-width", "1.5");
			svg.setAttributeNS(null, "fill", "none");
			svg.setAttributeNS(null, "stroke-linecap", "round");
			svg.setAttributeNS(null, "stroke-linejoin", "round");
			let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			path.setAttributeNS(null, "d", "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z");
			svg.appendChild(path);
			light.appendChild(svg);
			widgetWrapper.appendChild(light);	
			

			const closeIcon = shadowRoot.querySelector(".window__close");
			
            closeIcon.addEventListener("click", function () {
                openIcon.style.display = "block";
                section.style.display = "none";
				light.style.display = "none";
				MoniAIcon.style.display = "none";
                contentDiv.style.display = "none";
				 widgetWrapper.style.bottom = "50px";
                widgetWrapper.classList.remove("loading");
            if(windowWidth > 1280){
							widgetWrapper.style.width = "64px";
							widgetWrapper.style.height = "64px";
            } else {
							widgetWrapper.style.width = "48px";
							widgetWrapper.style.height = "48px";            
            }
                widgetWrapper.style.border = "0";
                widgetContainer.style.height = "0";
                widgetWrapper.style.left = "50%";							
                widgetWrapper.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
                widgetWrapper.classList.remove("activ-ha-widget__wrapper--opened");
							 widgetWrapper.classList.remove ("glass-container");
                widgetWrapper.classList.add("activ-ha-widget__wrapper--closed");
                localStorage.setItem(page + "_window_state", "closed");
                closeCanvas();
                isMaximized = false;
            });
            
 			const maxIcon = shadowRoot.querySelector(".window__maximize");
			
            maxIcon.addEventListener("click", function () {
            	if (!isMaximized) { 
					openIcon.style.display = "none";
					section.style.display = "block";
					section.style.right = "15px";
					toggleButton.style.right = "15px";
					toggleButton.style.display = "block";
					contentDiv.style.display = "block";
					widgetWrapper.style.height = "90%";
					widgetWrapper.style.width = "95%";   
					 widgetWrapper.style.bottom = "40px";  
					widgetWrapper.style.minWidth = "none";
					widgetWrapper.style.maxWidth = "none";                             
					widgetContainer.style.height = "100%";
					widgetContainer.style.width = "95%";	
					widgetContainer.style.width = "100%";
					widgetWrapper.style.left = "50%";													
					widgetWrapper.style.transition = "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
					applyStylesBasedOnWidth();
					toggleConversations();
					isMaximized = true;
				} else {	
					openIcon.style.display = "none";			
// 					widgetWrapper.style.width = "100%";

						// Pour les écrans très petits (smartphones)
						if (windowWidth <= 480) {
								widgetWrapper.style.width = "80%";
								widgetWrapper.style.height = "500px";
						} 
						// Pour les écrans moyens (tablettes, ordi bureau, etc.)
						else if (windowWidth <= 1280) {
								widgetWrapper.style.width = "40%";
								widgetWrapper.style.minWidth = "330px";
								widgetWrapper.style.height = "400px";
						} 
						// Pour les écrans plus grands
						else {
								widgetWrapper.style.width = "600px";
								widgetWrapper.style.height = "500px";
						} 
    
					section.style.right = "15px";
					toggleButton.style.right = "15px";
					widgetWrapper.style.minWidth = "330px";
					widgetWrapper.style.maxWidth = "600px";
					 widgetWrapper.style.bottom = "50px";
// 					widgetWrapper.style.height = "500px";				
					applyStylesBasedOnWidth();
					toggleConversations();
					isMaximized = false;
				}
            });         
            
			const lightState = localStorage.getItem(page + "_light") || "0";
			const toggleButton = shadowRoot.querySelector(".dark-light");
			const moniaLight = shadowRoot.getElementById("monia__wrapper");
			const chatsLight = shadowRoot.getElementById("conversations");

			if (lightState === "1") {        
				toggleButton.classList.toggle("light-mode");
				moniaLight.classList.toggle("light-mode");
				chatsLight.classList.toggle("light-mode");
			}

			toggleButton.addEventListener("click", function () {
				toggleButton.classList.toggle("light-mode");
				moniaLight.classList.toggle("light-mode");
				chatsLight.classList.toggle("light-mode");

				if (localStorage.getItem(page + "_light") === "1") {
					localStorage.setItem(page + "_light", "0");
				} else {
					localStorage.setItem(page + "_light", "1");
				}   
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

			let userLanguage = localStorage.getItem('selectedLanguage');
			if (!userLanguage) {
				userLanguage = navigator.language.split('-')[0];
			}
			this.lang = userLanguage;
			this.translations = await this.loadTranslations(userLanguage);

            this._contentLoaded = new Promise(async (resolve) => {
                const response = await fetch(frameUrl);
                const content = await response.text();

                await this.loadPageContent(this.shadowRoot, content);
                resolve();

                window.submitClicked = this.submitClicked.bind(this);
                window.clearClicked = this.clearClicked.bind(this);
// 				window.historyClicked = this.historyClicked.bind(this);
				window.applyStylesBasedOnWidth = this.applyStylesBasedOnWidth.bind(this);
				window.toggleConversations = this.toggleConversations.bind(this);
				window.closeCanvas = this.closeCanvas.bind(this);
                window.submitLogin = this.submitLogin.bind(this);
                window.disconnect = this.disconnect.bind(this);
                window.signupClicked = this.signupClicked.bind(this);
                window.resizeTextarea = this.resizeTextarea.bind(this);

                const isLoggedIn = localStorage.getItem(page + "_isLoggedIn");
                this.updateWebComponentState(isLoggedIn == 1);

                const recordButton = this.shadowRoot.getElementById("recordButton");
                recordButton.addEventListener("click", () => { 
					this.startRecording(); 
					recordButton.disabled = true; 
				});
				
				const stopIcon = this.shadowRoot.querySelector('.stop-icon');
				stopIcon.addEventListener('click', () => {
					this.stopRecording();
				});
                
				const Variables = this.shadowRoot.getElementById('monia');
// 				console.log("variables :",Variables);
				const tr_owner = Variables.getAttribute('data-company');
				
				this.openIcon = this.shadowRoot.querySelector('#openIcon');
				this.closeIcon = this.shadowRoot.querySelector('.window__close');
                
                this.shadowRoot.querySelector('#tr_company').textContent = this.translations.tr_company + tr_owner;
                this.shadowRoot.querySelector('#question0').textContent = this.translations.question0;
                this.shadowRoot.querySelector('#question1').textContent = this.translations.question1;
                this.shadowRoot.querySelector('#question2').textContent = this.translations.question2;
                this.shadowRoot.querySelector('#question3').textContent = this.translations.question3; 
				this.shadowRoot.querySelector('#sendIA').textContent = this.translations.tr_send;                                
				this.shadowRoot.querySelector('#tr_login').textContent = this.translations.tr_login; 
				this.shadowRoot.querySelector('#tr_username').textContent = this.translations.tr_username; 
				this.shadowRoot.querySelector('#tr_password').textContent = this.translations.tr_password; 
 				this.shadowRoot.querySelector('#tr_forgot').textContent = this.translations.tr_forgot; 
				this.shadowRoot.querySelector('#userInput').placeholder = this.translations.tr_placeholder; 
				this.shadowRoot.querySelector('#welcomeMessage').textContent = this.translations.tr_logout;  
				this.shadowRoot.querySelector('#tr_signin').textContent = this.translations.tr_signin; 
				this.shadowRoot.querySelector('#tr_name').textContent = this.translations.tr_name; 				
				this.shadowRoot.querySelector('#tr_firstname').textContent = this.translations.tr_firstname; 								 				
				this.shadowRoot.querySelector('#tr_email').textContent = this.translations.tr_email; 
				this.shadowRoot.querySelector('#tr_id').textContent = this.translations.tr_id; 
				this.shadowRoot.querySelector('#tr_pass').textContent = this.translations.tr_pass; 
				this.shadowRoot.querySelector('#registerIA').value = this.translations.tr_register; 
				this.shadowRoot.querySelector('#tr_dologin').value = this.translations.tr_dologin; 							
				this.shadowRoot.querySelector('#tr_conditions').innerHTML = this.translations.tr_conditions; 
												                                
                const languageSelectElement = this.shadowRoot.getElementById("languageSelect");
                languageSelectElement.value = userLanguage;
				languageSelectElement.addEventListener('change', async (event) => {
					const newLanguage = event.target.value;
					localStorage.setItem('selectedLanguage', newLanguage);
					
					
					this.translations = await this.loadTranslations(newLanguage);
					let tr_company = this.translations.tr_company;
					this.shadowRoot.querySelector('#tr_company').textContent = tr_company + tr_owner;
					this.shadowRoot.querySelector('#question0').textContent = this.translations.question0;
					this.shadowRoot.querySelector('#question1').textContent = this.translations.question1;
					this.shadowRoot.querySelector('#question2').textContent = this.translations.question2;
					this.shadowRoot.querySelector('#question3').textContent = this.translations.question3; 					
					this.shadowRoot.querySelector('#sendIA').textContent = this.translations.tr_send;                                
					this.shadowRoot.querySelector('#tr_login').textContent = this.translations.tr_login; 
					this.shadowRoot.querySelector('#tr_username').textContent = this.translations.tr_username; 
					this.shadowRoot.querySelector('#tr_password').textContent = this.translations.tr_password; 
					this.shadowRoot.querySelector('#tr_forgot').textContent = this.translations.tr_forgot; 
					this.shadowRoot.querySelector('#userInput').placeholder = this.translations.tr_placeholder; 					
					this.shadowRoot.querySelector('#welcomeMessage').textContent = this.translations.tr_logout;  
					this.shadowRoot.querySelector('#tr_signin').textContent = this.translations.tr_signin; 
					this.shadowRoot.querySelector('#tr_name').textContent = this.translations.tr_name; 				
					this.shadowRoot.querySelector('#tr_firstname').textContent = this.translations.tr_firstname; 								 				
					this.shadowRoot.querySelector('#tr_email').textContent = this.translations.tr_email; 
					this.shadowRoot.querySelector('#tr_id').textContent = this.translations.tr_id; 
					this.shadowRoot.querySelector('#tr_pass').textContent = this.translations.tr_pass; 
					this.shadowRoot.querySelector('#registerIA').value = this.translations.tr_register; 	
					this.shadowRoot.querySelector('#tr_dologin').value = this.translations.tr_dologin; 			
					this.shadowRoot.querySelector('#tr_conditions').innerHTML = this.translations.tr_conditions;  
				});

            });
			await this.adjustFontSize();
            await this._contentLoaded;
            await this.initActiaDev();
            await this.checkDomain();
            await this.chats();
            await this.loadJSON5();
            
			const windowState = localStorage.getItem(page + "_window_state");
			if (windowState === null) {
				setTimeout(() => {
					this.openIcon.click();
					localStorage.setItem(page + "_window_state", "opened");
				}, 7000);
			} else if (windowState === "opened") {
				this.openIcon.click(); 
			} 
			
			if (!this._domainChecked) {
				answers = this.translations.misconfiguration;
				answersElement.insertAdjacentHTML('beforeend', answers);
				
				return;
			}
            if (super.connectedCallback) {
                super.connectedCallback();
            }
        } catch (error) {
            console.error(this.translations.loadingTemplateError, error);
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
                    alert(this.translations.misconfalert);
                    this._domainChecked = false;
                } else {
                    this._domainChecked = true;
                }
            } catch (error) {
                console.error(this.translations.uncheckeddomain, error);
                this._domainChecked = false;
            }
        }
    }

	updateComponent() {
		const moniaComponent = this.shadowRoot.querySelector('#monia');
		if (moniaComponent) {
			// Forcer un reflow pour rafraîchir le rendu
			moniaComponent.style.opacity = '0.99';
			setTimeout(() => moniaComponent.style.opacity = '', 50);
// 			console.log('component updated');
		} else {
			console.error('Le composant #monia est introuvable');
		}
	}

	async loadTranslations(userLanguage) {
		let translations;
		try {
			translations = await fetch(`${domain}/widgets/cercle/language/${userLanguage}.json`);
			translations = await translations.json();
		} catch (e) {
			console.error('Error loading language file:', e);
			translations = await fetch(`${domain}/widgets/cercle/language/fr.json`);
			translations = await translations.json();
		}
		this.lang = userLanguage;
		return translations;
	}

	 async adjustFontSize() {
		const htmlElement = document.querySelector('html');
		const fontSize = parseFloat(getComputedStyle(htmlElement).fontSize);
		if (fontSize < 16) {
		  const customCSS = `     
			.small, .text-sm, small {
			  font-size: 12.5px !important;
			.fs-6, #userInput, #sendIA, #testai, #cbia, #answers, #output, #thinking, #written-input-template, #audio-input-template, #recordButton, #errorMessage, #ajaxLoginForm, #ajaxRegisterForm, #connect-link, #signup-link, #registerIA, #signinIA, form-control {
			font-size: 16px !important;
			}
		  `;
		  const styleElement = document.createElement('style');
		  styleElement.textContent = customCSS;
		  this.shadowRoot.appendChild(styleElement);
		}
	  }    
    
    startRecording() {
		this.updateComponent();
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
        this.updateComponent();
    }

    resizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    submitLogin() {
        this.loginUserAjax();
        this.updateComponent();
    }

    signupClicked() {
        this.registerUserAjax();
		this.updateComponent();
    }

    disconnect() {
        this.disconnectUser();
        this.updateComponent();
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
        const eraseButton = this.shadowRoot.getElementById('clearButton');
		if (answers && localStorage.getItem(window.location.origin + "_answers")) {
			answers.style.padding = '10px';
			eraseButton.style.display = 'block';
		}
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
            const EraseStorage = this.shadowRoot.getElementById('answers');
            const Button = this.shadowRoot.getElementById('clearButton');
//             console.log(Button);
            Button.style.display = 'none !important';
            
			EraseStorage.innerHTML = "";
			EraseStorage.style.padding = "0";
			
// 			console.log(Button.style.display);
			this.updateComponent();
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

applyStylesBasedOnWidth() {
    const moniacols = this.shadowRoot.getElementById("monia");
    const convcols = this.shadowRoot.getElementById("conversations");
    const canvcols = this.shadowRoot.getElementById("historyOffcanvas");
    const closeConv = this.shadowRoot.getElementById("closeCanvas");

    if (moniacols.getBoundingClientRect().width > 600) {
        moniacols.style.display = 'grid';
        moniacols.style.gridTemplateColumns = '1fr 3fr';
        moniacols.style.position = 'relative';
        moniacols.style.gap = '1rem';
        convcols.style.alignItems = 'start';
		convcols.style.gridColumn = '1';
		convcols.style.display = 'block';
        convcols.style.position = 'relative';
        convcols.style.left = '0';
        convcols.style.top = '0';
        convcols.style.transform = 'translateX(0%)';
        convcols.style.width = 'auto';
        canvcols.style.width = '100%';
        closeConv.style.display = 'none';
    } else {
        moniacols.style.gridTemplateColumns = '1fr';
        moniacols.style.position = 'relative';
        convcols.style.gridColumn = 'auto';
        convcols.style.position = 'sticky';
        convcols.style.top = '5px';
        convcols.style.zIndex = '999';
        convcols.style.transform = 'translateX(-110%)';
        convcols.style.width = '50%';
        canvcols.style.width = '100%';
        canvcols.style.background = 'rgba(255, 255, 255, 0.8) !important;';
        closeConv.style.display = 'block';
    }
}

// toggleConversations() {
// 		this.chats();
// 		const convcols = this.shadowRoot.getElementById("conversations");
// 		const canvcols = this.shadowRoot.getElementById("historyOffcanvas");
// 		convcols.style.transform = 'translateX(0%)';
// 		convcols.style.transition ='transform 0.3s ease-in-out';
// 		canvcols.style.display = 'block';
// }

toggleConversations() {
    if (this.processQueuePromise) {
        this.processQueuePromise.then(() => {
            this.chats();
            this.handleConversations(); 
        }).catch((error) => {
            console.error(error);
            this.handleConversations(); 
        });
    } else {
        this.chats();
        this.handleConversations(); 
    }
}

handleConversations() {
    const convcols = this.shadowRoot.getElementById("conversations");
    const canvcols = this.shadowRoot.getElementById("historyOffcanvas");
    convcols.style.transform = 'translateX(0%)';
    convcols.style.transition = 'transform 0.3s ease-in-out';
    canvcols.style.display = 'block';
}
	
closeCanvas(){
		const convcols = this.shadowRoot.getElementById("conversations");
		const canvcols = this.shadowRoot.getElementById("historyOffcanvas");
		convcols.style.transform = 'translateX(-110%)';
        convcols.style.transition ='transform 0.3s ease-in-out';
        canvcols.style.display = 'none'
}	

loadJSON5() {
    return new Promise((resolve, reject) => {
        const oboeScript = document.createElement("script");
        oboeScript.src = `${domain}/widgets/cercle/js/JSON5.min.js`;
        oboeScript.onload = resolve;
        oboeScript.onerror = reject;
        document.head.appendChild(oboeScript);
    });
}	
	
async chats() {
    this._contentLoaded.then(() => {
        const self = this;
        const tokenRegex = /token=([^&]*)/;
        const tokenMatch = path.match(tokenRegex);
        const token = tokenMatch ? tokenMatch[1] : null;
        
        const historyButton = this.shadowRoot.querySelector('.window__maximize');          
        const variablesElement = this.shadowRoot.getElementById('monia');
        const member = localStorage.getItem(page + "_member");
        const userid = parseInt(variablesElement.getAttribute('data-user'), 10);
        if (!member || member == 0) {
			this.historyEventAdded = true;
			return;
		}
        
        const params = {
            userid: userid,
            actid: member,
            command: 'show-conv'
        };
        
        const chatsurl = variablesElement.getAttribute('data-chatsurl');
        const fileUrlPrefix = `${domain}/widgets/monia_dev/chat_logs/` + member + `/1/`;
        const historyElement = this.shadowRoot.getElementById('chats');
        const chatElementsDiv = this.shadowRoot.querySelector('#chatelements');

        if (!this.historyEventAdded) {
            historyButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.chatsLoaded) {
                    return;
                }
                    
                fetch(chatsurl, {
                    method: 'POST', body: JSON.stringify(params), headers: {
                    'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
                }
                }).then(response => response.json())
                .then(text => { 
                    const existingEmptyMessage = historyElement.querySelector('.emptyMessage');
					if (text.length === 0 && !existingEmptyMessage) {
						const emptyMessage = document.createElement('div');
							emptyMessage.className = 'emptyMessage';
						    emptyMessage.style.display = 'flex';
							emptyMessage.style.justifyContent = 'center';
							emptyMessage.style.alignItems = 'center';
							emptyMessage.style.height = '100%';
							emptyMessage.style.flexDirection = 'column';
emptyMessage.innerHTML = `<img src="${domain}/widgets/cercle/assets/empty.svg" alt="No History" style="width: 70px; height: 70px;" />`;


						historyElement.appendChild(emptyMessage);
					} else if (text.length > 0 && existingEmptyMessage) {
						existingEmptyMessage.remove();
					}
					if (text.length > 0 ){             
// 						console.log("Texte de la réponse:", text)
						this.chatsLoaded = true;
						text.forEach((fileName) => { 
							const filePath = fileUrlPrefix + fileName;
							const fileJson = fileName;
							const datePattern = /\d{4}-\d{2}-\d{2}/;
							const dateMatch = fileName.match(datePattern);
							const date = dateMatch ? dateMatch[0].split('-').reverse().join('/') : null; 
							const namePattern = /(\d+)-/;
							const nameMatch = fileName.match(namePattern);
							const filename = nameMatch ? nameMatch[1] : null;

							const divRow = document.createElement('div');
							divRow.dataset.filePath = filePath;
						
							const aTitle = document.createElement('a'); 
							aTitle.href = `#detailsDiv${date}`; 

							const title = document.createTextNode(`+ ${date}`);
							aTitle.appendChild(title);
							divRow.appendChild(aTitle);
						

							const deleteJsonButton = document.createElement('button');
							let confirmed = false;
							let confirmTimeout;
							deleteJsonButton.className = 'delete-json';
							deleteJsonButton.style.display = 'none';
							deleteJsonButton.dataset.filejson = fileJson;
							deleteJsonButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ee6868" viewBox="0 0 24 24"><path d="M3 6l3 18h12l3-18h-18zm19-4v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.316c0 .901.73 2 1.631 2h5.711z"/></svg>';
							divRow.appendChild(deleteJsonButton);

							this.shadowRoot.querySelector('#chats').appendChild(divRow);

							let detailsLoaded = false;
							const detailsDiv = document.createElement('div');
							detailsDiv.id = `detailsDiv${date}`; 
							detailsDiv.className = 'conversation-details';
							detailsDiv.style.display = 'none';
							detailsDiv.setAttribute('data-file', fileName);
							chatElementsDiv.appendChild(detailsDiv);

							divRow.addEventListener('click', () => {
								const allDetailsDivs = this.shadowRoot.querySelectorAll('.conversation-details');
								const allDeleteButtons = this.shadowRoot.querySelectorAll('.delete-json');
								allDetailsDivs.forEach((div, index) => {
									if (div.id !== `detailsDiv${date}`) {
										div.style.display = 'none';
										let correspondingDeleteButton = allDeleteButtons[index];
										if (correspondingDeleteButton) {
											correspondingDeleteButton.style.display = 'none';
										}
									}
								});							
							
								if (!detailsLoaded) {
																		
										
									fetch(filePath)
									  .then(response => response.json())
									  .then(data => {
										const detailsContainer = document.createElement('div');
										detailsContainer.className = 'trconv';
										const dateSpan = document.createElement('span');
										dateSpan.className = 'trdate fw-bold';
										dateSpan.textContent = data[0]['timestamp'].split('T')[0].split('-').reverse().join('/');
										detailsContainer.appendChild(dateSpan);

										let formattedData = '';
										formattedData += `${data[0]['website']}\n\n`;

										data.forEach(item => {
											let date = new Date(item.timestamp);
											let day = String(date.getDate()).padStart(2, '0');
											let month = String(date.getMonth() + 1).padStart(2, '0'); 
											let year = date.getFullYear();
											let hours = String(date.getHours()).padStart(2, '0');
											let minutes = String(date.getMinutes()).padStart(2, '0');


										  formattedData += this.translations.datecc + ` : ${day}/${month}/${year}, Heure : ${hours}:${minutes}\n`;
										  formattedData += this.translations.question + ` : ${item.question.replace("Q: ", "")}\n`;
										  formattedData += this.translations.answer + ` : ${item.answer}\n\n`;

										  const time = new Date(item.timestamp).toLocaleTimeString();
										  const timeSpan = document.createElement('span');
										  timeSpan.className = 'time';
										  timeSpan.textContent = time;
										  detailsContainer.appendChild(timeSpan);

										  const itemBody = document.createElement('div');
										  itemBody.className = 'cc-body';

										  const itemTitle = document.createElement('div');
										  itemTitle.className = 'cc-title';
										  const titleSpan = document.createElement('span');
										  titleSpan.textContent = this.translations.you;
										  itemTitle.appendChild(titleSpan);
										  itemTitle.innerHTML += item.question.replace("Q: ", "");
										  itemBody.appendChild(itemTitle);

										  const itemText = document.createElement('div');
										  itemText.className = 'cc-text';
										  const textSpan = document.createElement('span');
										  textSpan.textContent = this.translations.assistant;
										  itemText.appendChild(textSpan);
										  itemText.innerHTML += item.answer;
										  itemBody.appendChild(itemText);

										  detailsContainer.appendChild(itemBody);
										});

										let textBlob = new Blob([formattedData], {type: 'text/plain'});
										let url = URL.createObjectURL(textBlob);
										let a = document.createElement('a');
										a.href = url;
										a.download = 'MoniA-data.txt'; 
										a.innerHTML = `<img src='${domain}/widgets/cercle/assets/download.svg' />`;
										a.className = 'download-link';
										a.title = "Cliquez pour télécharger le fichier";
										detailsContainer.appendChild(a); 

	
										let shareButton = document.createElement('button');
										shareButton.innerHTML = `<img src='${domain}/widgets/cercle/assets/upload.svg' />`;
										shareButton.className = 'share-button';
										shareButton.title = 'Cliquez pour partager le fichier';										

										if (navigator.share) {
											shareButton.addEventListener('click', function() {
												navigator.share({
													title: 'Conversation avec MoniA',
													text: formattedData,
												})
												.then(() => console.log('Contenu partagé avec succès.'))
												.catch((error) => console.log('Il y a eu une erreur lors du partage du contenu.', error));
											});
										} else if (navigator.clipboard) {
											shareButton.addEventListener('click', function() {
												navigator.clipboard.writeText(formattedData)
												.then(() => {
													shareButton.innerHTML = `<img src='${domain}/widgets/cercle/assets/clipboard.svg'/>`;
													shareButton.title = 'Texte copié dans votre presse papier';	
												})
												.catch((error) => console.log('Il y a eu une erreur lors de la copie du contenu.', error));
											});
										} else {
											shareButton.style.display = 'none'; 
										}
										detailsContainer.appendChild(shareButton);

										detailsDiv.appendChild(detailsContainer);
										detailsDiv.style.display = 'block';
										deleteJsonButton.style.display = 'block';
										detailsLoaded = true;
										detailsDiv.scrollIntoView({behavior: 'smooth', block: 'start'});
									});
										
								} else {
									detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
									deleteJsonButton.style.display = deleteJsonButton.style.display === 'none' ? 'block' : 'none';
								}
								detailsDiv.scrollIntoView({behavior: 'smooth', block: 'start'});
							});
															
							// Code pour supprimer la conversation
							deleteJsonButton.addEventListener('click', (e) => {
								e.stopPropagation();
								clearTimeout(confirmTimeout);
								const filePath =  deleteJsonButton.dataset.filejson;
// 								console.log(filePath);
								const params2 = {
									actid: localStorage.getItem(page + "_member") || 0,
									docs: [filePath],
									command: 'delete-own-conv'
								};
								if (confirmed) {
									fetch(chatsurl, {
										method: 'POST', 
										body: JSON.stringify(params2), 
										headers: {
										'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
										}
									})
									.then(response => response.json())
									.then(async text => { 
										divRow.parentNode.removeChild(divRow);
										detailsDiv.parentNode.removeChild(detailsDiv);
// 										console.log("réponse de la suppression:", text)
									});	
									confirmed = false;
									deleteJsonButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="var(--danger)" d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.287-4-3.713z"/></svg>';
								}
								else {
									confirmed = true;
									deleteJsonButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="var(--danger)" d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.287-4-3.713z"/></svg>';
									confirmTimeout = setTimeout(() => {
										confirmed = false;
										deleteJsonButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ee6868" viewBox="0 0 24 24"><path d="M3 6l3 18h12l3-18h-18zm19-4v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.316c0 .901.73 2 1.631 2h5.711z"/></svg>';
									}, 10000);								
								}
							});
						});
                    }
                    
                })
                .catch(error => {
                    console.error('Une erreur est survenue :', error);
                });
            })
        this.historyEventAdded = true;
        }   
    }); 
}

	processQueue(question) {
		return new Promise((resolve) => {
			isProcessingQueue = true;

			let actionHandlers = {
				"Final Answer": (token, combinedPreviousTokens) => {
// 					console.log("Inside Final Answer");
					if (currentLoadingElement) {
					  currentLoadingElement.classList.remove("loading");
					  currentLoadingElement = null; 
					}
			
					let stepsDiv = document.getElementById("steps");
					if (!stepsDiv) {
						stepsDiv = document.createElement("div");
						stepsDiv.id = "steps";
						answersElement.appendChild(stepsDiv);
					}

					let FinalDiv = document.createElement("div");
					FinalDiv.innerHTML = "Voilà ma réponse";
					FinalDiv.classList.add("final");
					stepsDiv.appendChild(FinalDiv);
					
					let aFinalDiv = document.createElement("div");
					aFinalDiv.classList.add("a_final");
					stepsDiv.appendChild(aFinalDiv);
					lastAFinalDiv = aFinalDiv;

					currentAction = 'Final Answer';
// 					console.log("Token before processing: ", token);
				},
				"search": () => {
					this.createToolElement("Je recherche sur le web", "search");
					currentAction = 'search';
				},		
				"Today-Date": () => {
					this.createToolElement("Date...", "Today-Date");
					currentAction = 'Today-Date';
				},							
				"web-browser": () => {
					this.createToolElement("Je recherche sur des sites spécifiques", "web-browser");
					currentAction = 'web-browser';
				},
				"UserRegistration": () => {
					this.createToolElement("Création de votre compte...", "UserRegistration");
					currentAction = 'UserRegistration';
				},				
				"general-qa": () => {
					this.createToolElement("Une petite seconde...", "general-qa");
					currentAction = 'general-qa';
				},				
				"calculator": () => {
					this.createToolElement("Je vais utiliser le calculateur", "calculator");
					currentAction = 'calculator';
				},					
				"company-qa": () => {
					this.createToolElement("Je cherche dans les documents disponibles", "company-qa");
					currentAction = 'company-qa';
				},
				"company-mem": () => {
					this.createToolElement("Bon je regarde dans mon historique", "company-mem");
					currentAction = 'company-mem';
				},
				"CompanyTool1": () => {
					this.createToolElement("Outil spécifique 1", "CompanyTool1");
					currentAction = 'CompanyTool1';
				},				
			};
	
			this.createToolElement = function(content, id) {
				let stepsDiv = document.getElementById("steps");
				if (!stepsDiv) {
					stepsDiv = document.createElement("div");
					stepsDiv.id = "steps";
					answersElement.appendChild(stepsDiv);
				}

				let toolDiv = document.createElement("div");
				toolDiv.innerHTML = content;
				toolDiv.classList.add("tool");
				toolDiv.dataset.id = id;
				
				let loadingDiv = document.createElement("div");
				loadingDiv.classList.add("loading");
				toolDiv.appendChild(loadingDiv);
				
				let aToolDiv = document.createElement("div");
				aToolDiv.classList.add("a_tool");
				aToolDiv.dataset.id = id;

				stepsDiv.appendChild(toolDiv);
				stepsDiv.appendChild(aToolDiv);
				lastAToolDiv = aToolDiv;
				
				toolDiv.addEventListener('click', function() {
						let correspondingATool = this.nextElementSibling;
						if (correspondingATool.style.display === 'none' || !correspondingATool.style.display) {
								correspondingATool.style.display = 'block';
								this.classList.add('active');  // Add the active class
						} else {
								correspondingATool.style.display = 'none';
								this.classList.remove('active');  // Remove the active class
						}
				});
				
				if (currentLoadingElement) {
					currentLoadingElement.classList.remove("loading");
				}
				currentLoadingElement = loadingDiv;
			}
			
// 			console.log("Current action ID:", currentAction);
			this.updateAToolElement = function(content, id) {
// 					console.log("Found aToolDiv:", aToolDiv);
// 					console.log("Content to add:", content);
					if (lastAToolDiv && lastAToolDiv.dataset.id === id) {
							lastAToolDiv.innerHTML += content;
					}
			};		
				    
	
			this._contentLoaded.then(() => {
				this.aiurl = this.shadowRoot.getElementById('monia').getAttribute('data-aiurl');
			});
	
			const thinkingElement = this.getThinkingValue();
			let thinkingDiv = this.shadowRoot.getElementById('thinking');
			if (thinkingElement) {
				thinkingDiv.style.display = 'none';
			} 
	 
			if (queue.length > 0) {
				const message = queue.shift();
		
				let dataObject, textupdate, question_update, answer_update, conversation_update;
		
				if (!message.includes("[DONE]")) {
					dataObject = JSON5.parse(message);
					if (dataObject.error) {
						answer_update = this.translations.overload;
						answersElement.insertAdjacentHTML('beforeend', answer_update);
						return;
					}
			
					let token = dataObject.token;
// 					console.log('token ',token);
			
					// Mise à jour du tampon de tokens
					previousTokens.push(token);
					if (previousTokens.length > 3) {
					  previousTokens.shift();
					}

					// Concaténation des tokens précédents
					let combinedPreviousTokens = previousTokens.join("");
	
					let processedToken = token.trim();
			
					//detection des clés
					if (!buildingValue) {
					  buildingKeyword += processedToken;
// 					  console.log('buildingKeyword ', buildingKeyword);

					  let index = buildingKeyword.indexOf('":');
					  if (index !== -1) {
						let key = buildingKeyword.substring(0, index); 
						let remaining = buildingKeyword.substring(index + 2); 
// 						console.log('key ', key);

						if (key.endsWith('action')) {
						  tokBuffer = "";
						  buildingKeyword = remaining; 
						  buildingValue = true;
						}
						if (key.endsWith('action_input')) {
						  tokBuffer += token;
						  buildingKeyword = remaining; 
						  buildingValue = true;
						  isInActionInput = true;
						}
					  }
					}
			
					else {
					  tokBuffer += token;
// 					  console.log('buffer ',tokBuffer);
			  
					if (isInActionInput) {
						let processedToken = token.replace(/^\'|\'$/g, '');
// 						let processedToken = processedToken.replace(/\\/g, '');
						 processedToken = token.replace(/\\/g, '');
// 		 				console.log('buffer ',tokBuffer);

						//Traitement des retours à la lignes
						if (combinedPreviousTokens.endsWith("\\n")) {							
							processedToken = "<br>";
							combinedPreviousTokens = "";
						} 
								
						// Traitement des liens markdown
						if (processedToken.includes('[')) {
								accumulatingLink = true;
								accumulatedLinkText += processedToken;
								processedToken = ""; 
						} else if (accumulatingLink) {
								accumulatedLinkText += processedToken;
								if (processedToken.includes(")")) {
										processedToken = accumulatedLinkText.replace(/\[(.*?)\]\((.*?)\)/g, '<a class="links" href="$2" target="_blank">$1</a>');
										accumulatingLink = false;
										accumulatedLinkText = "";
								} else {
										processedToken = "";
								}
						}

						// Traitement des markdown img
						if (processedToken.includes("![")) {
								accumulatingLink = true;
								accumulatedLinkText += processedToken; 
								processedToken = ""; 
						} else if (accumulatingLink) {
								accumulatedLinkText += processedToken;
								if (processedToken.includes(")")) {
										processedToken = accumulatedMarkdownImageText.replace(/\!\[(.*?)\]\((.*?)\)/g, '<img class="miaimg" src="$2" alt="$1">');
										accumulatingLink = false;
										accumulatedLinkText = "";
								} else {
										processedToken = ""; 
								}
						}
						
						// Début du traitement des médias
						if (processedToken.startsWith(' <') || processedToken.startsWith(' "<')) {
								accumulatingMediaHtml = true;
								accumulatedMediaHtmlText = processedToken.replace(/^"\s*|"\s*$/g, '');
								processedToken = "";
						} else if (accumulatingMediaHtml) {
								accumulatedMediaHtmlText += processedToken;

								if (processedToken.includes(">")) {
										if (accumulatedMediaHtmlText.includes("<img")) {
												processedToken = accumulatedMediaHtmlText.replace(/<img(.*?)\>\((.*?)\)/g, '<img src="$1" class="miaimg">');
										} else if (accumulatedMediaHtmlText.includes("<video")) {
												processedToken = accumulatedMediaHtmlText.replace(/<video(.*?)\>\((.*?)\)/g, '<video src="$1" class="miavid">');
										} else if (accumulatedMediaHtmlText.includes("<audio")) {
												processedToken = accumulatedMediaHtmlText.replace(/<audio(.*?)\>\((.*?)\)/g, '<audio src="$1" class="miaaud">');
										} 
										accumulatingMediaHtml = false;
										processedToken = accumulatedMediaHtmlText.replace(/<a(.*?)>(.*?)<\/a>/g, '<a$1 class="links"  target="blank">$2</a>');
								} else {
										processedToken = ""; // Continuez à accumuler sans afficher
								}
						}


						// Traitement du texte en gras
						if (processedToken.includes('**')) {
							if (insideBoldText) { // Si déjà à l'intérieur d'un texte en gras, fermez-le
								accumulatedBoldText += processedToken.replace('**', ''); // Ajoutez le texte sans les **
								processedToken = '<strong>' + accumulatedBoldText + '</strong>'; 
								insideBoldText = false;
								accumulatedBoldText = ''; // Réinitialisez le texte accumulé
							} else {
								insideBoldText = true; 
								accumulatedBoldText = processedToken.replace('**', ''); 
		
								processedToken = ''; 
							}
						} else if (insideBoldText) {
							accumulatedBoldText += processedToken; 
						//     console.log('accumulatedBoldText ',accumulatedBoldText);
							processedToken = ''; 
						}					
							
						if (processedToken) { // Ne l'affiche que si processedToken est non vide
			// 				console.log('combinedPreviousTokens ', combinedPreviousTokens);
// 							console.log('token ', processedToken);
							
							//start
							if (combinedPreviousTokens.includes('_input')) {
							  processedToken = processedToken.replace(/"/g, '');
							  combinedPreviousTokens = "";
							}
	
							//end			
							if (combinedPreviousTokens.endsWith("```") || combinedPreviousTokens.endsWith('}\n') || combinedPreviousTokens.endsWith('"\n')) {
								processedToken = processedToken.slice(0, -3);
								combinedPreviousTokens = "";
							}		
							if (combinedPreviousTokens.endsWith('\"\n}')) {
								processedToken = processedToken.slice(0, -4);
								combinedPreviousTokens = "";
							}													
							//remove end characters
							this.currentResponse += processedToken;
							
// 							answersElement.insertAdjacentHTML('beforeend', processedToken);
							this.updateAToolElement(processedToken, currentAction);
// 							answersElement.insertAdjacentHTML('beforeend', processedToken);
							
							if (lastAFinalDiv) {
									lastAFinalDiv.insertAdjacentHTML('beforeend', processedToken);
							}
						}
					}			  
			  
					  if (tokBuffer.endsWith("\",\n") || tokBuffer.endsWith("\"\n}") || tokBuffer.endsWith("```") ) {
						let actionValue = tokBuffer.replace(':', '').replace(/"/g, '').trim();
						
						actionValue = actionValue.endsWith(",") ? actionValue.slice(0, -1) : actionValue;
// 						console.log('actionValue ', actionValue);
						const currentAction = actionHandlers[actionValue];
						if (currentAction) {
						  currentAction(token, combinedPreviousTokens);
						}
						tokBuffer = "";
						buildingValue = false;
						isInActionInput= false;
					  }
			  
					}		
							  
					this.processQueuePromise = this.processQueue(question);
					const recordButton = this.shadowRoot.getElementById('recordButton');
					recordButton.disabled = true;
				}

					if (message.includes("[DONE]")) {
						dataObject = JSON.parse(message);
						question_update = "<span class='fw-bold'>" + this.translations.you + "</span>" + question;
						answer_update = "<br><span class='fw-bold'>" + assistantNickname + ": </span>" + this.currentResponse.replace(/Q: /g, "").replace(/A: /g, "").replace(/R: /g, "").replace(/r: /g, "").replace(/MoniA: /g, "").replace(/MoniA : /g, "");
						conversation_update = question_update + answer_update;
						answers = localStorage.getItem(page + "_answers") || "";
						answers += conversation_update + "|";
						localStorage.setItem(page + "_answers", answers);
						this.currentResponse = "";
				
						if (currentLoadingElement) {
							currentLoadingElement.classList.remove("loading");
							currentLoadingElement = null; 
						}   
				
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
						sendButton.textContent = this.translations.send;
						sendButton.disabled = false;
						const tokenCount = dataObject.totalTokenCount;
						console.log('tokens :', tokenCount)
					}
				}
			if (queue.length === 0) {
				isProcessingQueue = false;
				resolve(); // La file d'attente est vide, le traitement est terminé
			}			
		});   
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

        answersElement.innerHTML += this.translations.login;

//         this.updateAnswersElementClass();
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
        const tokenRegex = /token=([^&]*)/;
		const tokenMatch = path.match(tokenRegex);
		const token = tokenMatch ? tokenMatch[1] : null;

//         console.log('token ',token);
//         console.log('path ',path);

        fetch(aiurl, {
            method: 'POST', body: JSON.stringify(params), headers: {
        'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
    },
        }).then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const reader = response.body.getReader();
            if (reader == null) {
                alert(this.translations.alertoverload);
            }

            reader.read().then(function processResult(result) {
                if (result.done) {
                    return;
                }
                const text = new TextDecoder().decode(result.value);

                while ((match = regex.exec(text)) !== null) {
                    const message = match[1];
                    queue.push(message);
                }
                self.processQueue(question);

				return reader.read().then(processResult);
            });
        }).catch(error => {
            console.error('Error in fetchAIResponse:', error);
        });
    }

    chatbotprocessinput(questionText = null) {
        try {
            this._contentLoaded.then(() => {
                const variablesElement = this.shadowRoot.getElementById('monia');
//                 console.log('Step 1: variablesElement', variablesElement);
                if (variablesElement) {
                    const aiurl = variablesElement.getAttribute('data-aiurl');
                    const baseUrl = variablesElement.getAttribute('data-domain');
                    const user = parseInt(variablesElement.getAttribute('data-user'), 10) || 0;
                    const eventowner = parseInt(variablesElement.getAttribute('data-eventowner'), 10) || 0;
//                     const actid = parseInt(variablesElement.getAttribute('data-actid'), 10) || 0;
                    const actid = localStorage.getItem(page + "_member") || 0;
                    const answerscss = localStorage.getItem(page + "_answers") || 0;
                    const actid_perms = localStorage.getItem(page + "_auths") || 1; //default public
                    const atidRaw = variablesElement.getAttribute('data-atid');
                    const atidRegex = /&atid=(\d+)/;
                    const atidMatch = atidRaw.match(atidRegex);
                    const atid = atidMatch ? parseInt(atidMatch[1], 10) : 0;
                    
                    if (answerscss == 0) {
                    	
						this.shadowRoot.getElementById('answers').style.padding = '10px';
						this.shadowRoot.getElementById('clearButton').style.display = 'block';
                    }

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
                    const visibleDetailsDiv = this.shadowRoot.querySelector('#chatelements > .conversation-details[style*="display: block"]');
					const dataFile = visibleDetailsDiv ? visibleDetailsDiv.getAttribute('data-file') : null;

                    let question = questionText || this.getUserInputValue();
                    if (question.trim() !== "") {
                        let theprompt = prompt + "Q: " + question;
                        this.emptyInputCounter = 0;
                        let thinkingElement = this.getThinkingValue();
                        let thinkingDiv = this.shadowRoot.getElementById('thinking');
                        if (thinkingElement) {
							thinkingDiv.style.display = 'inline-flex';
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
                        let last_question_update = "<span class='fw-bold'>" + this.translations.you + "</span>" + question;
                        answersElement.innerHTML += last_question_update + "<br>";
                        answersElement.innerHTML += "<span class='fw-bold'>" + this.translations.assistant + "</span>";
                        const params = {
                            prompt: theprompt,
                            user: user,
                            base: baseUrl,
                            eventowner: eventowner,
                            actid: parseInt(actid),
                            actid_perms : parseInt(actid_perms),
                            data_website: window.location.href,
                            chat_file : dataFile ? dataFile.trim() : "", 
                            last_questions: this.last_question ? this.last_question.trim() : "",
                            last_answers: this.last_answer ? this.last_answer.trim() : "",
                            lang: this.lang,
                        };
                        console.log(params);
                        this.fetchAIResponse(aiurl, params, question);
                        this.setUserInputValue("");
                        return question;

                    } else {
                        this.emptyInputCounter++;

                        let tempmessage;
                        const recordButton = this.shadowRoot.getElementById('recordButton');

                        if (this.emptyInputCounter === 1) {
                            tempmessage = this.translations.empty1;
                            recordButton.disabled = false;
                        } else if (this.emptyInputCounter === 2) {
                            tempmessage = this.translations.empty2;
                            recordButton.disabled = false;
                        } else if (this.emptyInputCounter >= 3) {
                            tempmessage = this.translations.empty3;
                            recordButton.disabled = false;
                        }
                        answersElement = this.getAnswersValue();
                        answersElement.innerHTML += "<span class='fw-bold'>" + this.translations.assistant + "</span>" + tempmessage + "<br><br>";
                    }
                }
            }); 
        } catch (e) {
            console.error('Error in chatbotProcessInput:', e);
        }
    }

//     updateAnswersElementClass() {
//         if (answersElement.innerHTML.trim() !== "") {
//             answersElement.classList.add("bg-light");
//         } else {
//             answersElement.classList.remove("bg-light");
//         }
//     }

    initActiaDev() {
        var chatbotprocessinput;
        let messageQueue = [];
        let processingQueue = false;
        let parentData = '';
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
//                 this.updateAnswersElementClass();
            }
        });

    }

    disconnectUser() {
        localStorage.removeItem(page + "_isLoggedIn");
        localStorage.removeItem(page + "_token");
        localStorage.removeItem(page + "_loginDate");
        localStorage.removeItem(page + "_firstname");
        localStorage.removeItem(page + "_member");
        localStorage.removeItem(page + "_auths");

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
        
        const answerscss = localStorage.getItem(page + "_answers") || 0;
		if (answerscss == 0) {
			this.shadowRoot.getElementById('answers').style.padding = '10px';
		}        

        const requestOptions = {
            method: 'POST', body: formData,
        };

//Production              //fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=330&Itemid=9343&format=raw`, requestOptions)
        fetch(`${domain}` + this.translations.loginPageUrl, requestOptions)

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
                    const member = data.userid;
                    if (token && token.trim() !== '') {
                        console.log('Connexion réussie');
                        localStorage.setItem(page + "_isLoggedIn", 1);
                        localStorage.setItem(page + "_token", token);
                        localStorage.setItem(page + "_firstname", firstname);
                        localStorage.setItem(page + "_member", member);
                        localStorage.setItem(page + "_loginDate", new Date().toISOString());
                        isLoggedIn = true;
                        this.shadowRoot.getElementById('ajaxLoginForm').style.display = 'none';
                        this.shadowRoot.getElementById('welcomeMessage').style.display = 'block';
                        const sendButton = this.shadowRoot.getElementById('sendIA');
                        sendButton.disabled = false;
                        const recordButton = this.shadowRoot.getElementById('recordButton');
                        recordButton.disabled = false;
                        tempElement.innerHTML = `<span class='fw-bold'>`+ this.translations.assistant + `</span>` + this.translations.hello + localStorage.getItem(page + "_firstname") + this.translations.helloAgain;
                        answersElement.innerHTML = tempElement.innerHTML;
                        
						// Nouvelle requête fetch pour les permissions
						const newformData = new FormData();
						newformData.append('token', token);
						newformData.append('userid', member);						
						const newURL = `${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=339&format=raw`;
						fetch(newURL, { method: 'POST' , body : newformData})
							.then(response => response.json())
							.then(newData => {
// 								console.log('newData ', newData);
								if (newData.permissions) {
									console.log('Permissions:', newData.permissions);
									localStorage.setItem(page + "_auths", newData.permissions);
								}
							})
							.catch(error => {
								console.error('Error:', error);
							});   
						this.historyEventAdded = false;
						this.chats();
                    }
                } else {
                    console.log('Échec de la connexion');
                    const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                    errorMessageDiv.innerHTML = this.translations.checkLogin;
                    errorMessageDiv.style.display = 'block';
                    errorMessageDiv.focus();
                    localStorage.removeItem(this.page + "_isLoggedIn");

                }
            })
            .catch(error => {
                console.error('Error:', error);
                const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                errorMessageDiv.innerHTML = this.translations.errorLogin;
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
		
        const answerscss = localStorage.getItem(page + "_answers") || 0;
		if (answerscss == 0) {
			this.shadowRoot.getElementById('answers').style.padding = '10px';
		} 		

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
            const response = await fetch(`${domain}/index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=330&Itemid=9343&format=raw`+ atid, requestOptions);

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

                    tempElement.innerHTML = this.translations.successSignup;
                    answersElement.innerHTML = tempElement.innerHTML;

                } else {
                    console.log('Token vide. Vérifiez la réponse du serveur.');
                    const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                    errorMessageDiv.innerHTML = this.translations.failedSignup;
                    errorMessageDiv.style.display = 'block';
                    errorMessageDiv.focus();
                }
            } else {
                console.log('Échec de l\'inscription');
                const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
                errorMessageDiv.innerHTML = this.translations.failedSignupError;
                errorMessageDiv.style.display = 'block';
                errorMessageDiv.focus();
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessageDiv = this.shadowRoot.getElementById('errorMessage');
            errorMessageDiv.innerHTML = this.translations.SignupError;
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
            localStorage.removeItem(page + "_member");
            localStorage.removeItem(page + "_auths");
        }

        if (this.isLoginExpired()) {
            localStorage.removeItem(page + "_isLoggedIn");
            localStorage.removeItem(page + "_token");
            localStorage.removeItem(page + "_loginDate");
            localStorage.removeItem(page + "_firstname");
            localStorage.removeItem(page + "_member");
            localStorage.removeItem(page + "_auths");

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

startCountdown(seconds) {
  let remainingTime = seconds;
  const timer = this.shadowRoot.getElementById('timer');
  timer.style.display = 'block';
  timer.textContent = this.formatTime(remainingTime);
  this.countdown = setInterval(() => {
    remainingTime--;
    timer.textContent = this.formatTime(remainingTime);
    if (remainingTime <= 0) {
      clearInterval(this.countdown);
      recordBtn.classList.remove('pressed');
      stopIcon.style.display = 'none';
    }
  }, 1000);
}

stopCountdown() {
	clearInterval(this.countdown);
	const timer = this.shadowRoot.getElementById('timer');
	timer.style.display = 'none';
}

formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}


    stopRecording() {
	  const recordButton = this.shadowRoot.getElementById('recordButton');
	  const stopIcon = this.shadowRoot.querySelector('.stop-icon');

        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }
        recordButton.style.backgroundImage = '';
		this.stopCountdown();
		stopIcon.style.display = 'none';
		recordButton.classList.remove('pressed');
				
				
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

                setTimeout(() => {
                    this.stopRecording();
                }, this.countdownDuration * 1000);

                this.isRecording = true;
                const recordButton = this.shadowRoot.getElementById('recordButton');
                const stopIcon = this.shadowRoot.querySelector('.stop-icon');
                recordButton.classList.toggle('pressed');
				this.startCountdown(this.countdownDuration);
				stopIcon.style.display = 'block';
                recordButton.disabled = true;
                this.shadowRoot.getElementById('clearButton').style.display = 'none !important'; 
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
    const url = window.location.href;
    return { type: 'parentPageData', url };
}


function init() {
    if (!document.body) return;
      if (document.getElementById('monia-instance')) return; 
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
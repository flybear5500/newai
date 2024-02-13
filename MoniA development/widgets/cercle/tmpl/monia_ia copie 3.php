<?php 
// defined('_JEXEC') or die('Restricted access');
if ( ( ! file_exists( JPATH_SITE . '/libraries/CBLib/CBLib/Core/CBLib.php' ) ) || ( ! file_exists( JPATH_ADMINISTRATOR . '/components/com_comprofiler/plugin.foundation.php' ) ) ) {
	echo 'CB not installed'; return;
}
include_once( JPATH_ADMINISTRATOR . '/components/com_comprofiler/plugin.foundation.php' );
global $_PLUGINS;
global $_CB_framework;

$_PLUGINS->loadPluginGroup( 'user' );
// cbimport( 'cb.html' );
// cbimport( 'language.front' );
// outputCbTemplate();

use Joomla\CMS\Factory;

$aiurl = JURI::base()."index.php?option=com_comprofiler&view=pluginclass&plugin=cbautoactions&action=action&actions=322";
$data_company_id = 0;
$activ_id = 0;
$act_userid = 0;

$user_id = $user->id;

$cbUser  = CBuser::getInstance($user_id, false);
$company = $cbUser->getUserData()->getString( 'cb_company', '' );
$MyId = $cbUser->getUserData()->getInt( 'id', 0 );
$atid = $cbUser->getField( 'cb_refid' , null, 'php', 'none', 'profile', 0, true);

//echo "utilisateur SoniA: " . $MyId;
// print '<pre>' . htmlspecialchars(print_r($action, true)) . '</pre>';
//following is compulsory to get the value of CB query fields
if ( is_array( $atid ) ) {
	$atid		=	array_shift( $atid );
	if ( is_array( $atid ) ) {
		$atid	=	implode( '|*|', $atid );
	}
}

$baseUrl = $cbUser->getUserData()->getString( 'cb_actia_domain', '' );
// $baseUrl = "https://wpcercle.local";
// $head = JFactory::getApplication();
// // Ajouter la directive frame-ancestors à la politique de sécurité du contenu en ajoutant dynamiquement le site du client
// $cspHeader = "frame-ancestors 'self' ". $baseUrl;
// // $accHeader=$baseUrl;
// $accHeader = 'https://devel.cercle.business';
// // $head->setHeader('Access-Control-Allow-Origin', $accHeader);
// $head->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
// $head->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
// $head->setHeader('Content-Security-Policy', $cspHeader);
// $head->setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
// 
// 
// $head->setHeader('Cross-Origin-Resource-Policy', 'same-site');

//https://www.joomlapolis.com/documentation/279-community-builder/tutorials/18361-obtaining-field-values-through-getfields-api
// https://www.joomlapolis.com/forum/developer-members-support/245736-getuserdata-with-cb-conditional-override#333369
// 	$prompt_ia = $cbUser->getUserData()->getString( 'cb_prompt_ia', null, 'html', 'none' , 'profile', 0, true, [ '_noCondition' => true ]);

// https://www.joomlapolis.com/documentation/279-community-builder/tutorials/18359-establishing-a-cb-user-object
// $user = CBuser::getUserDataInstance( $user_id )
// $prompt_ia = $user->getString('cb_prompt_ia', '');
// echo $prompt_ia;

//https://webkit.org/blog/11545/updates-to-the-storage-access-api/

//TODO 
//l'inscription mets l'adhérent comme prospect sur comactiv ou comme liaison sur negopack
?>

<script>
 function getActiaSessionId() {
        if (localStorage.getItem('actia_session_id')) {
            return localStorage.getItem('actia_session_id');
        } else {
            // Si la session ID n'est pas dans le localStorage, l'y ajouter
            localStorage.setItem('actia_session_id', '<?php echo $sessionId; ?>');
            return '<?php echo "_user_" . $act_userid; ?>';
        }
    }

    // Utilisez cette fonction pour récupérer la valeur de actia_session_id
    if (<?php echo $act_userid; ?> == 0) {
        var actiaSessionId = getActiaSessionId();
        console.log("L'ID de session du visiteur non identifié est : " + actiaSessionId);
    }    
</script>
<div id="monia" class="glass-container" data-domain="<?php echo $baseUrl; ?>" data-aiurl="<?php echo $aiurl; ?>" data-user="<?php echo ($MyId>0)?$MyId:0; ?>" data-eventowner="<?php echo ($MyId>0)?$MyId:0; ?>" data-actid="<?php echo $act_userid; ?>" data-act-userid="<?php echo $act_userid; ?>" data-atid="<?php echo '&atid='.$atid; ?>">
<!-- 
    <section class="window~~buttons">
	  <div class="window__maximize"></div>
      <div class="window__close"></div>

    </section>
 -->
	  <span class="fw-bold">Je suis l'intelligence artificielle de <?php echo !empty($company)?$company:'Cercle Business'; ?></span><br>
	  <span>Demande moi tout ce que tu veux, par exemple:
	  		  <br><small>Que fais ou que vends ce site ?<br>
	  		   Comment augmenter mes revenus ?<br>
	  		   Comment prendre contact ?</small></span>

			  <button id="clearButton" class="btn-remove" onclick="clearClicked()">Effacer la conversation</button>
		  <div id="answers" class="answers">       
		  </div> 
		  <div id="output"></div>
		  <div id="thinking" class="thinking" style="display:none;">
		        <div style="--i: 1"></div>
				  <div style="--i: 2"></div>
				  <div style="--i: 3"></div>
				  <div style="--i: 4"></div>
		  </div>
		  <div id="written-input-template" class="input-group mb-3">			
			 <textarea class="form-control" id="userInput" rows="1" placeholder="Ecris ou demande-moi..." onkeydown="if (event.keyCode == 13) { event.preventDefault(); submitClicked() } ; if (event.keyCode == 38) { repeatuser() }" oninput="resizeTextarea(this)"></textarea>
			<button class="input-group-text btn" id="sendIA"  onclick="submitClicked()">Envoyer</button>
		  </div> 

	<div id="audio-input-template" class="container">
			<button id="recordButton" class="btn mx-auto custom-rounded-button record-button-text"></button>
			  <audio id="audioElement" controls style="display: none;"></audio>
	</div>
	<div id="errorMessage" class="alert-danger" style="display: block;"></div>
	<form id="ajaxLoginForm" onsubmit="event.preventDefault(); submitLogin();" style="display:none;">
		<p>Connectez-vous sur MoniA<br><small>powered by </small><a class="btn-link" href="https://cercle.business/?<?php echo '&atid='.$atid; ?>" target="blank">Cercle Business</a></p>
	  <div class="form-group">
	      <div>
		<label for="username">Identifiant :</label>
		<input type="text" class="form-control" id="username" name="username" required>
		    </div>
	  </div>
	  <div class="form-group">
	      <div>
		<label for="password">Mot de passe :</label>
		<input type="password" class="form-control" id="password" name="password" required>
		    </div>
	  </div>
	  <input type="submit" value="Connexion" />
	  <div class="text-info small mt-5"><a href="https://cercle.business/cb-forgot-login" class="btn-link" target="blank">J'ai oublié ?</a></div>
	</form>
	<div class="d-flex align-items-start mt-5 ms-2 small">
		<div id="welcomeMessage" class="text-danger" style="display:block;" onclick="disconnect()">Se déconnecter</div>
		<div class="text-warning ms-auto pe-3">version beta</div>
	</div>
	
	<form id="ajaxRegisterForm" onsubmit="event.preventDefault(); signupClicked();" method="post" style="display:none;">
	  <p>Enregistrez-vous sur MoniA<br><small>powered by </small><a class="btn-link" href="https://cercle.business/?<?php echo '&atid='.$atid; ?>" target="blank">Cercle Business</a></p>
	  <div class="form-group">
		<div>
		  <label for="name" class="form-label">Nom</label>
		  <input id="reg_name" type="text" name="name" class="form-control" required />
		</div>
		<div>
		  <label for="name" class="form-label">Prénom</label>
		  <input id="reg_firstname" type="text" name="firstname" class="form-control" required />
		</div>
		<div>
		  <label for="email" class="form-label">Email</label>
		  <input id="reg_email" type="email" name="email" class="form-control" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" />
		</div>
		<div>
		  <label for="username" class="form-label">Identifiant</label>
		  <input id="reg_username" type="text" name="username" class="form-control" required />
		</div>
		<div>
		  <label for="password" class="form-label">Mot de passe</label>
		  <input id="reg_password" type="password" name="password" class="form-control" required pattern=".{6,}" title="Le mot de passe doit contenir au moins 6 caractères" />
		</div>
		  <div class="form-check form-check-inline">
			<input type="checkbox" id="acceptedterms" name="acceptedterms" value="1" class="form-check-input required" required >
			<label for="acceptedterms" class="form-check-label">J'accepte les <a href="https://cercle.business/entreprise/conditions-générales-d-utilisation-du-site" target="blank" class="btn-link">Conditions générales d"utilisation</a></label>
		  </div>
		<input id="registerIA"  type="submit" value="S'enregistrer" />
	  </div>
	</form>

</div>

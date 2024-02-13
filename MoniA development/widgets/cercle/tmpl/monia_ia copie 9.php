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
cbimport( 'language.front' );
// outputCbTemplate();

use Joomla\CMS\Factory;


$aiurl = "https://devel.cercle.business/devnode-question";
$chatsurl = "https://devel.cercle.business/devhandle-command";
$data_company_id = 0;
$activ_id = 0;
$act_userid = 0;

$user_id = $user->id;

$cbUser  = CBuser::getInstance($user_id, false);
$company = $cbUser->getUserData()->getString( 'cb_company', '' );
$MyId = $cbUser->getUserData()->getInt( 'id', 0 );
$atid = $cbUser->getField( 'cb_refid' , null, 'php', 'none', 'profile', 0, true);

//following is compulsory to get the value of CB query fields
if ( is_array( $atid ) ) {
	$atid		=	array_shift( $atid );
	if ( is_array( $atid ) ) {
		$atid	=	implode( '|*|', $atid );
	}
}

$baseUrl = $cbUser->getUserData()->getString( 'cb_actia_domain', '' );
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
<div id="monia" data-domain="<?php echo $baseUrl; ?>" data-aiurl="<?php echo $aiurl; ?>" data-user="<?php echo ($MyId>0)?$MyId:0; ?>" data-eventowner="<?php echo ($MyId>0)?$MyId:0; ?>" data-actid="<?php echo $act_userid; ?>" data-act-userid="<?php echo $act_userid; ?>" data-atid="<?php echo '&atid='.$atid; ?>" data-company="<?php echo !empty($company)?$company:'Cercle Business'; ?>" data-chatsurl="<?php echo $chatsurl; ?>" >
<!-- 
    <section class="window~~buttons">
	  <div class="window__maximize"></div>
      <div class="window__close" id="closeIcon"></div>

    </section>
 -->
 	<div id="conversations">
		<div id="historyOffcanvas" class="convoffcanvas">
			<div class="convoffcanvas-content">
			  <div id="closeCanvas" onclick="closeCanvas()"></div>
			  <div class="fw-bold"><?php echo !empty($company)?$company:'Cercle Business'; ?></div>
				<div id="chats"></div>
			</div>
		</div>		
	</div>
	
	<div id="miamain">
	  <span class="fw-bold" id="tr_company"></span><br>
	  
	  <small id="question0"></small>
	<br>
	<small id="question1"></small><br>
	<small id="question2"></small><br>
	<small id="question3"></small>

	<div id="chatelements"> </div>
	<button id="clearButton" class="btn-remove" style="display:none;" onclick="clearClicked()">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ee6868" viewBox="0 0 24 24">
			<path d="M3 6l3 18h12l3-18h-18zm19-4v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.316c0 .901.73 2 1.631 2h5.711z"/>
		</svg>
	</button>	
	
	<div id="answers" class="answers"> </div> 	
	<div id="output"></div>
	<div id="thinking" class="thinking" style="display:none;">
		<div style="--i: 1"></div>
		  <div style="--i: 2"></div>
		  <div style="--i: 3"></div>
		  <div style="--i: 4"></div>
	</div>
	<div id="written-input-template" class="text">			
	 <textarea class="form-control" id="userInput" rows="1" placeholder="Ecris ou demande-moi..." onkeydown="if (event.keyCode == 13) { event.preventDefault(); submitClicked() } ; if (event.keyCode == 38) { repeatuser() }" oninput="resizeTextarea(this)"></textarea>
	<button class="input-group-text" id="sendIA"  onclick="submitClicked()"></button>
	</div> 

	<div id="audio-input-template" class="audio">
			<button id="recordButton" class="record-btn">    
				<div class="timer-wrapper">
      				<div id="timer" class="timer" style="display:none;">00:00</div>
    			</div>
    			<div>
<!-- Microphone Icon -->
<img class="record-icon" src="https://devel.cercle.business/widgets/cercle/assets/record.svg" >


<!-- Stop Icon -->
<img class="stop-icon" src="https://devel.cercle.business/widgets/cercle/assets/stop-record.svg" >

			  </div>
			</button>
			  <audio id="audioElement" controls style="display: none;"></audio>
	</div>
	<div id="errorMessage" class="alert-danger" style="display:none;"></div>
	<form id="ajaxLoginForm" onsubmit="event.preventDefault(); submitLogin();" style="display:block;">
		<p><span id="tr_login"></span><br><small>powered by </small><a class="btn-link" href="https://cercle.business/?<?php echo '&atid='.$atid; ?>" target="blank">Cercle Business</a></p>
	  <div class="form-group">
	      <div>
		<label for="username" id="tr_username"></label>
		<input type="text" class="form-control" id="username" name="username" required>
		    </div>
	  </div>
	  <div class="form-group">
	      <div>
		<label for="password" id="tr_password"></label>
		<input type="password" class="form-control" id="password" name="password" required>
		    </div>
	  </div>
	  <input type="submit" id="tr_dologin" value="Connexion" />
	  <div class="text-info small mt-5"><a href="https://cercle.business/cb-forgot-login" class="btn-link" target="blank" id="tr_forgot"></a></div>
	</form>
	<div class="bottom">
		<div id="welcomeMessage" class="logout" style="display:none;" onclick="disconnect()"></div>
		<div class="beta">version beta</div>
	</div>
	<div class="lang">
		<select id="languageSelect">
			<option value="en">English</option>
			<option value="fr">Français</option>
			<option value="de">Deutsch</option>
			<option value="es">Español</option>
			<option value="it">Italiano</option>
			<option value="pt">Português</option>	
			<option value="zh">中文 (Zhōngwén)</option>
			<option value="ja">日本語 (Nihongo)</option>	
			<option value="ko"> 한국어 (Hangugeo)</option>															
	</select>
	</div>
	
	<form id="ajaxRegisterForm" onsubmit="event.preventDefault(); signupClicked();" method="post" style="display:none;">
	  <p><span id="tr_signin"></span><br><small>powered by </small><a class="btn-link" href="https://cercle.business/?<?php echo '&atid='.$atid; ?>" target="blank">Cercle Business</a></p>
	  <div class="form-group">
		<div>
		  <label for="name" id="tr_name" class="form-label"></label>
		  <input id="reg_name" type="text" name="name" class="form-control" required />
		</div>
		<div>
		  <label for="name" id="tr_firstname" class="form-label"></label>
		  <input id="reg_firstname" type="text" name="firstname" class="form-control" required />
		</div>
		<div>
		  <label for="email" class="form-label" id="tr_email" ></label>
		  <input id="reg_email" type="email" name="email" class="form-control" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" />
		</div>
		<div>
		  <label for="username" class="form-label" id="tr_id"></label>
		  <input id="reg_username" type="text" name="username" class="form-control" required />
		</div>
		<div>
		  <label for="password" class="form-label" id="tr_pass" ></label>
		  <input id="reg_password" type="password" name="password" class="form-control" required pattern=".{6,}" title="Le mot de passe doit contenir au moins 6 caractères" />
		</div>
		  <div class="form-check form-check-inline">
			<input type="checkbox" id="acceptedterms" name="acceptedterms" value="1" class="form-check-input required" required >
			<label for="acceptedterms" class="form-check-label" id="tr_conditions" ></label>
		  </div>
		<input id="registerIA"  type="submit" value="S'enregistrer" />
	  </div>
	</form>
	</div>
</div>


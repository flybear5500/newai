<?php
/**
 * Plugin Name: Cercle Business MoniA Widget
 * Description: Un plugin pour installer le widget Cercle Business et MoniA sur votre site WordPress.
 * Version: 1.0
 * Author: Jean Machuron
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 */

// Si ce fichier est appelé directement, on quitte.
if (!defined('WPINC')) {
    die;
}

// Ajouter la fonction d'ajout de script dans le pied de page du site
function cbw_enqueue_scripts() {
	if (!is_admin()) {
		wp_register_script('cercle-business-widget', null);
		wp_enqueue_script('cercle-business-widget');
		$token = get_option('cbw_token', '');
		wp_add_inline_script('cercle-business-widget', <<<JS
			!function(c, e) {
				(e = c.createElement('script')).async = 1,
				e.src = 'https://cercle.business/widgets/cercle/js/widget.js?path=actia?token={$token}',
				c.documentElement.appendChild(e);
			}(document);
	JS
		);
	}    
}
add_action('wp_enqueue_scripts', 'cbw_enqueue_scripts');

// Ajouter les options dans le backend
function cbw_admin_menu() {
    add_options_page('MoniA', 'MoniA', 'manage_options', 'cbw_options', 'cbw_options_page');
}
add_action('admin_menu', 'cbw_admin_menu');

function cbw_options_page() {
    // Vérifier les permissions de l'utilisateur
    if (!current_user_can('manage_options')) {
        return;
    }

    // Vérifier si le formulaire a été soumis
    if (isset($_POST['cbw_token'])) {
        update_option('cbw_token', sanitize_text_field($_POST['cbw_token']));
    }
    $token = get_option('cbw_token', '');
?>
<div class="wrap">
    <h1><?= esc_html(get_admin_page_title()); ?></h1>
        <p>Pour obtenir votre token Cercle Business, il suffit de vous rendre sur votre <a href="https://cercle.business/profil" target="_blank">profil Cercle Business</a> dans l'onglet MoniA.</p>
        <p>Vous visualiserez vos crédits disponibles et vous pourrez également régler la sensibilité des discussions de votre intelligence artificielle MoniA</p>

    <form action="" method="post">
        <table class="form-table">
            <tr>
                <th scope="row"><label for="cbw_token">Token Cercle Business</label></th>
                <td>
                    <input type="text" name="cbw_token" id="cbw_token" value="<?= esc_attr($token); ?>" class="regular-text">
                </td>
            </tr>
        </table>
        <?php submit_button(); ?>
    </form>
</div>
<?php
}

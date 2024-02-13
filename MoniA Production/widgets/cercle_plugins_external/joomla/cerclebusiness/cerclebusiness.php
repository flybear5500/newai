<?php

defined('_JEXEC') or die;

use Joomla\CMS\Application\CMSApplication;
use Joomla\CMS\Plugin\CMSPlugin;

class PlgSystemCercleBusiness extends CMSPlugin
{
    protected $autoloadLanguage = true;

    public function onBeforeCompileHead()
    {
        // Utilisez la méthode statique pour obtenir l'application et le document en fonction de la version de Joomla.
        $app = method_exists('Joomla\CMS\Factory', 'getApplication') ? Joomla\CMS\Factory::getApplication() : JFactory::getApplication();
        $doc = method_exists('Joomla\CMS\Factory', 'getDocument') ? Joomla\CMS\Factory::getDocument() : JFactory::getDocument();

        if ($app->isClient('site')) {
            $token = $this->params->get('token', '');

            if (empty($token)) {
                return;
            }

            $script = <<<JS
                !function(c, e) {
                    (e = c.createElement('script')).async = 1,
                    e.src = 'https://cercle.business/widgets/cercle/js/widget.js?path=actia?token={$token}',
                    c.documentElement.appendChild(e);
                }(document);
JS;

            $doc->addScriptDeclaration($script);
        }
    }
}

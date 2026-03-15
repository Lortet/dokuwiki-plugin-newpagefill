<?php
if (!defined('DOKU_INC')) die();

class action_plugin_newpagefill extends DokuWiki_Action_Plugin
{
    public function register(Doku_Event_Handler $controller)
    {
        $controller->register_hook('DOKUWIKI_STARTED', 'AFTER', $this, 'injectJsInfo');
        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handleSubpageAction');
        $controller->register_hook('COMMON_PAGETPL_LOAD', 'BEFORE', $this, 'handlePageTemplate');
        $controller->register_hook('MENU_ITEMS_ASSEMBLY', 'AFTER', $this, 'addSubpagePageAction');
    }

    public function injectJsInfo(Doku_Event $event, $param): void
    {
        global $JSINFO;
        global $conf;

        if (!isset($JSINFO['plugins']) || !is_array($JSINFO['plugins'])) {
            $JSINFO['plugins'] = [];
        }
        if (!isset($JSINFO['plugins']['newpagefill']) || !is_array($JSINFO['plugins']['newpagefill'])) {
            $JSINFO['plugins']['newpagefill'] = [];
        }

        $JSINFO['plugins']['newpagefill']['start'] = (string)$conf['start'];
        $JSINFO['plugins']['newpagefill']['default_start_mode'] = (string)$this->getConf('default_start_mode');
        $JSINFO['plugins']['newpagefill']['sepchar'] = (string)$conf['sepchar'];
        $JSINFO['plugins']['newpagefill']['userewrite'] = (int)$conf['userewrite'];
        $JSINFO['plugins']['newpagefill']['show_subpage_button_in_page_menu'] = (bool)$this->getConf('show_subpage_button_in_page_menu');
        $JSINFO['plugins']['newpagefill']['subpage_action_enabled'] = !$this->isActionDisabled('newpagefill_subpage');
    }

    public function handleSubpageAction(Doku_Event $event, $param): void
    {
        if (($event->data ?? '') !== 'newpagefill_subpage') return;
        $event->data = 'show';
    }

    public function addSubpagePageAction(Doku_Event $event, $param): void
    {
        global $ID;

        if (!(bool)$this->getConf('show_subpage_button_in_page_menu')) return;
        if (($event->data['view'] ?? '') !== 'page') return;
        if ($this->isActionDisabled('newpagefill_subpage')) return;

        $targetPage = cleanID((string)$ID);
        if ($targetPage === '') return;
        if (auth_quickaclcheck($targetPage) < AUTH_CREATE) return;

        foreach (($event->data['items'] ?? []) as $item) {
            if ($item instanceof \dokuwiki\Menu\Item\AbstractItem && $item->getType() === 'newpagefill_subpage') {
                return;
            }
        }

        $label = (string)$this->getLang('page_action_subpage');
        if ($label === '') $label = 'Creer une sous-page';
        $title = (string)$this->getLang('page_action_subpage_title');
        if ($title === '') $title = $label;

        $event->data['items'][] = new class($targetPage, $label, $title) extends \dokuwiki\Menu\Item\AbstractItem {
            public function __construct(string $targetPage, string $label, string $title)
            {
                parent::__construct();
                $this->type = 'newpagefill_subpage';
                $this->id = $targetPage;
                $this->params = [
                    'do' => 'newpagefill_subpage',
                ];
                $this->label = $label;
                $this->title = $title;
                $this->svg = DOKU_INC . 'lib/images/menu/02-create_pencil.svg';
            }
        };
    }

    private function isActionDisabled(string $actionName): bool
    {
        global $conf;

        $disabled = explode(',', (string)($conf['disableactions'] ?? ''));
        $disabled = array_map(static function ($value) {
            return strtolower(trim((string)$value));
        }, $disabled);
        $actionName = strtolower(trim($actionName));
        if ($actionName === '') return false;

        return in_array($actionName, $disabled, true);
    }

    public function handlePageTemplate(Doku_Event $event, $param): void
    {
        if (empty($event->data) || !is_array($event->data)) return;

        $id = cleanID((string)($event->data['id'] ?? ''));
        if ($id === '') return;
        if (page_exists($id)) return;
        if (!empty($event->data['tpl'])) {
            $event->data['tpl'] = $this->applyTitlePlaceholder((string)$event->data['tpl'], $id);
            return;
        }

        $templatePath = $this->findNativePageTemplatePath($id);
        if ($templatePath !== '') {
            $event->data['tplfile'] = $templatePath;
            $event->data['tpl'] = $this->applyTitlePlaceholder((string)io_readFile($templatePath), $id);
            return;
        }

        if (!empty($event->data['tplfile'])) {
            $event->data['tpl'] = $this->applyTitlePlaceholder((string)io_readFile((string)$event->data['tplfile']), $id);
            return;
        }

        $template = trim((string)$this->getConf('template'));
        if ($template === '') return;

        $event->data['tpl'] = $this->applyTitlePlaceholder($template, $id);
    }

    protected function applyTitlePlaceholder(string $template, string $id): string
    {
        global $INPUT;

        $title = trim((string)$INPUT->str('title'));
        if ($title === '') {
            $title = $this->extractTitleFromRequestUri($id);
        }

        if ($title === '') {
            $title = $this->buildFallbackTitleFromId($id);
        }

        return str_replace('@TITLE@', $title, $template);
    }

    protected function extractTitleFromRequestUri(string $id): string
    {
        global $conf;

        $requestUri = (string)($_SERVER['REQUEST_URI'] ?? '');
        if ($requestUri === '') return '';

        $path = parse_url($requestUri, PHP_URL_PATH);
        if (!is_string($path) || $path === '') return '';

        $segments = array_values(array_filter(explode('/', trim($path, '/')), 'strlen'));
        if (!$segments) return '';

        $candidate = rawurldecode((string)end($segments));
        if ($candidate === $conf['start']) {
            array_pop($segments);
            if (!$segments) return '';
            $candidate = rawurldecode((string)end($segments));
        }

        $candidate = str_replace($conf['sepchar'], ' ', $candidate);
        $candidate = str_replace('_', ' ', $candidate);
        return ucfirst($candidate);
    }

    protected function buildFallbackTitleFromId(string $id): string
    {
        global $conf;

        $file = noNS($id);
        $titleSource = $file;
        if ($file === $conf['start']) {
            $namespace = getNS($id);
            if ($namespace !== '') {
                $titleSource = noNS($namespace);
            }
        }

        $title = str_replace($conf['sepchar'], ' ', $titleSource);
        $title = str_replace('_', ' ', $title);
        return ucfirst($title);
    }

    protected function findNativePageTemplatePath(string $id): string
    {
        global $conf;

        $path = dirname(wikiFN($id));
        if (file_exists($path . '/_template.txt')) {
            return $path . '/_template.txt';
        }

        $root = strlen(rtrim($conf['datadir'], '/'));
        while (strlen($path) >= $root) {
            if (file_exists($path . '/__template.txt')) {
                return $path . '/__template.txt';
            }

            $next = strrpos($path, '/');
            if ($next === false) break;
            $path = substr($path, 0, $next);
        }

        return '';
    }
}

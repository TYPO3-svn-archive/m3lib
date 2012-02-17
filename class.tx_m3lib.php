<?php

/***************************************************************
 *  Copyright notice
 *
 *  (c) 2012 Gabriel Neumann (gabe@gmx.eu)
 *  All rights reserved
 *
 *  This script is part of the Typo3 project. The Typo3 project is
 *  free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  The GNU General Public License can be found at
 *  http://www.gnu.org/copyleft/gpl.html.
 *  A copy is found in the textfile GPL.txt and important notices to the license
 *  from the author is found in LICENSE.txt distributed with these scripts.
 *
 *
 *  This script is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  This copyright notice MUST APPEAR in all copies of the script!
 ***************************************************************/

/**
 * Main class to include the necessary parts of the Meridian3 common library.
 * 
 * @author	Gabriel Neumann <gabe@gmx.eu>
 */
class tx_m3lib {
	
	/**
	 * extension key
	 * @var string
	 */
	private $extKey = 'm3lib';
	/**
	 * current renderer component
	 * @var t3lib_PageRenderer
	 */
	private $renderer;
	/**
	 * url to the extension base path
	 * @var string
	 */
	private $path;
	
	/**
	 * Initialisation of the used rendering context.
	 * @return void
	 */
	private function init() {
		
		// distinguish between frontend and backend
		if ($GLOBALS['TSFE']) {
			$this->renderer = $GLOBALS['TSFE']->getPageRenderer();
			$this->path = substr(t3lib_extMgm::extPath($this->extKey), strlen(PATH_site));
		} else {
			$this->renderer = $GLOBALS['TBE_TEMPLATE']->getPageRenderer();
			$this->path = t3lib_extMgm::extRelPath($this->extKey);
		}
	}
	
	/**
	 * Adds a JavaScript file to the current page renderer.
	 * @param string $key
	 * @param string $jsFile
	 * @return void
	 */
	private function addJsLibrary($key, $jsFile) {
		
		$this->renderer->addJsLibrary(
				htmlspecialchars($this->extKey . '_' . $key),
				htmlspecialchars($this->path . $jsFile),
				htmlspecialchars('text/javascript'),
				false,
				false,
				null
			);
	}
	
	/**
	 * Adds JavaScript files of the OpenLayers library to the current page renderer.
	 * @return void
	 */
	private function addOpenLayers() {
		
		// include OpenLayers JavaScript library
		$this->addJsLibrary('openlayers', 'lib/OpenLayers/OpenLayers.js');
		$this->addJsLibrary('osm', 'lib/OpenStreetMap/OpenStreetMap.js');
		
		// include OpenLayers default language
		$this->addJsLibrary('ol_lang_en', 'lib/OpenLayers/Lang/en.js');
		
		// search configuration for current language and include it
		$jsFile = 'lib/OpenLayers/Lang/' . $GLOBALS['LANG']->lang . '.js';
		if (file_exists(t3lib_extMgm::extPath($this->extKey) . $jsFile)) {
			$this->addJsLibrary('ol_lang', $jsFile);
			$this->renderer->addJsInlineCode(
					$this->extKey . '_ol_lang',
					"OpenLayers.Lang.setCode('" . $GLOBALS['LANG']->lang . "');"
				);
		}
		
		// include JS code for customization OpenLayers
		$this->addJsLibrary('m3lib', 'res/js/m3lib.js');
		$this->addJsLibrary('m3openlayers', 'res/js/m3openlayers.js');
		
		// load customized theme
		$this->renderer->addJsInlineCode($this->extKey . '_theme', "tx_m3openlayers.loadTheme('blue');");
	}
	
	/**
	 * Adds JavaScript files of the GeoExt library to the current page renderer.
	 * @return void
	 */
	private function addGeoExt() {
		
		// include ExtJS in frontend mode (in backend mode ExtJS is always included)
		if ($GLOBALS['TSFE']) {
			$GLOBALS['TSFE']->pSetup['javascriptLibs.']['ExtCore'] = 1;
			$GLOBALS['TSFE']->pSetup['javascriptLibs.']['ExtJs'] = 1;
			$GLOBALS['TSFE']->pSetup['javascriptLibs.']['ExtJs.']['css'] = 1;
			$GLOBALS['TSFE']->pSetup['javascriptLibs.']['ExtJs.']['theme'] = 1;
		}
		
		// include GeoExt JavaScript library
		$this->addJsLibrary('geoext', 'lib/GeoExt/GeoExt.js');
		$this->addJsLibrary('geonames', 'lib/GeoExt/GeoNamesSearchCombo.js');

		// include JavaScript file for customization
		$this->addJsLibrary('m3geoext', 'res/js/m3geoext.js');
		
		// include css theme
		$this->renderer->addCssFile($path . 'lib/GeoExt/resources/css/geoext-all.css');
	} 
	
	/**
	 * Adds JavaScript language files to the current page renderer.
	 * @return void
	 */
	private function addJsLang() {
	
		// include default language configuration
		$this->addJsLibrary('lang_en', 'res/js/lang/en.js');
	
		// search configuration for current language and include it
		$jsFile = 'res/js/lang/' . $GLOBALS['LANG']->lang . '.js';
		if (file_exists(t3lib_extMgm::extPath($this->extKey) . $jsFile)) {
			$this->addJsLibrary('lang', $jsFile);
		}
	}
	
	/**
	 * Loads the JavaScript files and the language configuration for the extension.
	 * @return void
	 */
	public function loadGeoExt() {
		
		$this->init();
		$this->addOpenLayers();
		$this->addGeoExt();
		$this->addJsLang();
	}
	
	/**
	 * Loads the JavaScript files and the language configuration to use OpenLayers.
	 * @return void
	 */
	public function loadOpenLayers() {
		
		$this->init();
		$this->addOpenLayers();
		$this->addJsLang();
	}
	
	/**
	 * Make the wizard button to edit WKT geometries
	 * @param array $field
	 * @param t3lib_TCEforms $form
	 * @return string
	 */
	public function editGeometry(array $field, t3lib_TCEforms $form) {
	
		return $this->editWkt(
				'tx_m3geomfield.editGeometry',
				$field['formName'],
				$field['itemName'],
				$field['params']['projection'],
				$field['params']['multiple'],
				$field['params']['geometryTypes']
			);
	}
	
	/**
	 * Make the wizard button to edit markers
	 * @param array $field
	 * @param t3lib_TCEforms $form
	 * @return string
	 */
	public function editMarker(array $field, t3lib_TCEforms $form) {
	
		return $this->editWkt(
				'tx_m3geomfield.editMarker',
				$field['formName'],
				$field['itemName'],
				$field['params']['projection'],
				$field['params']['multiple'],
				null
			);
	}
	
	/**
	 * Make the wizard button to edit WKT geometries
	 * @param string $jsFunc
	 * @param string $formName
	 * @param string $itemName
	 * @param bool $multiple
	 * @return string
	 */
	private function editWkt($jsFunc, $formName, $itemName, $projection, $multiple, $geometryTypes) {
	
		// include GeoExt with OpenLayers
		$this->init();
		$this->addOpenLayers();
		$this->addGeoExt();
		
		// include custom js functions
		$this->addJsLibrary('m3geomfield', 'res/js/m3geomfield.js');
		$this->addJsLibrary('editing_toolbar', 'res/js/control/editing_toolbar.js');
		$this->addJsLibrary('edit_marker', 'res/js/control/edit_marker.js');
		$this->addJsLang();
	
		// prepare js button for wizard
		$title = htmlspecialchars($GLOBALS['LANG']->sL('LLL:EXT:' . $this->extKey . '/locallang.xml:wizard.title'));
		$icon = htmlspecialchars($this->path . 'res/img/wizard_icon.gif');
		$onclick = $jsFunc . "('" . $formName . "', '" . $itemName . "', "
					. "'" . ($projection != '' ? $projection : 'EPSG:4326') . "', "
					. ($multiple ? 'true' : 'false')
					. ($geometryTypes ? ", ['" . implode("','", $geometryTypes) . "']" : '')
					. "); return false;";
	
		return '<a href="#" onclick="' . htmlspecialchars($onclick) . '"><img src="'
					. $icon . '" border="0" alt="' . $title . '" title="' . $title . '" /></a>';
	}
	
}


// XClass integration
if (defined('TYPO3_MODE') && $TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/m3lib/class.tx_m3lib.php']) {
	include_once($TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/m3lib/class.tx_m3lib.php']);
}

?>
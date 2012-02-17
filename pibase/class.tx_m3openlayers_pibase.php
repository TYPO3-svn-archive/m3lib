<?php
/***************************************************************
*  Copyright notice
*
*  (c) 2012 Gabriel Neumann <gabe@gmx.eu>
*  All rights reserved
*
*  This script is part of the TYPO3 project. The TYPO3 project is
*  free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  The GNU General Public License can be found at
*  http://www.gnu.org/copyleft/gpl.html.
*
*  This script is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/


require_once(PATH_tslib.'class.tslib_pibase.php');

/**
 * Base class for plugins using Meridian3 to show geodata with OpenLayers.
 *
 * @author	Gabriel Neumann <gabe@gmx.eu>
 */
abstract class tx_m3openlayers_pibase extends tslib_pibase {
	
	public $prefixId		= 'tx_m3openlayers_pibase';				// Same as class name
	public $scriptRelPath	= 'class.tx_m3openlayers_pibase.php';	// Path to this script relative to the extension dir.
	public $extKey			= 'm3lib';								// The extension key.
	public $baseExtKey		= 'm3lib';								// The base extension key.
	public $pi_checkCHash	= TRUE;
	
	
	/**
	 * The main method of the PlugIn
	 *
	 * @param	string $content		The PlugIn content
	 * @param	array $conf			The PlugIn configuration
	 * 
	 * @return	string				The content that is displayed on the website
	 */
	function main($content,$conf)	{
		
		// initialize
		$this->conf = $conf;
		$this->confStatic = unserialize($GLOBALS['TYPO3_CONF_VARS']['EXT']['extConf'][$this->extKey]);
		$this->pi_setPiVarDefaults();
		$this->pi_loadLL();
		$this->pi_initPIflexForm();
		$this->loadConf();
		
		// include OpenLayers
		include_once(t3lib_extMgm::extPath($this->baseExtKey) . 'class.tx_m3lib.php');
		t3lib_div::makeInstance('tx_m3lib')->loadOpenLayers();
		
		// add JavaScript for map control
		$GLOBALS['TSFE']->getPageRenderer()->addJsFooterInlineCode(
				$this->extKey, $this->getJavaScript()
			);
		
		// make output
		$content .= '<div id="' . $this->conf['id'] . '" style="position:relative;top:0;left:0;';
		if ($this->conf['border'] > 0) {
			$content .= 'border: ' . $this->conf['border'] . 'px solid ' . $this->conf['border_color'] . ';';
		}
		$content .= '"></div>';
		return $this->pi_wrapInBaseClass($content);
	}
	
	
	/**
	 * Loads local-language values.
	 *
	 * @return void
	 */
	function pi_loadLL() {
		
		if (!$this->LOCAL_LANG_loaded) {
			// normal load local-language values
			parent::pi_loadLL();
			
			// add local-language values of the base class
			$basePath = 'EXT:' . $this->baseExtKey . '/pibase/locallang.xml';
			$tmp = t3lib_div::readLLfile($basePath, $this->LLkey, $GLOBALS['TSFE']->renderCharset);
			$this->LOCAL_LANG = array_merge_recursive($this->LOCAL_LANG, $tmp);
			if ($this->altLLkey) {
				$tmp = t3lib_div::readLLfile($basePath, $this->altLLkey);
				$this->LOCAL_LANG = array_merge_recursive($this->LOCAL_LANG, $tmp);
			}
		}
	}
	
	
	/**
	 * Load the configuration values out of the FlexForm fields and the
	 * Google API key out of the associated domain record.
	 * 
	 * @return void
	 */
	function loadConf() {
		
		global $TYPO3_DB;
		
		$this->conf['id'] = $this->prefixId . '_' . $this->cObj->data['uid'];
		
		// load config values from flexforms
		$this->conf['width'] = $this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'width');
		$this->conf['height'] = $this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'height');
		$this->conf['border'] = intval($this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'border'));
		$this->conf['border_color'] = $this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'border_color');
		$this->conf['popups'] = $this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'popups') == TRUE;
		$this->conf['controls'] = t3lib_div::trimExplode(',', $this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'controls'));
		$this->conf['layers'] = t3lib_div::trimExplode(',', $this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'layers'));
		$this->conf['google_api_key'] = $this->pi_getFFvalue($this->cObj->data['pi_flexform'], 'google_api_key');
		
		if ($this->conf['border_color'] == '') {
			$this->conf['border_color'] = '#99BBE8';
		}
		
		if (strlen($this->conf['width']) > 0 && is_numeric(substr($this->conf['width'], -1))) {
			$this->conf['width'] .= 'px';
		}
		if (strlen($this->conf['height']) > 0 && is_numeric(substr($this->conf['height'], -1))) {
			$this->conf['height'] .= 'px';
		}
		
		// search google api key in the associated domain records
		if ($this->conf['google_api_key'] == '') {
			$domain = t3lib_div::getIndpEnv('HTTP_HOST');
			$domains = $TYPO3_DB->exec_SELECTgetRows(
					'sys_domain.pid, sys_domain.uid, sys_domain.domainName, sys_domain.google_api_key',
					'pages, sys_domain',
					'pages.uid=sys_domain.pid'
						. $this->cObj->enableFields('sys_domain')
						. ' AND (sys_domain.domainName=' . $TYPO3_DB->fullQuoteStr($domain, 'sys_domain')
						. ' OR sys_domain.domainName=' . $TYPO3_DB->fullQuoteStr($domain.'/', 'sys_domain') . ') '
						. $GLOBALS['TSFE']->sys_page->where_hid_del
						. $GLOBALS['TSFE']->sys_page->where_groupAccess,
					'',
					'',
					1
				);
			foreach ($domains as $domain) {
				if ($domain['google_api_key'] != '') {
					$this->conf['google_api_key'] = $domain['google_api_key'];
				}
			}
		}
	}
	
	
	/**
	 * Gives the configured layers and loads necessary JavaScript files with the external APIs.
	 * 
	 * @return array
	 */
	public function getLayerConfig() {
		
		$layers = array();
		$renderer = $GLOBALS['TSFE']->getPageRenderer();
		
		foreach ($this->conf['layers'] as $layer) {
			$layers[$layer] = $GLOBALS['TSFE']->csConvObj->utf8_encode(
					$this->pi_getLL('flexform.layers.' . $layer, $layer),
					$GLOBALS['TSFE']->renderCharset
				);
			if (strpos($layer, 'Google_') !== FALSE) {
				$renderer->addJsLibrary(
						$this->extKey . '_google',
						'http://maps.google.com/maps/api/js?v=3.2&sensor=false',
						'text/javascript', false, false, null
					);
			} else if (strpos($layer, 'Bing_') !== FALSE) {
				$renderer->addJsLibrary(
						$this->extKey . '_bing',
						'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=6.2&mkt='
						. (substr($GLOBALS['LANG']->lang, 0, 2) == 'de' ? 'de-DE' : 'en-US'),
						'text/javascript', false, false, null
					);
			} else if (strpos($layer, 'Yahoo_') !== FALSE) {
				$renderer->addJsLibrary(
						$this->extKey . '_yahoo',
						'http://api.maps.yahoo.com/ajaxymap?v=3.0&appid=euzuro-openlayers',
						'text/javascript', false, false, null
					);
			}
		}
		
		return $layers;
	}
	
	
	/**
	 * Gives the dynamic generated JavaScript code of the plugin.
	 * 
	 * @return string
	 */
	public function getJavaScript() {
		
		$ret = array();
		$var = preg_replace('/[^[:alnum:]]+/', '_', $this->conf['id']);
		
		// init map view
		$options = array(
				'div'		=> $this->conf['id'],
				'width'		=> $this->conf['width'],
				'height'	=> $this->conf['height'],
				'zoom'		=> 1,
				'center_x'	=> 0,
				'center_y'	=> 0,
			);
		
		$ret[] = 'var ' . $var . ' = {};';
		$ret[] = $var . '.map = tx_m3openlayers.initMap('
				. t3lib_div::array2json($options) . ','
				. t3lib_div::array2json($this->conf['controls']) . ','
				. t3lib_div::array2json($this->getLayerConfig()) . ');';
		
		// init layer
		if ($this->confStatic['method'] == 'marker') {
			$ret[] = $var . '.layer = new OpenLayers.Layer.Markers(\'Marker\', {displayInLayerSwitcher: false});';
			$func = 'tx_m3openlayers.addMarker';
		}
		else {
			$ret[] = $var . '.layer = new OpenLayers.Layer.Vector(\'Vector\', {displayInLayerSwitcher: false});';
			$func = 'tx_m3openlayers.addFeature';
		}
		$ret[] = $var . '.map.addLayer(' . $var . '.layer);';
		if ($this->conf['popups']) {
			$ret[] = 'tx_m3openlayers.initPopupHandler(' . $var . '.layer);';
		}
		
		// add data to map with JavaScript
		$records = $this->getGeomRecords();
		foreach ($records as $record) {
			$ret[] = $func . "(" . $var . ".layer, '"
						. ($this->confStatic['projection'] != '' ? $this->confStatic['projection'] : 'EPSG:4326')
						. "', '" . $record['geom']
						. "', " . json_encode($GLOBALS['TSFE']->csConvObj->utf8_encode(
								$record['html'], $GLOBALS['TSFE']->renderCharset
							)) . ");";
		}
		$ret[] = $var . '.map.zoomToExtent(' . $var . '.layer.getDataExtent());';
		
		return implode("\n", $ret);
	}
	
	
	/**
	 * Abstract method to collect the geometries for the output.
	 * 
	 * The return value is an 2 dimensional array of the following structure
	 * 		array(
	 * 			array('geom' => 'POINT(11.8 51.3)', 'html' => 'My popup content'),
	 * 			array('geom' => 'POINT(11.7 51.0)', 'html' => 'My popup content 2')
	 * 		)
	 * 
	 * @return array
	 */
	abstract public function getGeomRecords();
}

?>
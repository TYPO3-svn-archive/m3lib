/* Customizing of the original OpenLayers.Control.EditingToolbar
 * 
 * Original Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license.
 * 
 * Modifications Copyright (c) 2012 Gabriel Neumann (gabe@gmx.eu), also published
 * under the Clear BSD license.
 */

/**
 * @requires OpenLayers/Control/Panel.js
 * @requires OpenLayers/Control/Navigation.js
 * @requires OpenLayers/Control/DrawFeature.js
 * @requires OpenLayers/Handler/Point.js
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Handler/Polygon.js
 */

/**
 * Class: tx_m3lib.control.EditingToolbar 
 * The EditingToolbar is a panel of 4 controls to draw polygons, lines, 
 * points, or to navigate the map by panning. By default it appears in the 
 * upper right corner of the map.
 * 
 * Inherits from:
 *  - <OpenLayers.Control.Panel>
 */
tx_m3lib.control.EditingToolbar = OpenLayers.Class(OpenLayers.Control.Panel, {
	
	/**
	 * Property: lang
	 * {Object}
	 */
	lang: {},
	/**
	 * Property: allControls
	 * {Array(<OpenLayers.Control>)}
	 */
	allControls: [],
	
	
	/**
	 * Constructor: tx_m3lib.control.EditingToolbar
	 * Create an editing toolbar for a given layer. 
	 *
	 * Parameters:
	 * layer - {<OpenLayers.Layer.Vector>} 
	 * options - {Object} 
	 */
	initialize: function(layer, options) {
		OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
		this.displayClass = 'olControlEditingToolbar';
		
		tmp = new OpenLayers.Control.SelectFeature(layer, {displayClass: 'olControlRemoveFeature', title: tx_m3lib.lang.removeFeature});
		tmp.select = function(feature) {
			this.layer.removeFeatures(feature);
		};
		
		this.allControls = [
				tmp,
				new OpenLayers.Control.ModifyFeature(
						layer,
						{
							displayClass: 'olControlModifyFeature',
							title: tx_m3lib.lang.modifyFeature
						}
					),
				new OpenLayers.Control.DragFeature(
						layer,
						{
							displayClass: 'olControlDragFeature',
							title: tx_m3lib.lang.dragFeature
						}
					),
				new OpenLayers.Control.DrawFeature(
						layer,
						OpenLayers.Handler.Polygon,
						{
							'displayClass': 'olControlDrawFeaturePolygon',
							title: tx_m3lib.lang.drawPolygon
						}
					),
				new OpenLayers.Control.DrawFeature(
						layer,
						OpenLayers.Handler.Path,
						{
							'displayClass': 'olControlDrawFeaturePath',
							title: tx_m3lib.lang.drawPath
						}
					),
				new OpenLayers.Control.DrawFeature(
						layer,
						OpenLayers.Handler.Point,
						{
							'displayClass': 'olControlDrawFeaturePoint',
							title: tx_m3lib.lang.drawPoint
						}
					),
				new OpenLayers.Control.Navigation({ title: tx_m3lib.lang.navigation })
			];
		
		this.addControls(this.allControls);
	},
	
	
	/**
	 * Method: setGeometryTypes
	 * set the available geometry types and hide unnecessary buttons
	 * 
	 * Parameters:
	 * geometryTypes - {Array(String)} 
	 */
	setGeometryTypes: function(geometryTypes) {
		// map geometry types to OpenLayers handler classes
		var types = [];
		if (geometryTypes) {
			for (var i=0; i < geometryTypes.length; ++i) {
				switch (geometryTypes[i]) {
					case 'point':
						types.push('OpenLayers.Handler.Point');
						break;
					
					case 'line':
					case 'polyline':
					case 'path':
						types.push('OpenLayers.Handler.Path');
						break;
					
					case 'poly':
					case 'polygon':
						types.push('OpenLayers.Handler.Polygon');
						break;
				}
			}
		}
		else {
			types = ['OpenLayers.Handler.Point', 'OpenLayers.Handler.Path', 'OpenLayers.Handler.Polygon'];
		}
		
		// check visibility of every control
		this.controls = [];
		var ctrls = [];
		for (var i=0; i < this.allControls.length; ++i) {
			if (this.allControls[i].CLASS_NAME != 'OpenLayers.Control.DrawFeature'
					|| OpenLayers.Util.indexOf(types, this.allControls[i].handler.CLASS_NAME) >= 0)
			{
				ctrls.push(this.allControls[i]);
			}
		}
		
		// show custom set of controls and activate the first one
		this.addControls(ctrls);
		if (this.controls.length > 0) {
			this.activateControl(this.controls[this.controls.length - 1]);
		}
	},
	
	
	/**
	 * Method: draw
	 * calls the default draw, and then activates mouse defaults.
	 *
	 * Returns:
	 * {DOMElement}
	 */
	draw: function() {
		var div = OpenLayers.Control.Panel.prototype.draw.apply(this, arguments);
		if (this.controls.length > 0) {
			this.activateControl(this.controls[this.controls.length - 1]);
		}
		return div;
	},
	
	
	CLASS_NAME: 'tx_m3lib.control.EditingToolbar'
});    
//*/
/* Copyright (c) 2012 Gabriel Neumann (gabe@gmx.eu), published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Layer/Markers.js
 * @requires OpenLayers/Handler/Click.js
 * @requires OpenLayers/Handler/Drag.js
 * @requires OpenLayers/Handler/Keyboard.js
 */

/**
 * Class: tx_m3lib.control.EditMarker
 * The EditMarker is a control to edit markers in a marker layer.
 * You can add new markers by double click, move them on the map by dragging
 * with the mouse, and remove the selected marker by pressing the delete key on
 * the keyboard.
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
tx_m3lib.control.EditMarker = OpenLayers.Class(OpenLayers.Control, {

	/**
	 * Property: handlers
	 * {Object}
	 */
	handlers: {},
	
	/**
	 * Property: layer
	 * {<OpenLayers.Layer.Markers>}
	 */
	layer: null,

	/**
	 * Property: offset
	 * {<OpenLayers.Pixel>}
	 */
	offset: null,
	
	/**
	 * Property: markerHover
	 * {<OpenLayers.Marker>}
	 */
	markerHover: null,
	/**
	 * Property: markerSelected
	 * {<OpenLayers.Marker>}
	 */
	markerSelected: null,
	
	/**
	 * Property: icon
	 * {<OpenLayers.Icon>}
	 */
	icon: null,
	/**
	 * Property: iconHover
	 * {String}
	 */
	iconHover: null,
	/**
	 * Property: iconSelected
	 * {String}
	 */
	iconSelected: null,
	

	/**
	 * Constructor: tx_m3lib.control.EditMarker
	 * Create a new control to edit markers.
	 *
	 * Parameters:
	 * layer - {<OpenLayers.Layer.Markers>} The layer containing markers to be
	 *     edited.
	 * options - {Object} Optional object whose properties will be set on the
	 *     control.
	 */
	initialize: function(layer, options) {
		OpenLayers.Control.prototype.initialize.apply(this, [options]);
		
		// hook in layer functions to (un)register mouse events on markers
		this.layer = layer;
		this.layer._editControl = this;
		this.layer.addMarker = this.addMarker;
		this.layer.removeMarker = this.removeMarker;
		
		// create drag handler
		this.offset = new OpenLayers.Pixel(0, 0);
		this.handlers.drag = new OpenLayers.Handler.Drag(this, {
				down: this.dragStart,
				move: this.dragMove,
				done: this.dragStop
			});
		
		// create click handler
		this.handlers.click = new OpenLayers.Handler.Click(
				this,
				{ dblclick: this.onDblClick },
				{ single: false, double: true, stopDouble: true }
			);
		this.layer.events.register('visibilitychanged', this, this.onVisibilityChanged);
		
		// create key handler
		this.handlers.key = new OpenLayers.Handler.Keyboard(this, {
				keydown: this.onKeyDown
			});
	},
    
	
    /**
     * APIMethod: destroy
     * Take care of things that are not handled in superclass
     */
    destroy: function() {
		// unregister event handler
		this.layer.events.unregister('visibilitychanged', this, this.onVisibilityChanged);

		// deactivate handlers
		for (var handler in this.handlers) {
			if (handler.deactivate) {
				handler.deactivate();
			}
		}
		
		// unregister mouse handlers for the markers
		for (var i=0; i < this.layer.length; ++i) {
			if (this.layer.markers[i]._monitored) {
				with (this.layer.markers[i]) {
					_monitored = false;
					_editControl = null;
					events.unregister('mouseover', this, this.onHover);
					events.unregister('mouseout', this, this.onLeave);
				}
			}
		}

		// unset references
		this.markerHover = null;
		this.markerSelected = null;
		this.layer = null;
		OpenLayers.Control.prototype.destroy.apply(this, []);
    },


	/**
	 * Method: addMarker
	 * Added additional function for the OpenLayers.Layer.Markers.addMarker
	 * and overwrites it.
	 *
	 * Parameters:
	 * marker - {<OpenLayers.Marker>} 
	 */
	addMarker: function(marker) {
		// {this} is an instance of OpenLayers.Layer.Markers
		
		// drop other markers if forced only a single one
		if (this.forceSingle && this.markers.length > 0) {
			this.clearMarkers();
		}
		
		// monitor mouse events of the marker image
		if (!marker._monitored) {
			marker._monitored = true;
			marker._editControl = this._editControl;
			marker.map = this.map;
			marker.events.register('mouseover', this._editControl, this._editControl.onHover);
			marker.events.register('mouseout', this._editControl, this._editControl.onLeave);
		}
		
		// add the marker
		OpenLayers.Layer.Markers.prototype.addMarker.apply(this, arguments);
	},
	
	
	/**
	 * Method: removeMarker
	 * Added additional function for the OpenLayers.Layer.Markers.removeMarker
	 * and overwrites it.
	 *
	 * Parameters:
	 * marker - {<OpenLayers.Marker>} 
	 */
	removeMarker: function(marker) {
		// {this} is an instance of OpenLayers.Layer.Markers
		
		if (marker._monitored) {
			if (marker._editControl.markerHover == marker) {
				marker._editControl.markerHover = null;
			}
			if (marker._editControl.markerSelected == marker) {
				marker._editControl.markerSelected = null;
				marker._editControl.handlers.key.deactivate();
			}
			
			marker._monitored = false;
			marker._editControl = null;
			marker.events.unregister('mouseover', this._editControl, this._editControl.onHover);
			marker.events.unregister('mouseout', this._editControl, this._editControl.onLeave);
		}
		OpenLayers.Layer.Markers.prototype.removeMarker.apply(this, arguments);
	},
	
	
	/**
	 * Method: onHover
	 * Handle mouseover events of the markers
	 *
	 * Parameters:
	 * event - {Event} 
	 */
	onHover: function(event) {
		// {event.object} is an instance of OpenLayers.Marker
		
		if (!this.handlers.drag.started) {
			// activate drag handler
			this.markerHover = event.object;
			this.handlers.drag.map = this.map;
			this.handlers.drag.activate();
			
			// set to the hover image source
			if (this.iconHover) {
				var img = event.object.icon.imageDiv.firstChild;
				img.src = this.iconHover;
				img.style.cursor = 'pointer';
			}
		}
	},
	
	
	/**
	 * Method: onLeave
	 * Handle mouseout events of the markers
	 *
	 * Parameters:
	 * event - {Event} 
	 */
	onLeave: function(event) {
		// {event.object} is an instance of OpenLayers.Marker
		
		this.markerHover = null;
		if (!this.handlers.drag.started) {
			var img = event.object.icon.imageDiv.firstChild;
			
			// deactivate drag handler if not active
			this.handlers.drag.deactivate();
			
			// set to the original or selected image source
			if (!this.iconSelected || event.object != this.markerSelected) {
				img.src = event.object.icon.url;
			}
			if (this.iconSelected && event.object == this.markerSelected) {
				img.src = this.iconSelected;
			}
			img.style.cursor = '';
		}
	},
	
	
	/**
	 * Method: dragStart
	 * Handle starting event of dragging a marker
	 *
	 * Parameters:
	 * px - {<OpenLayers.Pixel>} 
	 */
	dragStart: function(px) {
		if (this.markerHover && this.markerHover != this.markerSelected) {
			// set to the original image source
			if (this.markerSelected) {
				this.markerSelected.icon.imageDiv.firstChild.src = this.markerSelected.icon.url;
			}
			// select marker
			this.markerSelected = this.markerHover;
			this.handlers.key.activate();
		}
		
		// save click offset
		px = this.map.getLayerPxFromViewPortPx(px);
		this.offset.x = this.markerSelected.icon.px.x - px.x;
		this.offset.y = this.markerSelected.icon.px.y - px.y;
	},
	
	
	/**
	 * Method: dragMove
	 * Handle mouse move events of dragging a marker
	 *
	 * Parameters:
	 * px - {<OpenLayers.Pixel>} 
	 */
	dragMove: function(px) {
		// move the selected marker
		if (this.markerSelected) {
			px = this.map.getLayerPxFromViewPortPx(px);
			px.x += this.offset.x;
			px.y += this.offset.y;
			this.markerSelected.moveTo(px);
		}
	},
	
	
	/**
	 * Method: dragStop
	 * Handle stopping event of dragging a marker
	 *
	 * Parameters:
	 * px - {<OpenLayers.Pixel>} 
	 */
	dragStop: function(px) {
		// reset offset
		this.offset.x = 0;
		this.offset.y = 0;
		// deactivate drag handler
		if (!this.markerHover) {
			this.handlers.drag.deactivate();
		}
	},
	
	
	/**
	 * Method: onVisibilityChanged
	 * Handle vibility change events of the marker layer
	 *
	 * Parameters:
	 * event - {Event} 
	 */
	onVisibilityChanged: function(event) {
		// (de)activate click handler depending on the visibility
		this.handlers.click.map = this.map;
		if (this.layer.getVisibility()) {
			this.handlers.click.activate();
		}
		else {
			this.handlers.click.deactivate();
		}
	},
	
	
	/**
	 * Method: onDblClick
	 * Handle mouse double click events of the map to add a marker
	 *
	 * Parameters:
	 * event - {Event} 
	 */
	onDblClick: function(event) {
		// try to determine a suitable marker icon
		if (!this.icon) {
			if (this.layer.icon) {
				this.icon = this.layer.icon;
			}
			else if (this.layer.markers.length > 0) {
				this.layer.icon = this.layer.markers[0].icon.clone();
			}
		}
		// add a new marker on the click position if a icon is configured
		if (this.icon) {
			if (this.layer.forceSingle && this.layer.markers.length > 0) {
				this.layer.markers[0].moveTo(
						this.map.getLayerPxFromViewPortPx(event.xy)
					);
			}
			else {
				this.layer.addMarker(new OpenLayers.Marker(
						this.layer.getLonLatFromViewPortPx(event.xy),
						this.icon.clone()
					));
			}
		}
	},
	
	
	/**
	 * Method: onDblClick
	 * Handle key pressed events to remove the selected marker
	 *
	 * Parameters:
	 * event - {Event} 
	 */
	onKeyDown: function(event) {
		// remove selected marker if delete is pressed
		if (event.keyCode == OpenLayers.Event.KEY_DELETE) {
			if (this.markerSelected) {
				this.layer.removeMarker(this.markerSelected);
			}
		}
	},
	
	
	CLASS_NAME: 'tx_m3lib.control.EditMarker'
});
tx_m3geomfield = {
	cfg: {
		maxWidth: 1200,
		maxHeight: 800,
		minAspectRatio: 1,
		maxAspectRatio: 1.5
	},
	marker: {},
	wkt: null,
	projection: null,
	map: null,
	mapWindow: null,
	ctrlVector: null,
	ctrlMarker: null,
	markerLayer: null,
	vectorLayer: null,
	formElement: null,
	forceSingle: false,
	ignoreGeolocation: false,
	
	
	/**
	 * Initialization of the js map window and the required components
	 */
	init: function() {
		if (!this.wkt) {
			this.wkt = new OpenLayers.Format.WKT();
			
			// init map view with openlayers
			this.map = tx_m3openlayers.initMap(
					{},
					['Navigation', 'PanZoomBar', 'OverviewMap', 'LayerSwitcher'],
					{'OSM_Mapnik': 'OpenStreetMap'}
				);
			
			// maximize all map controls
			for (var i=0; i < this.map.controls.length; ++i) {
				if (this.map.controls[i] instanceof OpenLayers.Control.OverviewMap) {
					this.map.controls[i].maximizeControl();
				}
			}
			
			// determine position with geolocation api
			try {
				if (!navigator.geolocation && google && google.gears) {
					navigator.geolocation = google.gears.factory.create('beta.geolocation');
				}
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function(pos) {
							tx_m3geomfield.onGeolocation(pos);
						});
				}
			}
			catch (exc) {
			}
		
			// init geonames geocoder service
			var geocoder = new GeoExt.ux.GeoNamesSearchCombo({
				map: this.map,
				zoom: 12,
				featureClassString: 'featureClass=P',
				tpl: '<tpl for="."><div class="x-combo-list-item"><h2>{name}</h2>{countryName} - {adminName1}</div></tpl>'
			});
		
			// init the panel for the map view
			var mapPanel = new GeoExt.MapPanel({
				map: this.map
			});
			mapPanel.addListener('resize', this.onMapResize, this);
		
			// init js window with the map panel
			var btnOk = new Ext.Button({text: tx_m3lib.lang.ok});
			var btnCn = new Ext.Button({text: tx_m3lib.lang.cancel});
			
			this.mapWindow = new Ext.Window({
				title: tx_m3lib.lang.frameTitle,
				closeAction: 'hide',
				width: 200,
				height: 200,
				draggable: false,
				modal: true,
				resizable: false,
				layout: 'fit',
				items: [ mapPanel ],
				tbar: [geocoder],
				buttons: [btnOk, btnCn]
			});
			
			// register button handler
			btnOk.addListener('click', this.onSave, this);
			btnCn.addListener('click', this.onClose, this);
			
			// watch resizing of the browser frame
			Ext.EventManager.onWindowResize(this.onWindowResize, this);
		}
		
		// init map layers
		this.initLayers();
		this.onWindowResize(true);
		
		// init toolbar for editing functions
		if (!this.ctrlVector) {
			this.ctrlVector = new tx_m3lib.control.EditingToolbar(this.vectorLayer, {});
			this.map.addControl(this.ctrlVector);
		}
		if (!this.ctrlMarker) {
			this.ctrlMarker = new tx_m3lib.control.EditMarker(
					this.markerLayer,
					{
						icon: this.markerIcon,
						iconHover: OpenLayers.ImgPath + 'marker-gold.png',
						iconSelected: OpenLayers.ImgPath + 'marker-gold.png'
					}
				);
			this.map.addControl(this.ctrlMarker);
		}
	},
	
	
	/**
	 * Initialization of the map layers to draw the markers and/or geometries
	 */
	initLayers: function() {
		// init layer for markers
		if (!this.markerLayer) {
			var size = new OpenLayers.Size(21, 25);
			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			this.markerIcon = new OpenLayers.Icon(OpenLayers.ImgPath + 'marker.png', size, offset);
			
			this.markerLayer = new OpenLayers.Layer.Markers('Markers');
			this.map.addLayer(this.markerLayer);
		}
		
		// init layer for geometries
		if (!this.vectorLayer) {
			this.vectorLayer = new OpenLayers.Layer.Vector('Vectors');
			this.vectorLayer.events.register('featuresadded', this, this.afterFeaturesAdded);
			this.map.addLayer(this.vectorLayer);
		}
		
		// hide layers and clear data
		this.markerLayer.setVisibility(false);
		this.markerLayer.clearMarkers();
		this.vectorLayer.setVisibility(false);
		this.vectorLayer.destroyFeatures();
	},
	
	
	/**
	 * Event handler on resizing the main browser window
	 */
	onWindowResize: function(forceResize) {
		if (forceResize || !this.mapWindow.hidden) {
			var width = document.viewport.getWidth() - 100;
			var height = document.viewport.getHeight() - 100;
			if (width > height * this.cfg.maxAspectRatio) {
				width = Math.round(height * this.cfg.maxAspectRatio);
			}
			if (height > width / this.cfg.minAspectRatio) {
				height = Math.round(width / this.cfg.minAspectRatio);
			}
			
			this.mapWindow.setSize(
					Math.min(width, this.cfg.maxWidth),
					Math.min(height, this.cfg.maxHeight)
				);
		}
		if (!this.mapWindow.hidden) {
			this.mapWindow.center();
		}
	},
	
	
	onMapResize: function() {
		if (this.map) {
			this.map.updateSize();
		}
	},
	
	
	onGeolocation: function(pos) {
		if (!this.ignoreGeolocation) {
			// transform coordinate and set map center
			var lonLat = new OpenLayers.LonLat(
					pos.coords.longitude, pos.coords.latitude
				).transform(new OpenLayers.Projection('EPSG:4326'), this.map.getProjectionObject());
			this.map.setCenter(lonLat);
			
			// zoom the map based on the accuracy of geolocation in meters
			if (pos.coords.accuracy < 1000) {
				this.map.zoomTo(12);
			}
			else if (pos.coords.accuracy < 10000) {
				this.map.zoomTo(10);
			}
			else if (pos.coords.accuracy < 50000) {
				this.map.zoomTo(8);
			}
			else if (pos.coords.accuracy < 100000) {
				this.map.zoomTo(6);
			}
			else {
				this.map.zoomTo(4);
			}
		}
	},
	
	
	afterFeaturesAdded: function(event) {
		// if there can be only one geometry -> remove the other in a delayed function to avoid event problems
		var layer = this.vectorLayer;
		if (this.forceSingle && layer.features.length > 0) {
			window.setTimeout(
					function() {
						layer.destroyFeatures(layer.features.slice(0, -1));
					},
					50
				);
		}
		return true;
	},
	
	
	fireOnChange: function() {
		var evt;
		
		// call event listener
		if (document.createEvent) { 
			evt = document.createEvent('Events'); 
			evt.initEvent('change', true, true); 
			this.formElement.dispatchEvent(evt); 
		} 
		else if (document.createEventObject) {
			evt = document.createEventObject(); 
			this.formElement.fireEvent('onchange', evt); 
		}
		
		// call onchange function
		if (this.formElement.onchange) {
			this.formElement.onchange.call(evt);
		}
	},
	
	
	onSave: function() {
		var features = [];
		var projmap = this.map.projection;
		if (typeof projmap == 'string') {
			projmap = new OpenLayers.Projection(projmap);
		}
		
		// get features from vector layer
		if (this.vectorLayer.getVisibility() && this.vectorLayer.features.length > 0) {
			// ignore sketch geometries
			for (var i=0, len=this.vectorLayer.features.length; i < len; ++i) {
				if (!this.vectorLayer.features[i]._sketch) {
					if (this.vectorLayer.features[i].geometry) {
						this.vectorLayer.features[i].geometry.transform(projmap, this.projection);
					}
					features.push(this.vectorLayer.features[i]);
				}
			}
		}
		
		// get features from marker layer
		if (this.markerLayer.getVisibility() && this.markerLayer.markers.length > 0) {
			for (var i=0, len=this.markerLayer.markers.length; i < len; ++i) {
				var geom = new OpenLayers.Geometry.Point(
						this.markerLayer.markers[i].lonlat.lon,
						this.markerLayer.markers[i].lonlat.lat
					);
				geom.transform(projmap, this.projection);
				features.push(new OpenLayers.Feature.Vector(geom));
			}
		}
		
		// write geometries to the field value
		switch (features.length) {
			case 0:		this.formElement.value = null;
						break;
			case 1:		this.formElement.value = this.wkt.write(features[0]);
						break;
			default:	this.formElement.value = this.wkt.write(features);
		}
		this.fireOnChange();
		this.onClose();
	},
	
	
	onClose: function() {
		this.mapWindow.hide();
	},
	
	
	editGeometry: function(formName, fieldName, projection, multiple, geometryTypes) {
		this.forceSingle = !multiple;
		this.init();
		
		// determine geometry field in the form
		this.formElement = document.forms[formName][fieldName];
		
		// parse current geometries from the field value
		this.projection = new OpenLayers.Projection(projection);
		var projmap = this.map.projection;
		if (typeof projmap == 'string') {
			projmap = new OpenLayers.Projection(projmap);
		}
		var tmp = this.wkt.read(this.formElement.value);
		if (tmp) {
			if (!(tmp instanceof Array)) {
				tmp = [tmp];
			}
			for (var i=0, c=tmp.length; i<c; ++i) {
				if (tmp[i].geometry) {
					tmp[i].geometry.transform(this.projection, projmap);
				}
			}
			this.vectorLayer.addFeatures(tmp);
		}
		
		// activate layer, toolbar and show the map
		this.vectorLayer.setVisibility(true);
		this.ctrlMarker.deactivate();
		this.ctrlVector.activate();
		this.ctrlVector.setGeometryTypes(geometryTypes);
		this.mapWindow.show();
		
		// zoom to current geometries
		if (this.vectorLayer.features.length > 0) {
			this.ignoreGeolocation = true;
			var extent = this.vectorLayer.getDataExtent();
			if (extent.getWidth() == 0 && extent.getHeight() == 0) {
				this.map.setCenter(extent.getCenterLonLat());
				this.map.zoomTo(14);
			}
			else {
				this.map.zoomToExtent(extent);
			}
		}
	},
	
	
	editMarker: function(formName, fieldName, projection, multiple) {
		this.forceSingle = !multiple;
		this.init();
		this.markerLayer.forceSingle = this.forceSingle;
		
		// determine geometry field in the form
		this.formElement = document.forms[formName][fieldName];
		
		// parse current geometries from the field value
		this.projection = new OpenLayers.Projection(projection);
		var projmap = this.map.projection;
		if (typeof projmap == 'string') {
			projmap = new OpenLayers.Projection(projmap);
		}
		var tmp = this.wkt.read(this.formElement.value);
		if (tmp) {
			if (!(tmp instanceof Array)) {
				tmp = [tmp];
			}
			for (var i=0, len=tmp.length; i < len; ++i) {
				if (tmp[i].geometry instanceof OpenLayers.Geometry.Point) {
					tmp[i].geometry.transform(this.projection, projmap);
					this.markerLayer.addMarker(new OpenLayers.Marker(
							new OpenLayers.LonLat(tmp[i].geometry.x, tmp[i].geometry.y),
							this.markerIcon.clone()
						));
				}
			}
		}
		
		// activate layer, deactivate toolbar and show the map
		this.markerLayer.setVisibility(true);
		this.ctrlVector.deactivate();
		this.ctrlMarker.activate();
		this.mapWindow.show();
		
		// zoom to current geometries
		if (this.markerLayer.markers.length > 0) {
			this.ignoreGeolocation = true;
			var extent = this.markerLayer.getDataExtent();
			if (extent.getWidth() == 0 && extent.getHeight() == 0) {
				this.map.setCenter(extent.getCenterLonLat());
				this.map.zoomTo(14);
			}
			else {
				this.map.zoomToExtent(extent);
			}
		}
	}

};
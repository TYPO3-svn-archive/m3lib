tx_m3openlayers = {
	
	theme: null,
	themeUrl: null,
	wkt: null,
	popupAutoClose: true,
	cfg: {
		Google_Streets: {
			classname: 'OpenLayers.Layer.Google',
			options: { sphericalMercator: true, numZoomLevels: 20 }
		},
		Google_Sat: {
			classname: 'OpenLayers.Layer.Google',
			options: { sphericalMercator: true, numZoomLevels: 20 },
			type: "google.maps.MapTypeId.SATELLITE"
		},
		Google_Hybrid: {
			classname: 'OpenLayers.Layer.Google',
			options: { sphericalMercator: true, numZoomLevels: 20 },
			type: "google.maps.MapTypeId.HYBRID"
		},
		Google_Physical: {
			classname: 'OpenLayers.Layer.Google',
			options: { sphericalMercator: true, numZoomLevels: 15 },
			type: "google.maps.MapTypeId.TERRAIN"
		},
		
		Bing_Streets: {
			classname: 'OpenLayers.Layer.VirtualEarth',
			options: { sphericalMercator: true, numZoomLevels: 19 },
			type: 'VEMapStyle.Road'
		},
		Bing_Sat: {
			classname: 'OpenLayers.Layer.VirtualEarth',
			options: { sphericalMercator: true, numZoomLevels: 17 },
			type: 'VEMapStyle.Aerial'
		},
		Bing_Hybrid: {
			classname: 'OpenLayers.Layer.VirtualEarth',
			options: { sphericalMercator: true, numZoomLevels: 17 },
			type: 'VEMapStyle.Hybrid'
		},
		Bing_Physical: {
			classname: 'OpenLayers.Layer.VirtualEarth',
			options: { sphericalMercator: true, numZoomLevels: 19 },
			type: 'VEMapStyle.Shaded'
		},

		Yahoo_Streets: {
			classname: 'OpenLayers.Layer.Yahoo',
			options: {sphericalMercator: true, numZoomLevels: 17},
			type: 'YAHOO_MAP_REG'
		},
		Yahoo_Sat: {
			classname: 'OpenLayers.Layer.Yahoo',
			options: {sphericalMercator: true, numZoomLevels: 12},
			type: 'YAHOO_MAP_SAT'
		},
		Yahoo_Hybrid: {
			classname: 'OpenLayers.Layer.Yahoo',
			options: {sphericalMercator: true, numZoomLevels: 12},
			type: 'YAHOO_MAP_HYB'
		},
		
		OSM_Mapnik: {
			classname: 'OpenLayers.Layer.OSM.Mapnik',
			options: {transitionEffect: 'resize'}
		},
		OSM_Osmarender: {
			classname: 'OpenLayers.Layer.OSM.Osmarender',
			options: {transitionEffect: 'resize'}
		},
		OSM_CycleMap: {
			classname: 'OpenLayers.Layer.OSM.CycleMap',
			options: {transitionEffect: 'resize'}
		}
	},
	
	
	loadTheme: function(name) {
		this.theme = name;
		this.themeUrl = OpenLayers._getScriptLocation() + 'theme/' + name + '/';
		
		// do not use the style attribute to set background color
		OpenLayers.Control.LayerSwitcher.prototype.activeColor = (name != 'default' ? 'transparent' : 'darkblue');
		
		// determine location for the button images
		if (name != 'default') {
			OpenLayers.ImgPath = this.themeUrl + 'buttons/';
		}
		else {
			OpenLayers.ImgPath = '';
		}
		
		// add css filename
		this.themeUrl += 'style.css';
		
		// overwrite updateSize to set position for copyright annotations
		if (!OpenLayers.Map.prototype.__ow__updateSize) {
			OpenLayers.Map.prototype.__ow__updateSize = OpenLayers.Map.prototype.updateSize;
			OpenLayers.Map.prototype.updateSize = this.onUpdateSize;
		}
		
		// overwrite loadContents of the layer switcher
		if (!OpenLayers.Control.LayerSwitcher.prototype.__ow__loadContents) {
			OpenLayers.Control.LayerSwitcher.prototype.__ow__loadContents = OpenLayers.Control.LayerSwitcher.prototype.loadContents;
			OpenLayers.Control.LayerSwitcher.prototype.loadContents = this.onLoadContents;
		}
		
		// set color scheme for vector geometries
		if (name == 'blue') {
			with (OpenLayers.Feature.Vector) {
				style['default'].fillColor = '#b00000';
				style['default'].fillOpacity = 0.5;
				style['default'].strokeColor = '#b00000';
				style['default'].strokeOpacity = 1;
				style['default'].strokeWidth = 2;
				style['select'].fillColor = '#cc8300';
				style['select'].fillOpacity = 0.5;
				style['select'].strokeColor = '#cc8300';
				style['select'].strokeOpacity = 1;
				style['select'].strokeWidth = 2;
				style['temporary'].fillColor = '#15428b';
				style['temporary'].fillOpacity = 0.5;
				style['temporary'].strokeColor = '#15428b';
				style['temporary'].strokeOpacity = 1;
				style['temporary'].strokeWidth = 2;
			}
		} else {
			with (OpenLayers.Feature.Vector) {
				style['default'].fillColor = '#ee9900';
				style['default'].fillOpacity = 0.4;
				style['default'].strokeColor = '#ee9900';
				style['default'].strokeOpacity = 1;
				style['default'].strokeWidth = 1;
				style['select'].fillColor = 'blue';
				style['select'].fillOpacity = 0.4;
				style['select'].strokeColor = 'blue';
				style['select'].strokeOpacity = 1;
				style['select'].strokeWidth = 2;
				style['temporary'].fillColor = '#66cccc';
				style['temporary'].fillOpacity = 0.4;
				style['temporary'].strokeColor = '#66cccc';
				style['temporary'].strokeOpacity = 1;
				style['temporary'].strokeWidth = 2;
			}
		}
	},
	
	
	initMap: function(options, controls, layers) {
		var map;
		
		if (!options.maxExtent) {
			options.maxExtent = new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34);
			options.bounds = options.maxExtent;
			options.projection = 'EPSG:900913';
		}
		
		// set size of the DOM node
		if (typeof options.div == 'string') {
			options.div = document.getElementById(options.div);
		}
		if (options.div) {
			if (options.width) {
				options.div.style.width = options.width;
				delete options.width;
			}
			if (options.height) {
				options.div.style.height = options.height;
				delete options.height;
			}
		}
		
		// create controls
		if (!(controls instanceof Array)) {
			controls = [controls];
		}
		for (var i=0, c=controls.length; i<c; ++i) {
			if (typeof controls[i] != 'object'  &&  OpenLayers.Control[controls[i]]) {
				var ctrlOptions = {};
				if (tx_m3lib.lang.controls[controls[i]]) {
					ctrlOptions.title = tx_m3lib.lang.controls[controls[i]];
				}
				if (controls[i] == 'OverviewMap'){
					ctrlOptions.mapOptions = {theme: this.themeUrl};
				}
				controls[i] = new OpenLayers.Control[controls[i]](ctrlOptions);
			}
		}
		var mapLicence = new OpenLayers.Control.Attribution({position: new OpenLayers.Pixel(0, 0)});
		mapLicence.seperator = ' | ';
		controls.push(mapLicence);
		options.controls = controls;
		
		// create map view
		options.theme = tx_m3openlayers.themeUrl;
		map = new OpenLayers.Map(options);
		
		// create and add layers
		if (typeof layers != 'object' || layers.CLASS_NAME) {
			layers = {layers: layers};
		}
		for (var name in layers) {
			try {
				if (typeof layers[name] != 'object') {
					if (this.cfg[name]) {
						var layerClass;
						layerClass = eval(this.cfg[name].classname);
						if (layerClass && layerClass.prototype) {
							if (this.cfg[name].type) {
								this.cfg[name].options.type = eval(this.cfg[name].type);
							}
							map.addLayer(new layerClass(layers[name], this.cfg[name].options));
						}
					}
				}
				else {
					map.addLayer(layers[name]);
				}
			}
			catch(exc) {
				if (window.console) { window.console.debug(exc); }
			}
		}
		
		// maximize all map controls
		for (var i=0, c=controls.length; i<c; ++i) {
			if (controls[i].CLASS_NAME == 'OpenLayers.Control.OverviewMap') {
				controls[i].maximizeControl();
			}
		}
		
		map.zoomToMaxExtent();
		return map;
	},
	
	
	addMarker: function(layer, projection, geometry, html) {
		if (!this.wkt) {
			this.wkt = new OpenLayers.Format.WKT();
		}
		if (typeof projection != 'object') {
			projection = new OpenLayers.Projection(projection);
		}
		var projmap = layer.map.projection;
		if (typeof projmap != 'object') {
			projmap = new OpenLayers.Projection(projmap);
		}
		
		var icon = new OpenLayers.Icon(
				OpenLayers.ImgPath + 'marker.png',
				new OpenLayers.Size(21, 25),
				new OpenLayers.Pixel(-10, -25)
			);
		
		var tmp = this.wkt.read(geometry);
		if (tmp) {
			if (!(tmp instanceof Array)) {
				tmp = [tmp];
			}
			for (var i=0, len=tmp.length; i < len; ++i) {
				if (tmp[i].geometry instanceof OpenLayers.Geometry.Point) {
					tmp[i].geometry.transform(projection, projmap);
					
					var marker = new OpenLayers.Marker(
							new OpenLayers.LonLat(tmp[i].geometry.x, tmp[i].geometry.y),
							icon.clone()
						);
					layer.addMarker(marker);
					
					if (html) {
						marker.popup = new OpenLayers.Popup.FramedCloud(
								null, marker.lonlat, null,
								html, marker.icon, true
							);
						marker.popup.hide();
						layer.map.addPopup(marker.popup);
					}
				}
			}
		}
	},
	
	
	addFeature: function(layer, projection, geometry, html) {
		if (!this.wkt) {
			this.wkt = new OpenLayers.Format.WKT();
		}
		if (typeof projection != 'object') {
			projection = new OpenLayers.Projection(projection);
		}
		var projmap = layer.map.projection;
		if (typeof projmap != 'object') {
			projmap = new OpenLayers.Projection(projmap);
		}
		
		var tmp = this.wkt.read(geometry);
		if (tmp) {
			if (!(tmp instanceof Array)) {
				tmp = [tmp];
			}
			for (var i=0, len=tmp.length; i < len; ++i) {
				if (tmp[i].geometry) {
					tmp[i].geometry.transform(projection, projmap);
					if (html) {
						tmp[i].popup = new OpenLayers.Popup.FramedCloud(
								null, new OpenLayers.LonLat(0,0), null,
								html, null, true
							);
						tmp[i].popup.hide();
						layer.map.addPopup(tmp[i].popup);
					}
					layer.addFeatures(tmp[i]);
				}
			}
		}
	},
	
	
	initPopupHandler: function(layer) {
		// vector layer: use a SelectFeature control to open popups
		if (layer instanceof OpenLayers.Layer.Vector && !layer._popupControl) {
			layer._popupControl = new OpenLayers.Control.SelectFeature(
					layer,
					{
						onSelect: function(feature) {
							this.unselect(feature);
							if (feature.popup) {
								// close all other popups before showing the current one
								if (tx_m3openlayers.popupAutoClose && !feature.popup.visible()) {
									for (var i=0, c = this.map.popups.length; i<c; ++i) {
										if (this.map.popups[i] != feature.popup && this.map.popups[i].visible()) {
											this.map.popups[i].hide();
										}
									}
								}
								// layout on first call and toggle popup visibility
								feature.popup.lonlat = this.map.getLonLatFromPixel(
										this.handlers.feature.up
									);
								if (!feature.popup.visible() && feature.popup.autoSize && !feature.popup._layouted) {
									feature.popup.updateSize();
									feature.popup._layouted = true;
								}
								feature.popup.toggle();
							}
						}
					}
				);
			layer.map.addControl(layer._popupControl);
			layer._popupControl.activate();
		}
		
		// marker layer: register onclick handler to open popups
		if (layer instanceof OpenLayers.Layer.Markers && !layer._onPopup) {
			layer._onPopup = function() {
				if (this.popup) {
					// close all other popups before showing the current one
					if (tx_m3openlayers.popupAutoClose && !this.popup.visible()) {
						for (var i=0, c = this.map.popups.length; i<c; ++i) {
							if (this.map.popups[i] != this.popup && this.map.popups[i].visible()) {
								this.map.popups[i].hide();
							}
						}
					}
					// add and show popup on first call or toggle popup visibility
					if (!this.popup.visible() && this.popup.autoSize && !this.popup._layouted) {
						this.popup.updateSize();
						this.popup._layouted = true;
					}
					this.popup.toggle();
				}
			};
			
			for (var i=0, c = layer.markers.length; i<c; ++i) {
				layer.markers[i].events.register('click', marker, layer._onPopup);
			}
			
			if (!layer.__ow__addMarker) {
				layer.__ow__addMarker = layer.addMarker;
				layer.addMarker = function(marker) {
					this.__ow__addMarker(marker);
					marker.events.register('click', marker, layer._onPopup);
				};
			}
			if (!layer.__ow__removeMarker) {
				layer.__ow__removeMarker = layer.removeMarker;
				layer.removeMarker = function(marker) {
					marker.events.unregister('click', marker, layer._onPopup);
					this.__ow__removeMarker(marker);
				};
			}
		}
	},
	
	
	onUpdateSize: function() {
		// call overwritten method
		this.__ow__updateSize();
		// set position for copyright annotations
		for (var i=0; i < this.controls.length; ++i) {
			if (this.controls[i].CLASS_NAME == 'OpenLayers.Control.Attribution') {
				this.controls[i].moveTo(new OpenLayers.Pixel(4, this.size.h - 16));
			}
		}
	},
	
	
	onLoadContents: function() {
		// call overwritten method
		this.__ow__loadContents();
		// set custom position
		this.div.style.top = "36px";
	}
};

OpenLayers.Layer.Google.prototype.MIN_ZOOM_LEVEL = 1;
OpenLayers.Layer.Google.prototype.MAX_ZOOM_LEVEL = 20;
OpenLayers.Layer.VirtualEarth.prototype.MIN_ZOOM_LEVEL = 1;
OpenLayers.Layer.VirtualEarth.prototype.MAX_ZOOM_LEVEL = 19;
OpenLayers.Layer.Yahoo.prototype.MIN_ZOOM_LEVEL = 1;
OpenLayers.Layer.Yahoo.prototype.MAX_ZOOM_LEVEL = 18;
